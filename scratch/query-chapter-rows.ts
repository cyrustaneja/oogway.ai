import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const sessionId = 'cmpcm0dcm000769cjw50onxz7'; // Sashwatha
  
  const results = await prisma.analysisChapterResult.findMany({
    where: { session_id: sessionId },
    orderBy: { chapter_index: 'asc' },
    select: {
      chapter_index: true,
      needs_review: true,
      review_reasons: true,
    }
  });
  
  console.log(`=== Chapter Results for Sashwatha (${sessionId}) ===`);
  console.log(JSON.stringify(results, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
