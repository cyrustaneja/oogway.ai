import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const sessionId = 'cmpdima8b0003quf6boq26ep7';
  const session = await prisma.analysisSession.findUnique({
    where: { id: sessionId },
    include: { // include raw transcript if possible
      // No relation maybe, so just select fields
    },
  });
  console.log('Session details:', session);
}

main()
  .catch(e => console.error('Error:', e))
  .finally(() => prisma.$disconnect());
