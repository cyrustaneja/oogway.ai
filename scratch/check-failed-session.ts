import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const sessionId = 'cmp6qm4jk0001pxhi8ez3uv9a'; // Soham Mishra (failed)
  
  const s = await prisma.analysisSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      name: true,
      v3Status: true,
      pipeline_stage: true,
      v3Error: true,
      stage_attempts: true,
      createdAt: true,
      updatedAt: true,
      chapters_json: true,
      _count: {
        select: {
          AnalysisChapterResult: true
        }
      }
    }
  });

  if (!s) {
    console.error('Session not found');
    return;
  }

  console.log(`=== Failed Session Details ===`);
  console.log(`Name: ${s.name}`);
  console.log(`Status: ${s.v3Status} | Stage: ${s.pipeline_stage}`);
  console.log(`Created: ${s.createdAt.toISOString()} | Updated: ${s.updatedAt.toISOString()}`);
  console.log(`v3Error: ${s.v3Error}`);
  console.log(`Stage Attempts:`, JSON.stringify(s.stage_attempts, null, 2));

  let chaptersCount = 0;
  if (s.chapters_json) {
    try {
      const parsed = typeof s.chapters_json === 'string' ? JSON.parse(s.chapters_json) : s.chapters_json;
      chaptersCount = Array.isArray(parsed) ? parsed.length : (parsed.chapters ? parsed.chapters.length : 0);
    } catch (e) {}
  }
  console.log(`Chapters in chapters_json: ${chaptersCount}`);
  console.log(`AnalysisChapterResult rows in DB: ${s._count.AnalysisChapterResult}`);

  const results = await prisma.analysisChapterResult.findMany({
    where: { session_id: sessionId },
    orderBy: { chapter_index: 'asc' },
    select: {
      chapter_index: true,
      needs_review: true,
      review_reasons: true
    }
  });
  console.log('Chapter results in DB:', JSON.stringify(results, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
