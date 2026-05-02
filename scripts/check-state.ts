import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
  const recent = await p.analysisSession.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true, name: true, createdAt: true, updatedAt: true,
      pipeline_stage: true, v3Status: true, v3Error: true,
      next_action_at: true, heartbeat: true,
      stage_attempts: true, transcript_quality: true,
      _count: { select: { AnalysisChapterResult: true } },
      v2Analysis: { select: { id: true, status: true } }
    }
  });
  for (const s of recent) {
    console.log('---');
    console.log('ID:', s.id);
    console.log('Name:', s.name);
    console.log('Created:', s.createdAt.toISOString());
    console.log('Updated:', s.updatedAt.toISOString());
    console.log('Stage:', s.pipeline_stage, '| v3Status:', s.v3Status);
    console.log('v3Error:', s.v3Error || '(none)');
    console.log('Next action:', s.next_action_at?.toISOString() || '(null)');
    console.log('Heartbeat:', s.heartbeat?.toISOString() || '(null)');
    console.log('Chapters extracted:', s._count.AnalysisChapterResult);
    console.log('v2Analysis present:', !!s.v2Analysis);
    console.log('Transcript quality:', s.transcript_quality);
    console.log('Stage attempts:', JSON.stringify(s.stage_attempts));
  }
})().catch(e => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());
