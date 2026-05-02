import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const sessionId = 'cmon88snj00033yrm8s8gp5tu';
  console.log(`Fixing session ${sessionId}...`);
  
  try {
    await prisma.analysisSession.update({
      where: { id: sessionId },
      data: {
        createdAt: new Date(),
        v3Status: 'PENDING',
        v3Error: null,
        pipeline_stage: 'UPLOADED',
        stage_attempts: {},
        next_action_at: new Date()
      }
    });
    console.log('✅ Session timer and status reset.');
  } catch (err) {
    console.error('❌ Fix failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
