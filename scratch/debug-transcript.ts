import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
  const s = await p.analysisSession.findUnique({
    where: { id: 'cmoskn7hu0009j4a085pe4hrh' },
    select: { transcript_clean: true, transcriptRaw: true, chapters_json: true }
  });
  const t = s.transcript_clean || s.transcriptRaw;
  const ch3 = (s.chapters_json as any[]).find(c => c.chapter_index === 3);
  console.log(`Chapter 3 range: ${ch3.t_start} to ${ch3.t_end}`);
  
  // Just dump the first 1000 chars of the transcript to see formatting
  console.log('Transcript sample:', t.slice(0, 1000));
})().finally(() => p.$disconnect());
