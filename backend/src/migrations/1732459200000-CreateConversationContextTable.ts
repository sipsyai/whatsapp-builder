import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateConversationContextTable1732459200000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create conversation_contexts table
    await queryRunner.createTable(
      new Table({
        name: 'conversation_contexts',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'conversationId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'flowId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'currentNodeId',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'variables',
            type: 'jsonb',
            default: "'{}'",
            isNullable: false,
          },
          {
            name: 'nodeHistory',
            type: 'jsonb',
            default: "'[]'",
            isNullable: false,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp with time zone',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'timestamp with time zone',
            default: 'now()',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create foreign key to conversations table
    await queryRunner.createForeignKey(
      'conversation_contexts',
      new TableForeignKey({
        columnNames: ['conversationId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'conversations',
        onDelete: 'CASCADE',
        name: 'fk_conversation_context_conversation',
      }),
    );

    // Create foreign key to flows table
    await queryRunner.createForeignKey(
      'conversation_contexts',
      new TableForeignKey({
        columnNames: ['flowId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'flows',
        onDelete: 'CASCADE',
        name: 'fk_conversation_context_flow',
      }),
    );

    // Create index on conversationId for faster lookups
    await queryRunner.createIndex(
      'conversation_contexts',
      new TableIndex({
        name: 'idx_conversation_context_conversation',
        columnNames: ['conversationId'],
      }),
    );

    // Create index on flowId for faster lookups
    await queryRunner.createIndex(
      'conversation_contexts',
      new TableIndex({
        name: 'idx_conversation_context_flow',
        columnNames: ['flowId'],
      }),
    );

    // Create index on isActive for filtering active contexts
    await queryRunner.createIndex(
      'conversation_contexts',
      new TableIndex({
        name: 'idx_conversation_context_active',
        columnNames: ['isActive'],
      }),
    );

    // Create composite index on (conversationId, isActive) for quick active context lookup
    await queryRunner.createIndex(
      'conversation_contexts',
      new TableIndex({
        name: 'idx_conversation_context_conversation_active',
        columnNames: ['conversationId', 'isActive'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes first
    await queryRunner.dropIndex(
      'conversation_contexts',
      'idx_conversation_context_conversation_active',
    );
    await queryRunner.dropIndex(
      'conversation_contexts',
      'idx_conversation_context_active',
    );
    await queryRunner.dropIndex(
      'conversation_contexts',
      'idx_conversation_context_flow',
    );
    await queryRunner.dropIndex(
      'conversation_contexts',
      'idx_conversation_context_conversation',
    );

    // Drop foreign keys
    await queryRunner.dropForeignKey(
      'conversation_contexts',
      'fk_conversation_context_flow',
    );
    await queryRunner.dropForeignKey(
      'conversation_contexts',
      'fk_conversation_context_conversation',
    );

    // Drop the table
    await queryRunner.dropTable('conversation_contexts');
  }
}
