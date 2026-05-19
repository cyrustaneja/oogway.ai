
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkStatus() {
  try {
    const recentSessions = await prisma.analysisSession.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        name: true,
        v3Status: true,
        pipeline_stage: true,
        v3Error: true,
        updatedAt: true,
        next_action_at: true,
        heartbeat: true
      }
    });

    console.log('--- Recent Sessions Status ---');
    console.table(recentSessions);

    const specificSession = await prisma.analysisSession.findUnique({
      where: { id: 'cmoxaxuxm0002seieuq1xhent' }
    });

    if (specificSession) {
      console.log('\n--- Specific Session Detail (cmoxaxuxm0002seieuq1xhent) ---');
      console.log(JSON.stringify(specificSession, null, 2));
    } else {
      console.log('\nSpecific session cmoxaxuxm0002seieuq1xhent not found.');
    }

    const failedSessions = await prisma.analysisSession.count({
      where: { v3Status: 'FAILED' }
    });
    console.log(`\nTotal Failed Sessions: ${failedSessions}`);

    const pendingSessions = await prisma.analysisSession.count({
      where: { v3Status: { in: ['PENDING', 'PREPROCESSING', 'EXTRACTING', 'AGGREGATING', 'SYNTHESISING'] } }
    });
    console.log(`Total Processing Sessions: ${pendingSessions}`);

  } catch (err) {
    console.error('Error checking status:', err);
  } finally {
    await prisma.$disconnect();
  }
}

checkStatus();
