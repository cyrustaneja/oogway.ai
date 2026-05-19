import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
  const results = await p.analysisChapterResult.findMany({
    where: { session_id: 'cmoskn7hu0009j4a085pe4hrh' },
    select: {
      chapter_index: true,
      needs_review: true,
      review_reasons: true,
    }
  });
  console.log(JSON.stringify(results, null, 2));
})().finally(() => p.$disconnect());
