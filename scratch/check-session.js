const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const session = await prisma.analysisSession.findUnique({
    where: { id: 'cmrcghsjb000bph8wuyvunsxz' }
  });
  console.log('pipeline_stage:', session.pipeline_stage);
  console.log('tier1Result:', session.tier1Result ? 'EXISTS' : 'NULL');
}
main().finally(() => prisma.$disconnect());
