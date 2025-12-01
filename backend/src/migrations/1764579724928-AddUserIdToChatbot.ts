import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserIdToChatbot1764579724928 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add userId column to chatbots table
        await queryRunner.query(`
            ALTER TABLE "chatbots"
            ADD COLUMN IF NOT EXISTS "userId" uuid
        `);

        // Add foreign key constraint
        await queryRunner.query(`
            ALTER TABLE "chatbots"
            ADD CONSTRAINT "FK_chatbots_user"
            FOREIGN KEY ("userId")
            REFERENCES "users"("id")
            ON DELETE SET NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove foreign key constraint
        await queryRunner.query(`
            ALTER TABLE "chatbots"
            DROP CONSTRAINT IF EXISTS "FK_chatbots_user"
        `);

        // Remove userId column
        await queryRunner.query(`
            ALTER TABLE "chatbots"
            DROP COLUMN IF EXISTS "userId"
        `);
    }

}
