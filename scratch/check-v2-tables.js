const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Checking Database Schema ---');
  try {
    // 1. Check if AnalysisV2 table exists by trying to query it
    const v2Count = await prisma.analysisV2.count().catch(e => {
        console.log('AnalysisV2 table check failed:', e.message);
        return -1;
    });
    console.log('AnalysisV2 count:', v2Count);

    // 2. Check AnalysisSession for v3Progress
    const session = await prisma.analysisSession.findFirst({
        select: { id: true }
    });
    
    if (session) {
        console.log('Found session:', session.id);
        // Try to query v3Progress separately
        const raw = await prisma.$queryRaw`SELECT "v3Progress" FROM "AnalysisSession" LIMIT 1`.catch(e => {
            console.log('v3Progress column check failed:', e.message);
            return null;
        });
        console.log('v3Progress column exists:', !!raw);
    }
  } catch (err) {
    console.error('Check failed:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
