const { PrismaClient } = require('@prisma/client');
const { handleTier1Review } = require('./lib/pipeline/handlers/stage1-tier1-reviewer');

const prisma = new PrismaClient();

async function run() {
  const sessions = await prisma.analysisSession.findMany({
    include: { expert: true }
  });
  
  let targetSession = sessions.find(s => s.name.toLowerCase().includes('saikiran') || s.expert?.name.toLowerCase().includes('saikiran'));
  
  if (!targetSession) {
    // Just use the first one if not found or the specific ID cmr84gnrh00097sln3alqnokw
    targetSession = sessions.find(s => s.id === 'cmr84gnrh00097sln3alqnokw');
  }

  if (targetSession) {
    console.log(`Running pulse for: ${targetSession.id} - ${targetSession.name}`);
    await handleTier1Review(targetSession.id);
    console.log('Finished running tier1 analysis');
  } else {
    console.log('Session not found');
  }
}

run().finally(() => prisma.$disconnect());
