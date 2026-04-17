const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Starting deep clean of analysis data...');
  
  // Truncate in correct order due to foreign keys
  await prisma.sessionOverallAnalysis.deleteMany({});
  await prisma.chapterExtractionResult.deleteMany({});
  await prisma.analysisChapter.deleteMany({});
  await prisma.analysisSession.deleteMany({});
  
  console.log('✅ Analysis tables truncated.');
  console.log('✅ Ready for a fresh Master Oogway test.');
}

main()
  .catch((e) => {
    console.error('❌ Cleanup failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
