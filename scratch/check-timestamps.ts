import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const sessionId = 'cmpf8anu90001dm2stm9j7bwa';
  
  // 1. Check Chapter Results
  const chapters = await prisma.analysisChapterResult.findMany({
    where: { session_id: sessionId },
    select: {
      chapter_index: true,
      result: true
    }
  });

  console.log('=== Chapter Results Timestamps ===');
  for (const ch of chapters) {
    const res = ch.result as any;
    console.log(`\nChapter ${ch.chapter_index}:`);
    
    // Check teaching depth evidence
    if (res.teaching_depth?.evidence) {
      console.log('  teaching_depth evidence:', res.teaching_depth.evidence.map((e: any) => e.timestamp));
    }
    // Check analogies
    if (res.analogies) {
      console.log('  analogies:', res.analogies.map((a: any) => a.timestamp));
    }
    // Check doubts
    if (res.doubts) {
      console.log('  doubts:', res.doubts.map((d: any) => d.timestamp));
    }
    // Check confusion points
    if (res.confusion_points) {
      console.log('  confusion_points:', res.confusion_points.map((c: any) => c.timestamp));
    }
  }

  // 2. Check AnalysisV2 Session Flags
  const analysisV2 = await prisma.analysisV2.findUnique({
    where: { sessionId },
    select: {
      session_flags: true,
      context_setup: true,
      session_completeness: true
    }
  });

  console.log('\n=== AnalysisV2 Timestamps ===');
  if (analysisV2) {
    console.log('Context Setup evidence:', (analysisV2.context_setup as any)?.evidence?.map((e: any) => e.timestamp));
    console.log('Session Completeness evidence:', (analysisV2.session_completeness as any)?.evidence?.map((e: any) => e.timestamp));
    console.log('Session Flags (Doubts):', (analysisV2.session_flags as any)?.map((f: any) => ({ doubt: f.doubt?.slice(0, 30), timestamp: f.timestamp })));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
