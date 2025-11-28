import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateDataSourceConnectionsTable1732800000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create http_method_enum type if it doesn't exist
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE http_method_enum AS ENUM ('GET', 'POST', 'PUT', 'PATCH', 'DELETE');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create data_source_connections table
    await queryRunner.createTable(
      new Table({
        name: 'data_source_connections',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
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
            name: 'data_source_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'endpoint',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
          {
            name: 'method',
            type: 'http_method_enum',
            default: "'GET'",
          },
          {
            name: 'default_params',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'default_body',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'data_key',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'transform_config',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'depends_on_connection_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'param_mapping',
            type: 'jsonb',
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

    // Create foreign key to data_sources table
    await queryRunner.createForeignKey(
      'data_source_connections',
      new TableForeignKey({
        columnNames: ['data_source_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'data_sources',
        onDelete: 'CASCADE',
        name: 'fk_data_source_connection_data_source',
      }),
    );

    // Create self-referencing foreign key for depends_on_connection_id
    await queryRunner.createForeignKey(
      'data_source_connections',
      new TableForeignKey({
        columnNames: ['depends_on_connection_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'data_source_connections',
        onDelete: 'SET NULL',
        name: 'fk_data_source_connection_depends_on',
      }),
    );

    // Create index on data_source_id for faster lookups
    await queryRunner.createIndex(
      'data_source_connections',
      new TableIndex({
        name: 'idx_data_source_connections_data_source',
        columnNames: ['data_source_id'],
      }),
    );

    // Create index on is_active for filtering
    await queryRunner.createIndex(
      'data_source_connections',
      new TableIndex({
        name: 'idx_data_source_connections_active',
        columnNames: ['is_active'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes first
    await queryRunner.dropIndex(
      'data_source_connections',
      'idx_data_source_connections_active',
    );
    await queryRunner.dropIndex(
      'data_source_connections',
      'idx_data_source_connections_data_source',
    );

    // Drop foreign keys
    await queryRunner.dropForeignKey(
      'data_source_connections',
      'fk_data_source_connection_depends_on',
    );
    await queryRunner.dropForeignKey(
      'data_source_connections',
      'fk_data_source_connection_data_source',
    );

    // Drop the table
    await queryRunner.dropTable('data_source_connections');

    // Drop the enum type
    await queryRunner.query(`DROP TYPE IF EXISTS http_method_enum`);
  }
}
