import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTestSessionFields1764600000000 implements MigrationInterface {
  name = 'AddTestSessionFields1764600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add isTestSession column with default false
    // All existing records are real sessions, not tests
    await queryRunner.query(`
      ALTER TABLE "conversation_contexts"
      ADD COLUMN "isTestSession" boolean NOT NULL DEFAULT false
    `);

    // 2. Add testMetadata JSONB column (nullable - only for test sessions)
    await queryRunner.query(`
      ALTER TABLE "conversation_contexts"
      ADD COLUMN "testMetadata" jsonb
    `);

    // 3. Create partial index for test sessions (small subset of data)
    await queryRunner.query(`
      CREATE INDEX "IDX_conversation_contexts_test_session"
      ON "conversation_contexts" ("isTestSession")
      WHERE "isTestSession" = true
    `);

    // 4. Create composite index for production queries (exclude test sessions)
    await queryRunner.query(`
      CREATE INDEX "IDX_conversation_contexts_chatbot_not_test"
      ON "conversation_contexts" ("chatbotId", "status", "createdAt" DESC)
      WHERE "isTestSession" = false
    `);

    // 5. Create GIN index for testMetadata queries (optional, for searching within metadata)
    await queryRunner.query(`
      CREATE INDEX "IDX_conversation_contexts_test_metadata"
      ON "conversation_contexts" USING GIN ("testMetadata")
      WHERE "testMetadata" IS NOT NULL
    `);

    // 6. Add check constraint to ensure testMetadata only exists when isTestSession is true
    await queryRunner.query(`
      ALTER TABLE "conversation_contexts"
      ADD CONSTRAINT "CHK_test_metadata_consistency"
      CHECK (
        ("isTestSession" = false AND "testMetadata" IS NULL) OR
        ("isTestSession" = true)
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove check constraint
    await queryRunner.query(`
      ALTER TABLE "conversation_contexts"
      DROP CONSTRAINT IF EXISTS "CHK_test_metadata_consistency"
    `);

    // Remove indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_conversation_contexts_test_metadata"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_conversation_contexts_chatbot_not_test"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_conversation_contexts_test_session"
    `);

    // Remove columns
    await queryRunner.query(`
      ALTER TABLE "conversation_contexts"
      DROP COLUMN IF EXISTS "testMetadata"
    `);

    await queryRunner.query(`
      ALTER TABLE "conversation_contexts"
      DROP COLUMN IF EXISTS "isTestSession"
    `);
  }
}
