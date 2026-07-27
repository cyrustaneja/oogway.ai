import { prisma } from "@/lib/db";

/**
 * Marks a record as deleted by setting its deletedAt timestamp.
 * This effectively moves it to the 'Recycle Bin'.
 */
export async function softDelete(model: string, id: string) {
  return bulkSoftDelete(model, [id]);
}

/**
 * High-performance bulk soft-deletion executing in 1 single SQL query per cascade stage.
 */
export async function bulkSoftDelete(model: string, ids: string[]) {
  if (!ids || ids.length === 0) return { count: 0 };
  const modelClient = (prisma as any)[model];
  if (!modelClient) throw new Error(`Model ${model} not found in Prisma.`);

  const now = new Date();

  // Execute Cascades in parallel / bulk updateMany
  if (model === "expert") {
    // 1. Soft delete associated User accounts
    await prisma.user.updateMany({
      where: {
        OR: [{ expertId: { in: ids } }, { id: { in: ids } }],
        deletedAt: null,
      },
      data: { deletedAt: now },
    });

    // 2. Soft delete associated Analysis Sessions
    await prisma.analysisSession.updateMany({
      where: { expertId: { in: ids }, deletedAt: null },
      data: { deletedAt: now },
    });
  } else if (model === "batch") {
    await prisma.analysisSession.updateMany({
      where: { batchId: { in: ids }, deletedAt: null },
      data: { deletedAt: now },
    });
  } else if (model === "course") {
    const modules = await prisma.module.findMany({
      where: { courseId: { in: ids } },
      select: { id: true },
    });
    if (modules.length > 0) {
      await bulkSoftDelete("module", modules.map((m) => m.id));
    }
  } else if (model === "module") {
    await prisma.sessionNote.updateMany({
      where: { moduleId: { in: ids }, deletedAt: null },
      data: { deletedAt: now },
    });
  }

  // Single updateMany query for target model
  return await modelClient.updateMany({
    where: { id: { in: ids } },
    data: { deletedAt: now },
  });
}

/**
 * Restores a record by clearing its deletedAt timestamp.
 */
export async function restore(model: string, id: string) {
  const modelClient = (prisma as any)[model];
  if (!modelClient) throw new Error(`Model ${model} not found in Prisma.`);

  if (model === "expert") {
    await prisma.user.updateMany({
      where: { OR: [{ expertId: id }, { id }] },
      data: { deletedAt: null },
    });
  }

  return await modelClient.update({
    where: { id },
    data: { deletedAt: null },
  });
}

/**
 * Permanently removes a record that was deleted more than N days ago.
 */
export async function hardDeleteExpired(days = 7) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const models = ["expert", "course", "module", "sessionNote", "analysisSession", "batch"];
  const results: Record<string, number> = {};

  for (const m of models) {
    const { count } = await (prisma as any)[m].deleteMany({
      where: { deletedAt: { lt: cutoff } },
    });
    results[m] = count;
  }
  return results;
}
