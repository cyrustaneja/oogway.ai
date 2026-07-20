import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRecentAnalysis() {
  try {
    const latestSession = await prisma.analysisSession.findFirst({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        createdAt: true,
        pipeline_stage: true,
        v3Status: true,
        v3Progress: true,
        v3Error: true,
        stage_attempts: true,
        next_action_at: true
      }
    });

    if (!latestSession) {
      console.log('No sessions found in the database.');
      return;
    }

    console.log('Most Recent Session:');
    console.log(JSON.stringify(latestSession, null, 2));

  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRecentAnalysis();
