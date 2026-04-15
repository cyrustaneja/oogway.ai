const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Checking if 'content' column exists...");
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='SessionNote' AND column_name='content') THEN
          ALTER TABLE "SessionNote" ADD COLUMN "content" TEXT;
          RAISE NOTICE 'Column "content" added to "SessionNote" table.';
        ELSE
          RAISE NOTICE 'Column "content" already exists in "SessionNote" table.';
        END IF;
      END
      $$;
    `);
    console.log("SQL execution finished.");
  } catch (error) {
    console.error("Error executing SQL:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
