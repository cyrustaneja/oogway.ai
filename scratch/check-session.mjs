import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const session = await prisma.analysisSession.findFirst({
    where: { id: { startsWith: 'cmpdima8' } }
  });
  console.log(JSON.stringify(session, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
