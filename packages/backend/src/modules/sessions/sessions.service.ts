import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../config/prisma.service';
import { randomUUID } from 'crypto';

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);
  private readonly sessionExpiration: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.sessionExpiration = this.configService.get<string>('SESSION_EXPIRATION', '30d');
  }

  async createSession(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<any> {
    const token = randomUUID();
    const expiresAt = this.calculateExpiration();

    const session = await this.prisma.session.create({
      data: {
        userId,
        token,
        ipAddress,
        userAgent,
        expiresAt,
      },
    });

    this.logger.log(`Session created for user ${userId}`);
    return session;
  }

  async validateSession(token: string): Promise<any> {
    const session = await this.prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session) {
      throw new UnauthorizedException('Invalid session');
    }

    if (new Date() > session.expiresAt) {
      await this.revokeSession(token);
      throw new UnauthorizedException('Session expired');
    }

    return session;
  }

  async revokeSession(token: string): Promise<void> {
    await this.prisma.session.delete({
      where: { token },
    });

    this.logger.log(`Session revoked: ${token}`);
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    await this.prisma.session.deleteMany({
      where: { userId },
    });

    this.logger.log(`All sessions revoked for user ${userId}`);
  }

  async getUserSessions(userId: string): Promise<any[]> {
    return this.prisma.session.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  private calculateExpiration(): Date {
    const expirationDays = parseInt(this.sessionExpiration.replace('d', ''), 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expirationDays);
    return expiresAt;
  }

  async cleanupExpiredSessions(): Promise<void> {
    const result = await this.prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    this.logger.log(`Cleaned up ${result.count} expired sessions`);
  }
}
