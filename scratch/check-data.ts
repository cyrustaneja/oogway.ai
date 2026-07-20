import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const session = await prisma.analysisV2.findUnique({
    where: { sessionId: 'cmpf8anu90001dm2stm9j7bwa' },
  });

  if (!session) {
    console.log('Session not found');
    return;
  }

  console.log('Session Data:', JSON.stringify(session, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
