import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const sessionId = process.argv[2];
  if (!sessionId) {
    console.error('Please provide a session ID');
    process.exit(1);
  }

  const session = await prisma.analysisSession.findUnique({
    where: { id: sessionId },
    include: {
      v2Analysis: true,
      AnalysisChapterResult: true
    }
  });

  if (!session) {
    console.error('Session not found');
    process.exit(1);
  }

  console.log('--- SESSION ---');
  console.log('Name:', session.name);
  console.log('Stage:', session.pipeline_stage);
  
  console.log('\n--- ANALYSIS V2 ---');
  if (session.v2Analysis) {
    console.log(JSON.stringify(session.v2Analysis, null, 2));
  } else {
    console.log('No v2Analysis found');
  }

  console.log('\n--- CHAPTER RESULTS ---');
  console.log('Count:', session.AnalysisChapterResult.length);
  session.AnalysisChapterResult.forEach((r, i) => {
    console.log(`\n[Chapter ${r.chapter_index}]`);
    console.log(JSON.stringify(r.result, null, 2));
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
