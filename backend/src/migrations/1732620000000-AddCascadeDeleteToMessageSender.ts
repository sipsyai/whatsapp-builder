import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCascadeDeleteToMessageSender1732620000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the existing foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "messages"
      DROP CONSTRAINT IF EXISTS "FK_2db9cf2b3ca111742793f6c37ce"
    `);

    // Re-add the foreign key constraint with ON DELETE CASCADE
    await queryRunner.query(`
      ALTER TABLE "messages"
      ADD CONSTRAINT "FK_2db9cf2b3ca111742793f6c37ce"
      FOREIGN KEY ("senderId")
      REFERENCES "users"("id")
      ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the CASCADE constraint
    await queryRunner.query(`
      ALTER TABLE "messages"
      DROP CONSTRAINT IF EXISTS "FK_2db9cf2b3ca111742793f6c37ce"
    `);

    // Re-add without CASCADE (original behavior)
    await queryRunner.query(`
      ALTER TABLE "messages"
      ADD CONSTRAINT "FK_2db9cf2b3ca111742793f6c37ce"
      FOREIGN KEY ("senderId")
      REFERENCES "users"("id")
    `);
  }
}
