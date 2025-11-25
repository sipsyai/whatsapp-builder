import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExpiresAtToConversationContext1732560000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if column exists first
    const hasColumn = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'conversation_contexts'
        AND column_name = 'expiresAt'
      );
    `);

    if (!hasColumn[0].exists) {
      await queryRunner.query(`
        ALTER TABLE "conversation_contexts"
        ADD COLUMN "expiresAt" TIMESTAMP WITH TIME ZONE
      `);
    }

    // Add index for efficient cleanup queries (if not exists)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_conversation_context_expires_at"
      ON "conversation_contexts" ("expiresAt")
      WHERE "expiresAt" IS NOT NULL AND "isActive" = true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_conversation_context_expires_at"`,
    );
    await queryRunner.query(`
      ALTER TABLE "conversation_contexts"
      DROP COLUMN IF EXISTS "expiresAt"
    `);
  }
}
