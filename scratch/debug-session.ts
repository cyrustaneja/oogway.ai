import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
  const results = await p.analysisChapterResult.findMany({
    where: { session_id: 'cmoxcmqi200039q6qeegj2knl' },
    orderBy: { chapter_index: 'asc' },
    select: {
      chapter_index: true,
      needs_review: true,
      review_reasons: true
    }
  });
  console.log(JSON.stringify(results, null, 2));
})().finally(() => p.$disconnect());
