import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSessionHistoryFields1732600000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add status column
    const hasStatusColumn = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'conversation_contexts'
        AND column_name = 'status'
      );
    `);

    if (!hasStatusColumn[0].exists) {
      await queryRunner.query(`
        ALTER TABLE "conversation_contexts"
        ADD COLUMN "status" VARCHAR(50) DEFAULT 'running'
      `);

      // Update existing records based on isActive
      await queryRunner.query(`
        UPDATE "conversation_contexts"
        SET "status" = CASE
          WHEN "isActive" = true THEN 'running'
          ELSE 'completed'
        END
      `);
    }

    // Add completedAt column
    const hasCompletedAtColumn = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'conversation_contexts'
        AND column_name = 'completedAt'
      );
    `);

    if (!hasCompletedAtColumn[0].exists) {
      await queryRunner.query(`
        ALTER TABLE "conversation_contexts"
        ADD COLUMN "completedAt" TIMESTAMP WITH TIME ZONE
      `);

      // Set completedAt for already completed sessions
      await queryRunner.query(`
        UPDATE "conversation_contexts"
        SET "completedAt" = "updatedAt"
        WHERE "isActive" = false
      `);
    }

    // Add completionReason column
    const hasCompletionReasonColumn = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'conversation_contexts'
        AND column_name = 'completionReason'
      );
    `);

    if (!hasCompletionReasonColumn[0].exists) {
      await queryRunner.query(`
        ALTER TABLE "conversation_contexts"
        ADD COLUMN "completionReason" VARCHAR(100)
      `);
    }

    // Create indexes for efficient queries
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_conversation_context_status"
      ON "conversation_contexts" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_conversation_context_completed_at"
      ON "conversation_contexts" ("completedAt")
      WHERE "completedAt" IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_conversation_context_chatbot_status"
      ON "conversation_contexts" ("chatbotId", "status")
    `);

    // Index for messages by conversation and timestamp (for efficient session message queries)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_messages_conversation_timestamp"
      ON "messages" ("conversationId", "timestamp")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_messages_conversation_timestamp"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_conversation_context_chatbot_status"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_conversation_context_completed_at"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_conversation_context_status"`,
    );
    await queryRunner.query(`
      ALTER TABLE "conversation_contexts"
      DROP COLUMN IF EXISTS "completionReason"
    `);
    await queryRunner.query(`
      ALTER TABLE "conversation_contexts"
      DROP COLUMN IF EXISTS "completedAt"
    `);
    await queryRunner.query(`
      ALTER TABLE "conversation_contexts"
      DROP COLUMN IF EXISTS "status"
    `);
  }
}
