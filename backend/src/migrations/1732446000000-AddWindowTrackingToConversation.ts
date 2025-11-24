import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddWindowTrackingToConversation1732446000000 implements MigrationInterface {
  name = 'AddWindowTrackingToConversation1732446000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add lastCustomerMessageAt column
    await queryRunner.addColumn(
      'conversations',
      new TableColumn({
        name: 'lastCustomerMessageAt',
        type: 'timestamp with time zone',
        isNullable: true,
      }),
    );

    // Add isWindowOpen column
    await queryRunner.addColumn(
      'conversations',
      new TableColumn({
        name: 'isWindowOpen',
        type: 'boolean',
        default: true,
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('conversations', 'isWindowOpen');
    await queryRunner.dropColumn('conversations', 'lastCustomerMessageAt');
  }
}
