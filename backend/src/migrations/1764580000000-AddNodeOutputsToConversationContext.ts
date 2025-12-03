import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNodeOutputsToConversationContext1764580000000
  implements MigrationInterface
{
  name = 'AddNodeOutputsToConversationContext1764580000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE conversation_contexts
      ADD COLUMN "nodeOutputs" jsonb NOT NULL DEFAULT '{}'
    `);

    await queryRunner.query(`
      CREATE INDEX idx_conversation_contexts_node_outputs
      ON conversation_contexts USING GIN ("nodeOutputs")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_conversation_contexts_node_outputs
    `);

    await queryRunner.query(`
      ALTER TABLE conversation_contexts
      DROP COLUMN IF EXISTS "nodeOutputs"
    `);
  }
}
