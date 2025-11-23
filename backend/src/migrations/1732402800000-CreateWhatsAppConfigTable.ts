import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateWhatsAppConfigTable1732402800000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create whatsapp_config table
    await queryRunner.createTable(
      new Table({
        name: 'whatsapp_config',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'phone_number_id',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'business_account_id',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'access_token',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'webhook_verify_token',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'app_secret',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
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

    // Create unique index on is_active to ensure only one active config
    await queryRunner.createIndex(
      'whatsapp_config',
      new TableIndex({
        name: 'idx_whatsapp_config_active',
        columnNames: ['is_active'],
        isUnique: true,
        where: 'is_active = true',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the index first
    await queryRunner.dropIndex(
      'whatsapp_config',
      'idx_whatsapp_config_active',
    );

    // Drop the table
    await queryRunner.dropTable('whatsapp_config');
  }
}
