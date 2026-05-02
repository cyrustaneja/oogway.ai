import { handleStage1 } from '../lib/pipeline/handlers/stage1-segmenter';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const sessionId = 'cmon88snj00033yrm8s8gp5tu';
  console.log(`Manually triggering Stage 1 for session ${sessionId}...`);
  
  try {
    await handleStage1(sessionId);
    console.log('✅ Stage 1 completed successfully.');
  } catch (err) {
    console.error('❌ Stage 1 failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
