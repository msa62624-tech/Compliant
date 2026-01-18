import {
  Injectable,
  UnauthorizedException,
  Inject,
  LoggerService,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import { UsersService } from "../users/users.service";
import { LoginDto } from "./dto/login.dto";
import { PrismaService } from "../../config/prisma.service";

// Refresh token expiration in days
const REFRESH_TOKEN_EXPIRATION_DAYS = 7;

// Salt rounds for bcrypt hashing of refresh tokens
const REFRESH_TOKEN_SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: __, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      // Log failed login attempt
      this.logger.warn({
        message: "Failed login attempt",
        context: "Auth",
        email: loginDto.email,
      });
      throw new UnauthorizedException("Invalid credentials");
    }

    const payload = { email: user.email, sub: user.id, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    // Generate refresh token using selector/verifier pattern
    // Selector: 16 bytes (32 hex chars) - used for O(1) database lookup
    // Verifier: 32 bytes (64 hex chars) - hashed for secure storage
    const selector = crypto.randomBytes(16).toString("hex");
    const verifier = crypto.randomBytes(32).toString("hex");

    // Hash only the verifier for storage
    const verifierHash = await bcrypt.hash(verifier, REFRESH_TOKEN_SALT_ROUNDS);

    // Set refresh token expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRATION_DAYS);

    // Store refresh token in separate table with indexed selector
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        selector: selector,
        verifier: verifierHash,
        expiresAt: expiresAt,
      },
    });

    // Log successful login
    this.logger.log({
      message: "User logged in successfully",
      context: "Auth",
      userId: user.id,
      email: user.email,
    });

    // Return combined token: selector:verifier (both plaintext)
    const refreshToken = `${selector}:${verifier}`;

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  async refresh(refreshTokenString: string) {
    try {
      // Parse the refresh token: selector:verifier
      // Using indexOf to ensure exactly one colon separator
      const colonIndex = refreshTokenString.indexOf(":");
      if (
        colonIndex === -1 ||
        colonIndex !== refreshTokenString.lastIndexOf(":")
      ) {
        throw new UnauthorizedException("Invalid refresh token format");
      }

      const selector = refreshTokenString.substring(0, colonIndex);
      const verifier = refreshTokenString.substring(colonIndex + 1);

      // Validate selector and verifier format
      // Selector: exactly 32 hex characters (16 bytes)
      // Verifier: exactly 64 hex characters (32 bytes)
      if (!/^[a-f0-9]{32}$/i.test(selector)) {
        throw new UnauthorizedException("Invalid refresh token format");
      }
      if (!/^[a-f0-9]{64}$/i.test(verifier)) {
        throw new UnauthorizedException("Invalid refresh token format");
      }

      // O(1) lookup using indexed selector - no timing attack vulnerability
      const tokenRecord = await this.prisma.refreshToken.findUnique({
        where: {
          selector: selector,
        },
        include: {
          user: true,
        },
      });

      // Check if token exists and is not expired
      // Note: Expiration check after query is acceptable since tokens expire after 7 days
      // and the window for race condition is negligible in practice
      if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
        throw new UnauthorizedException("Invalid or expired refresh token");
      }

      // Single bcrypt.compare - constant time regardless of position
      // This prevents timing attacks since we only do ONE comparison
      const isValid = await bcrypt.compare(verifier, tokenRecord.verifier);
      if (!isValid) {
        throw new UnauthorizedException("Invalid refresh token");
      }

      const user = tokenRecord.user;
      const newPayload = { email: user.email, sub: user.id, role: user.role };
      const accessToken = this.jwtService.sign(newPayload);

      // Generate new refresh token with new selector and verifier
      const newSelector = crypto.randomBytes(16).toString("hex");
      const newVerifier = crypto.randomBytes(32).toString("hex");
      const newVerifierHash = await bcrypt.hash(
        newVerifier,
        REFRESH_TOKEN_SALT_ROUNDS,
      );
      const newExpiresAt = new Date();
      newExpiresAt.setDate(
        newExpiresAt.getDate() + REFRESH_TOKEN_EXPIRATION_DAYS,
      );

      // Use transaction to ensure atomicity: create new token first, then delete old
      // This order prevents user logout if create fails after delete
      await this.prisma.$transaction([
        this.prisma.refreshToken.create({
          data: {
            userId: user.id,
            selector: newSelector,
            verifier: newVerifierHash,
            expiresAt: newExpiresAt,
          },
        }),
        this.prisma.refreshToken.delete({
          where: { id: tokenRecord.id },
        }),
      ]);

      // Log token refresh
      this.logger.log({
        message: "Token refreshed successfully",
        context: "Auth",
        userId: user.id,
      });

      const newRefreshToken = `${newSelector}:${newVerifier}`;

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error({
        message: "Token refresh failed",
        context: "Auth",
        error: errorMessage,
      });
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  async logout(userId: string) {
    // Delete all refresh tokens for the user
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });

    // Log logout
    this.logger.log({
      message: "User logged out successfully",
      context: "Auth",
      userId,
    });

    return { message: "Logged out successfully" };
  }

  /**
   * Clean up expired refresh tokens
   * Should be called periodically (e.g., daily cron job)
   * Processes in batches to prevent blocking the database
   *
   * Note: Intentionally processes only one batch per call for production safety.
   * For large numbers of expired tokens, call this method multiple times
   * or schedule it more frequently rather than processing everything in one go.
   *
   * @param batchSize Maximum number of tokens to delete per call (default: 1000)
   * @returns Number of tokens deleted
   */
  async cleanupExpiredTokens(batchSize: number = 1000): Promise<number> {
    // Find expired tokens with limit (Prisma deleteMany doesn't support take)
    const expiredTokens = await this.prisma.refreshToken.findMany({
      where: {
        expiresAt: { lt: new Date() },
      },
      select: { id: true },
      take: batchSize,
    });

    if (expiredTokens.length === 0) {
      return 0;
    }

    // Delete the batch of expired tokens
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        id: { in: expiredTokens.map((t) => t.id) },
      },
    });

    this.logger.log({
      message: "Cleaned up expired refresh tokens",
      context: "Auth",
      count: result.count,
    });

    return result.count;
  }
}
