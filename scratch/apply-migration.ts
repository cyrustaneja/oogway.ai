import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- Manually Applying Migration via Prisma ---')

  try {
    // 1. Create Enum
    console.log('1. Creating PipelineStatus enum...')
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
          CREATE TYPE "public"."PipelineStatus" AS ENUM ('PENDING', 'PREPROCESSING', 'EXTRACTING', 'AGGREGATING', 'SYNTHESISING', 'COMPLETE', 'FAILED');
      EXCEPTION
          WHEN duplicate_object THEN null;
      END $$;
    `)

    // 2. Alter AnalysisSession
    console.log('2. Altering AnalysisSession table columns...')
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "public"."AnalysisSession" 
      ADD COLUMN IF NOT EXISTS "v3Status" "public"."PipelineStatus" NOT NULL DEFAULT 'PENDING',
      ADD COLUMN IF NOT EXISTS "v3Progress" TEXT,
      ADD COLUMN IF NOT EXISTS "v3Error" TEXT,
      ADD COLUMN IF NOT EXISTS "heartbeat" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "v2AnalysisId" TEXT;
    `)

    console.log('✅ Migration applied successfully.')
  } catch (err: any) {
    console.error('❌ Migration failed:', err.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
