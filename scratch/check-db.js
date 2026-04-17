const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const sessions = await prisma.analysisSession.findMany({
    select: { id: true, name: true, v3Status: true }
  });
  console.log(JSON.stringify(sessions, null, 2));
  await prisma.$disconnect();
}

check();
