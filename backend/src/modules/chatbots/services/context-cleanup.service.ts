import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, IsNull, Not } from 'typeorm';
import { ConversationContext } from '../../../entities/conversation-context.entity';

/**
 * Context Cleanup Service
 * Handles automatic cleanup of expired conversation contexts
 * Runs as a scheduled task to deactivate contexts that have timed out
 */
@Injectable()
export class ContextCleanupService {
  private readonly logger = new Logger(ContextCleanupService.name);

  constructor(
    @InjectRepository(ConversationContext)
    private readonly contextRepo: Repository<ConversationContext>,
  ) {}

  /**
   * Run every minute to check for expired contexts
   * Contexts expire when:
   * - isActive is true
   * - expiresAt is set and in the past
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async cleanupExpiredContexts(): Promise<void> {
    const now = new Date();

    try {
      const expiredContexts = await this.contextRepo.find({
        where: {
          isActive: true,
          expiresAt: LessThan(now),
        },
      });

      if (expiredContexts.length === 0) {
        return;
      }

      this.logger.warn(
        `Found ${expiredContexts.length} expired context(s). Deactivating...`,
      );

      for (const context of expiredContexts) {
        context.isActive = false;
        context.expiresAt = null;

        // Clear any waiting states
        delete context.variables['__awaiting_flow_response__'];
        delete context.variables['__awaiting_variable__'];

        await this.contextRepo.save(context);

        this.logger.log(
          `Deactivated expired context ${context.id} for conversation ${context.conversationId}`,
        );
      }

      this.logger.log(
        `Successfully cleaned up ${expiredContexts.length} expired context(s)`,
      );
    } catch (error) {
      this.logger.error(
        `Error during context cleanup: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Manually trigger cleanup (for admin/debug purposes)
   */
  async forceCleanup(): Promise<number> {
    await this.cleanupExpiredContexts();

    const cleanedCount = await this.contextRepo.count({
      where: {
        isActive: false,
        expiresAt: Not(IsNull()),
      },
    });

    return cleanedCount;
  }

  /**
   * Get statistics about active and expired contexts
   */
  async getContextStats(): Promise<{
    activeContexts: number;
    expiredContexts: number;
    waitingForFlow: number;
    waitingForQuestion: number;
  }> {
    const now = new Date();

    const activeContexts = await this.contextRepo.count({
      where: { isActive: true },
    });

    const expiredContexts = await this.contextRepo.count({
      where: {
        isActive: true,
        expiresAt: LessThan(now),
      },
    });

    // Count contexts waiting for flow response
    const allActiveContexts = await this.contextRepo.find({
      where: { isActive: true },
    });

    const waitingForFlow = allActiveContexts.filter(
      (ctx) => ctx.variables['__awaiting_flow_response__'],
    ).length;

    const waitingForQuestion = allActiveContexts.filter(
      (ctx) => ctx.variables['__awaiting_variable__'],
    ).length;

    return {
      activeContexts,
      expiredContexts,
      waitingForFlow,
      waitingForQuestion,
    };
  }
}
