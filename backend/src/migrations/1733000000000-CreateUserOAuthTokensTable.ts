import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateUserOAuthTokensTable1733000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create oauth_provider_enum type
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE oauth_provider_enum AS ENUM ('GOOGLE_CALENDAR');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create user_oauth_tokens table
    await queryRunner.createTable(
      new Table({
        name: 'user_oauth_tokens',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'provider',
            type: 'oauth_provider_enum',
            isNullable: false,
          },
          {
            name: 'access_token',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'refresh_token',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'expires_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'scope',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
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

    // Create foreign key to users table
    await queryRunner.createForeignKey(
      'user_oauth_tokens',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
        name: 'fk_user_oauth_tokens_user',
      }),
    );

    // Create unique index on user_id + provider
    await queryRunner.createIndex(
      'user_oauth_tokens',
      new TableIndex({
        name: 'idx_user_oauth_tokens_user_provider',
        columnNames: ['user_id', 'provider'],
        isUnique: true,
      }),
    );

    // Create index on provider for filtering
    await queryRunner.createIndex(
      'user_oauth_tokens',
      new TableIndex({
        name: 'idx_user_oauth_tokens_provider',
        columnNames: ['provider'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex(
      'user_oauth_tokens',
      'idx_user_oauth_tokens_provider',
    );
    await queryRunner.dropIndex(
      'user_oauth_tokens',
      'idx_user_oauth_tokens_user_provider',
    );

    // Drop foreign key
    await queryRunner.dropForeignKey(
      'user_oauth_tokens',
      'fk_user_oauth_tokens_user',
    );

    // Drop the table
    await queryRunner.dropTable('user_oauth_tokens');

    // Drop the enum type
    await queryRunner.query(`DROP TYPE IF EXISTS oauth_provider_enum`);
  }
}
