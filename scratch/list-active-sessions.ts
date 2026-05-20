import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const sessions = await prisma.analysisSession.findMany({
    where: { pipeline_stage: { not: 'COMPLETE' } },
    select: {
      id: true,
      name: true,
      pipeline_stage: true,
      v3Status: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: 'desc' },
  });
  console.log('Active sessions:');
  console.dir(sessions, { depth: null });
}

main()
  .catch((e) => console.error('Error:', e))
  .finally(() => prisma.$disconnect());
