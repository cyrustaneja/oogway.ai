import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const sessions = await prisma.analysisSession.findMany({
    where: { name: { contains: 'Prisma' } },
    select: { id: true, name: true, v3Status: true, pipeline_stage: true, createdAt: true, updatedAt: true },
  });
  console.log('Prisma name sessions:', sessions);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
