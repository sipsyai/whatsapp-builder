import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateCalendarTables1733100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create calendar_permission_enum type
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE calendar_permission_enum AS ENUM ('READ', 'WRITE', 'ADMIN');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create invite_status_enum type
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE invite_status_enum AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create appointment_status_enum type
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE appointment_status_enum AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // =====================================================
    // Create calendars table
    // =====================================================
    await queryRunner.createTable(
      new Table({
        name: 'calendars',
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
            length: '100',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'google_calendar_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'owner_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'color',
            type: 'varchar',
            length: '50',
            default: "'#3b82f6'",
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'is_default',
            type: 'boolean',
            default: false,
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

    await queryRunner.createForeignKey(
      'calendars',
      new TableForeignKey({
        columnNames: ['owner_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
        name: 'fk_calendars_owner',
      }),
    );

    await queryRunner.createIndex(
      'calendars',
      new TableIndex({
        name: 'idx_calendars_owner',
        columnNames: ['owner_id'],
      }),
    );

    // =====================================================
    // Create calendar_shares table
    // =====================================================
    await queryRunner.createTable(
      new Table({
        name: 'calendar_shares',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'calendar_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'permission',
            type: 'calendar_permission_enum',
            default: "'READ'",
          },
          {
            name: 'invite_token',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'invite_expires_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'invite_status',
            type: 'invite_status_enum',
            default: "'PENDING'",
          },
          {
            name: 'invited_email',
            type: 'varchar',
            length: '255',
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

    await queryRunner.createForeignKey(
      'calendar_shares',
      new TableForeignKey({
        columnNames: ['calendar_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'calendars',
        onDelete: 'CASCADE',
        name: 'fk_calendar_shares_calendar',
      }),
    );

    await queryRunner.createForeignKey(
      'calendar_shares',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
        name: 'fk_calendar_shares_user',
      }),
    );

    await queryRunner.createIndex(
      'calendar_shares',
      new TableIndex({
        name: 'idx_calendar_shares_calendar_user',
        columnNames: ['calendar_id', 'user_id'],
        isUnique: true,
        where: '"user_id" IS NOT NULL',
      }),
    );

    await queryRunner.createIndex(
      'calendar_shares',
      new TableIndex({
        name: 'idx_calendar_shares_invite_token',
        columnNames: ['invite_token'],
        isUnique: true,
        where: '"invite_token" IS NOT NULL',
      }),
    );

    // =====================================================
    // Create appointments table
    // =====================================================
    await queryRunner.createTable(
      new Table({
        name: 'appointments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'calendar_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'google_event_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'title',
            type: 'varchar',
            length: '200',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'start_time',
            type: 'timestamp with time zone',
            isNullable: false,
          },
          {
            name: 'end_time',
            type: 'timestamp with time zone',
            isNullable: false,
          },
          {
            name: 'customer_phone',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'customer_name',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'customer_email',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'appointment_status_enum',
            default: "'PENDING'",
          },
          {
            name: 'service_type',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'duration',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_by_id',
            type: 'uuid',
            isNullable: true,
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

    await queryRunner.createForeignKey(
      'appointments',
      new TableForeignKey({
        columnNames: ['calendar_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'calendars',
        onDelete: 'CASCADE',
        name: 'fk_appointments_calendar',
      }),
    );

    await queryRunner.createForeignKey(
      'appointments',
      new TableForeignKey({
        columnNames: ['created_by_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
        name: 'fk_appointments_created_by',
      }),
    );

    await queryRunner.createIndex(
      'appointments',
      new TableIndex({
        name: 'idx_appointments_calendar_start',
        columnNames: ['calendar_id', 'start_time'],
      }),
    );

    await queryRunner.createIndex(
      'appointments',
      new TableIndex({
        name: 'idx_appointments_google_event',
        columnNames: ['google_event_id'],
      }),
    );

    await queryRunner.createIndex(
      'appointments',
      new TableIndex({
        name: 'idx_appointments_customer_phone',
        columnNames: ['customer_phone'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop appointments table
    await queryRunner.dropIndex('appointments', 'idx_appointments_customer_phone');
    await queryRunner.dropIndex('appointments', 'idx_appointments_google_event');
    await queryRunner.dropIndex('appointments', 'idx_appointments_calendar_start');
    await queryRunner.dropForeignKey('appointments', 'fk_appointments_created_by');
    await queryRunner.dropForeignKey('appointments', 'fk_appointments_calendar');
    await queryRunner.dropTable('appointments');

    // Drop calendar_shares table
    await queryRunner.dropIndex('calendar_shares', 'idx_calendar_shares_invite_token');
    await queryRunner.dropIndex('calendar_shares', 'idx_calendar_shares_calendar_user');
    await queryRunner.dropForeignKey('calendar_shares', 'fk_calendar_shares_user');
    await queryRunner.dropForeignKey('calendar_shares', 'fk_calendar_shares_calendar');
    await queryRunner.dropTable('calendar_shares');

    // Drop calendars table
    await queryRunner.dropIndex('calendars', 'idx_calendars_owner');
    await queryRunner.dropForeignKey('calendars', 'fk_calendars_owner');
    await queryRunner.dropTable('calendars');

    // Drop enum types
    await queryRunner.query(`DROP TYPE IF EXISTS appointment_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS invite_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS calendar_permission_enum`);
  }
}
