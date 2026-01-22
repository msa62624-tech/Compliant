import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private connected = false;

  async onModuleInit() {
    // For Netlify with simple auth, database connection is optional
    const useSimpleAuth = process.env.USE_SIMPLE_AUTH === 'true';
    
    if (useSimpleAuth) {
      this.logger.log('Simple auth mode enabled - skipping database connection');
      return;
    }

    try {
      await this.$connect();
      this.connected = true;
      this.logger.log('Database connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect to database:', error);
      // Don't throw - allow app to start without database in simple auth mode
      if (!useSimpleAuth) {
        throw error;
      }
    }
  }

  async onModuleDestroy() {
    if (this.connected) {
      await this.$disconnect();
    }
  }
}
