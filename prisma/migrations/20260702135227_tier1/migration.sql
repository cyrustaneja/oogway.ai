-- AlterTable
ALTER TABLE "AnalysisSession" ADD COLUMN     "tier" TEXT NOT NULL DEFAULT 'TIER1',
ADD COLUMN     "tier1Result" JSONB;
