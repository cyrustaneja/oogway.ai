const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Adding 'v3Error' column to 'AnalysisSession'...");
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='AnalysisSession' AND column_name='v3Error') THEN
          ALTER TABLE "AnalysisSession" ADD COLUMN "v3Error" TEXT;
          RAISE NOTICE 'Column "v3Error" added.';
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
