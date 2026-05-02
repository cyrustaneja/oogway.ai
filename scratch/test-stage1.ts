import { PrismaClient } from '@prisma/client';
import { handleStage1 } from '../lib/pipeline/handlers/stage1-segmenter';

const prisma = new PrismaClient();

async function main() {
  const sessionId = 'cmomhz0120001qj0x7ctf1aec';
  console.log('Running handleStage1 manually...');
  try {
    await handleStage1(sessionId);
    console.log('handleStage1 SUCCESS');
  } catch (err) {
    console.error('handleStage1 FAILED:', err);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
