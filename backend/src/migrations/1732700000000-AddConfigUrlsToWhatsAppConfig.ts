import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddConfigUrlsToWhatsAppConfig1732700000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add backend_url column
    await queryRunner.addColumn(
      'whatsapp_config',
      new TableColumn({
        name: 'backend_url',
        type: 'varchar',
        length: '500',
        isNullable: true,
      }),
    );

    // Add flow_endpoint_url column
    await queryRunner.addColumn(
      'whatsapp_config',
      new TableColumn({
        name: 'flow_endpoint_url',
        type: 'varchar',
        length: '500',
        isNullable: true,
      }),
    );

    // Add api_version column
    await queryRunner.addColumn(
      'whatsapp_config',
      new TableColumn({
        name: 'api_version',
        type: 'varchar',
        length: '20',
        isNullable: false,
        default: "'v20.0'",
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop columns in reverse order
    await queryRunner.dropColumn('whatsapp_config', 'api_version');
    await queryRunner.dropColumn('whatsapp_config', 'flow_endpoint_url');
    await queryRunner.dropColumn('whatsapp_config', 'backend_url');
  }
}
