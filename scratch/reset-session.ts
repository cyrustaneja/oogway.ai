import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const sessionId = process.argv[2] || 'cmon88snj00033yrm8s8gp5tu';
  console.log(`Resetting session ${sessionId}...`);
  
  try {
    // 1. Delete downstream results
    await prisma.analysisV2.deleteMany({ where: { sessionId } });
    await prisma.analysisChapterResult.deleteMany({ where: { session_id: sessionId } });
    
    // 2. Reset session status to UPLOADED (re-triggers Stage 1)
    await prisma.analysisSession.update({
      where: { id: sessionId },
      data: {
        pipeline_stage: 'UPLOADED',
        v3Status: 'PENDING',
        v3Error: null,
        chapters_json: null,
        stage_attempts: {},
        next_action_at: new Date()
      }
    });
    
    console.log('✅ Reset complete.');
  } catch (err) {
    console.error('❌ Reset failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
