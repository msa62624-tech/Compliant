import { Injectable, Inject, LoggerService } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import { AuthService } from "../auth/auth.service";

/**
 * Service for scheduled tasks and background jobs
 * Handles automated maintenance tasks like token cleanup
 */
@Injectable()
export class TasksService {
  // Configuration for token cleanup batch processing
  private readonly BATCH_SIZE = 1000;
  private readonly BATCH_DELAY_MS = 1000; // 1 second between batches

  constructor(
    private authService: AuthService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  /**
   * Clean up expired refresh tokens daily at 2 AM
   * Runs automatically via cron scheduler
   * Processes in batches to prevent database overload
   *
   * Note: In multi-instance deployments, consider adding distributed locking
   * to prevent multiple instances from running cleanup simultaneously.
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleTokenCleanup() {
    this.logger.log({
      message: "Starting automated refresh token cleanup",
      context: "TasksService",
    });

    try {
      let totalDeleted = 0;
      let batchDeleted = 0;

      // Process in batches until no more expired tokens
      do {
        batchDeleted = await this.authService.cleanupExpiredTokens(
          this.BATCH_SIZE,
        );
        totalDeleted += batchDeleted;

        if (batchDeleted === this.BATCH_SIZE) {
          // More tokens to process, wait before next batch
          await new Promise((resolve) =>
            setTimeout(resolve, this.BATCH_DELAY_MS),
          );
        }
      } while (batchDeleted === this.BATCH_SIZE);

      this.logger.log({
        message: "Completed automated refresh token cleanup",
        context: "TasksService",
        totalDeleted,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error({
        message: "Failed to cleanup expired tokens",
        context: "TasksService",
        error: errorMessage,
      });
    }
  }
}
