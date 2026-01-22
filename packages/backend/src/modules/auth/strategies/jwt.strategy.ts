import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";
import { UsersService } from "../../users/users.service";

// Custom JWT extractor that tries both cookies and Authorization header
const cookieExtractor = (req: Request): string | null => {
  if (req && req.cookies) {
    return req.cookies["access_token"];
  }
  return null;
};

const jwtExtractor = (req: Request): string | null => {
  // Try cookie first, then fall back to Authorization header
  const tokenFromCookie = cookieExtractor(req);
  if (tokenFromCookie) {
    return tokenFromCookie;
  }
  return ExtractJwt.fromAuthHeaderAsBearerToken()(req);
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: jwtExtractor,
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("JWT_SECRET") as string,
      passReqToCallback: false,
    });
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    try {
      const user = await this.usersService.findOne(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      return user;
    } catch (error) {
      console.error('JWT validation error:', error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      // Log database/service errors but still throw unauthorized to prevent info leakage
      throw new UnauthorizedException('Authentication failed');
    }
  }
}
