import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const activeSessions = await prisma.analysisSession.findMany({
    where: {
      v3Status: {
        notIn: ['COMPLETE', 'FAILED']
      }
    },
    select: {
      id: true,
      name: true,
      v3Status: true,
      pipeline_stage: true,
      v3Error: true,
      stage_attempts: true,
      next_action_at: true,
      heartbeat: true,
      updatedAt: true,
      chapters_json: true,
      _count: {
        select: {
          AnalysisChapterResult: true
        }
      }
    }
  });

  console.log('=== Active Sessions Details ===');
  for (const s of activeSessions) {
    console.log(`\nSession: ${s.name} (${s.id})`);
    console.log(`Status: ${s.v3Status} | Stage: ${s.pipeline_stage}`);
    console.log(`Heartbeat: ${s.heartbeat?.toISOString()} | Updated: ${s.updatedAt?.toISOString()} | Next Action: ${s.next_action_at?.toISOString()}`);
    console.log(`Stage Attempts:`, JSON.stringify(s.stage_attempts, null, 2));
    console.log(`v3Error:`, s.v3Error);
    
    let chaptersCount = 0;
    if (s.chapters_json) {
      try {
        const parsed = typeof s.chapters_json === 'string' ? JSON.parse(s.chapters_json) : s.chapters_json;
        chaptersCount = Array.isArray(parsed) ? parsed.length : (parsed.chapters ? parsed.chapters.length : 0);
      } catch (e) {
        // ignore
      }
    }
    console.log(`Chapters in chapters_json: ${chaptersCount}`);
    console.log(`AnalysisChapterResult rows in DB: ${s._count.AnalysisChapterResult}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
