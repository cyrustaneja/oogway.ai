import { PrismaClient } from '@prisma/client';

const tsRegex = /(?:^|\[)(\d{1,2}):(\d{2}):(\d{2})(?:\.\d+)?(?:\]|(?=\s|$))/gm

function computeTranscriptDurationSeconds(transcript: string): number {
  let firstTs: number | null = null
  let lastTs: number | null = null
  let match: RegExpExecArray | null
  while ((match = tsRegex.exec(transcript)) !== null) {
    const seconds =
      parseInt(match[1], 10) * 3600 +
      parseInt(match[2], 10) * 60 +
      parseInt(match[3], 10)
    if (firstTs === null) firstTs = seconds
    lastTs = seconds
  }
  if (firstTs === null || lastTs === null) return 0
  return Math.max(0, lastTs - firstTs)
}

const prisma = new PrismaClient();

async function main() {
  const session = await prisma.analysisSession.findUnique({
    where: { id: 'cmomhz0120001qj0x7ctf1aec' }
  });
  const transcript = (session as any).transcript_clean ?? '';
  const dur = computeTranscriptDurationSeconds(transcript);
  console.log('Duration seconds:', dur);
  console.log('Duration minutes:', Math.round(dur / 60));
}

main().catch(console.error).finally(() => prisma.$disconnect());
