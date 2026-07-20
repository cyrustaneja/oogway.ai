import { PrismaClient } from '@prisma/client';
import { handleStage1 } from '../lib/pipeline/handlers/stage1-segmenter';


const prisma = new PrismaClient();

async function main() {
  const sessionId = 'cmrcghsjb000bph8wuyvunsxz';
  const session = await prisma.analysisSession.findUnique({
    where: { id: sessionId }
  });
  if (!session) return console.log('Session not found');

  console.log(`Running stage 1 for ${session.id}`);
  
  try {
    await handleStage1(session.id);
    console.log('Success!');
  } catch (err) {
    console.error('Failed:', err);
  }
}

main().finally(() => prisma.$disconnect());
