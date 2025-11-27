import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddAuthFieldsToUser1764000000000 implements MigrationInterface {
  name = 'AddAuthFieldsToUser1764000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Make phoneNumber nullable (existing WhatsApp users may not have email)
    await queryRunner.changeColumn(
      'users',
      'phoneNumber',
      new TableColumn({
        name: 'phoneNumber',
        type: 'varchar',
        length: '20',
        isNullable: true,
        isUnique: true,
      }),
    );

    // Add email column
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'email',
        type: 'varchar',
        length: '255',
        isNullable: true,
        isUnique: true,
      }),
    );

    // Add password column (select: false is handled by TypeORM, not DB)
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'password',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );

    // Add role column
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'role',
        type: 'varchar',
        length: '20',
        default: "'user'",
      }),
    );

    // Add isActive column
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'isActive',
        type: 'boolean',
        default: true,
      }),
    );

    // Add lastLoginAt column
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'lastLoginAt',
        type: 'timestamp with time zone',
        isNullable: true,
      }),
    );

    // Create index for email lookup
    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_USERS_EMAIL',
        columnNames: ['email'],
        isUnique: true,
        where: 'email IS NOT NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.dropIndex('users', 'IDX_USERS_EMAIL');

    // Drop columns
    await queryRunner.dropColumn('users', 'lastLoginAt');
    await queryRunner.dropColumn('users', 'isActive');
    await queryRunner.dropColumn('users', 'role');
    await queryRunner.dropColumn('users', 'password');
    await queryRunner.dropColumn('users', 'email');

    // Revert phoneNumber to not nullable
    await queryRunner.changeColumn(
      'users',
      'phoneNumber',
      new TableColumn({
        name: 'phoneNumber',
        type: 'varchar',
        length: '20',
        isNullable: false,
        isUnique: true,
      }),
    );
  }
}
