import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameFlowsToChatBots1763984202000 implements MigrationInterface {
  name = 'RenameFlowsToChatBots1763984202000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if flows table exists
    const flowsTableExists = await queryRunner.hasTable('flows');
    const chatbotsTableExists = await queryRunner.hasTable('chatbots');

    if (flowsTableExists && !chatbotsTableExists) {
      // Rename flows table to chatbots
      await queryRunner.query(`ALTER TABLE "flows" RENAME TO "chatbots"`);
    }

    // Check if flowId column exists in conversation_contexts
    const table = await queryRunner.getTable('conversation_contexts');
    const flowIdColumn = table?.findColumnByName('flowId');
    const chatbotIdColumn = table?.findColumnByName('chatbotId');

    if (flowIdColumn && !chatbotIdColumn) {
      // Rename flowId column to chatbotId
      await queryRunner.query(
        `ALTER TABLE "conversation_contexts" RENAME COLUMN "flowId" TO "chatbotId"`,
      );

      // Drop old foreign key constraint
      await queryRunner.query(
        `ALTER TABLE "conversation_contexts" DROP CONSTRAINT IF EXISTS "fk_conversation_context_flow"`,
      );

      // Add new foreign key constraint
      await queryRunner.query(
        `ALTER TABLE "conversation_contexts"
         ADD CONSTRAINT "fk_conversation_context_chatbot"
         FOREIGN KEY ("chatbotId") REFERENCES "chatbots"("id") ON DELETE CASCADE`,
      );

      // Update index names
      await queryRunner.query(
        `DROP INDEX IF EXISTS "idx_conversation_context_flow"`,
      );
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS "idx_conversation_context_chatbot" ON "conversation_contexts" ("chatbotId")`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverse: Rename chatbots table back to flows
    await queryRunner.query(`ALTER TABLE "chatbots" RENAME TO "flows"`);

    // Reverse: Rename chatbotId column back to flowId
    await queryRunner.query(
      `ALTER TABLE "conversation_contexts" RENAME COLUMN "chatbotId" TO "flowId"`,
    );

    // Drop new foreign key constraint
    await queryRunner.query(
      `ALTER TABLE "conversation_contexts" DROP CONSTRAINT IF EXISTS "fk_conversation_context_chatbot"`,
    );

    // Add back old foreign key constraint
    await queryRunner.query(
      `ALTER TABLE "conversation_contexts"
       ADD CONSTRAINT "fk_conversation_context_flow"
       FOREIGN KEY ("flowId") REFERENCES "flows"("id") ON DELETE CASCADE`,
    );

    // Reverse: Update index names
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_conversation_context_chatbot"`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_conversation_context_flow" ON "conversation_contexts" ("flowId")`,
    );
  }
}
