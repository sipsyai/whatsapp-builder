import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateWhatsAppFlowsTable1732546800000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create whatsapp_flows table
    await queryRunner.createTable(
      new Table({
        name: 'whatsapp_flows',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'whatsapp_flow_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
            isUnique: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            isNullable: false,
            default: "'DRAFT'",
          },
          {
            name: 'categories',
            type: 'jsonb',
            isNullable: false,
            default: "'[]'",
          },
          {
            name: 'flow_json',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'endpoint_uri',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'preview_url',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Create index on whatsapp_flow_id for fast lookups
    await queryRunner.createIndex(
      'whatsapp_flows',
      new TableIndex({
        name: 'idx_whatsapp_flows_flow_id',
        columnNames: ['whatsapp_flow_id'],
      }),
    );

    // Create index on status for filtering
    await queryRunner.createIndex(
      'whatsapp_flows',
      new TableIndex({
        name: 'idx_whatsapp_flows_status',
        columnNames: ['status'],
      }),
    );

    // Create index on is_active for filtering
    await queryRunner.createIndex(
      'whatsapp_flows',
      new TableIndex({
        name: 'idx_whatsapp_flows_active',
        columnNames: ['is_active'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('whatsapp_flows', 'idx_whatsapp_flows_active');
    await queryRunner.dropIndex('whatsapp_flows', 'idx_whatsapp_flows_status');
    await queryRunner.dropIndex('whatsapp_flows', 'idx_whatsapp_flows_flow_id');

    // Drop table
    await queryRunner.dropTable('whatsapp_flows');
  }
}
