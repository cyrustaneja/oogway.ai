import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const session = await prisma.analysisV2.findUnique({
    where: { sessionId: 'cmon88snj00033yrm8s8gp5tu' },
  });

  if (!session) {
    console.log('Session not found');
    return;
  }

  console.log('Session Flags:', JSON.stringify(session.session_flags, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
