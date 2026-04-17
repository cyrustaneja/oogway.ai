const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const allSessions = await prisma.analysisSession.findMany({
    select: { id: true, name: true, deletedAt: true }
  });
  console.log('TOTAL SESSIONS:', allSessions.length);
  console.log('SESSIONS:', JSON.stringify(allSessions, null, 2));
}

main().finally(() => prisma.$disconnect());
