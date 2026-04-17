import { prisma } from "@/lib/db";

/**
 * Marks a record as deleted by setting its deletedAt timestamp.
 * This effectively moves it to the 'Recycle Bin'.
 */
export async function softDelete(model: string, id: string) {
  const modelClient = (prisma as any)[model];
  if (!modelClient) throw new Error(`Model ${model} not found in Prisma.`);

  const now = new Date();

  // Handle Cascades
  if (model === "expert") {
    await prisma.analysisSession.updateMany({ where: { expertId: id, deletedAt: null }, data: { deletedAt: now } });
  } else if (model === "batch") {
    await prisma.analysisSession.updateMany({ where: { batchId: id, deletedAt: null }, data: { deletedAt: now } });
  } else if (model === "course") {
    const modules = await prisma.module.findMany({ where: { courseId: id }, select: { id: true } });
    for (const m of modules) {
      await softDelete("module", m.id);
    }
  } else if (model === "module") {
    await prisma.sessionNote.updateMany({ where: { moduleId: id, deletedAt: null }, data: { deletedAt: now } });
  }

  return await modelClient.update({
    where: { id },
    data: { deletedAt: now },
  });
}

/**
 * Restores a record by clearing its deletedAt timestamp.
 */
export async function restore(model: string, id: string) {
  const modelClient = (prisma as any)[model];
  if (!modelClient) throw new Error(`Model ${model} not found in Prisma.`);

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
