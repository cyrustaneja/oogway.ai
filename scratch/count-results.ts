import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
  const counts = await p.analysisChapterResult.groupBy({
    by: ['session_id'],
    _count: true,
  });
  console.log(JSON.stringify(counts, null, 2));
})().finally(() => p.$disconnect());
