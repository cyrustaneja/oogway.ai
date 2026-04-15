const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Checking if 'courseId' column exists in 'Batch'...");
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Batch' AND column_name='courseId') THEN
          ALTER TABLE "Batch" ADD COLUMN "courseId" TEXT;
          RAISE NOTICE 'Column "courseId" added to "Batch" table.';
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
