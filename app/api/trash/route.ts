import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { restore } from "@/lib/db/soft-delete";

/**
 * GET: Returns a list of all items currently in the Recycle Bin.
 * This includes Experts, Courses, Modules, SessionNotes, AnalysisSessions, and Batches.
 */
export async function GET() {
  try {
    const fetchDeleted = async (model: any, name: string) => {
      const items = await model.findMany({
        where: { deletedAt: { not: null } },
        select: { id: true, name: true, deletedAt: true },
      });
      return items.map((it: any) => ({ ...it, type: name }));
    };

    const results = (await Promise.all([
      fetchDeleted(prisma.expert, "Expert"),
      fetchDeleted(prisma.course, "Course"),
      fetchDeleted(prisma.module, "Module"),
      fetchDeleted(prisma.sessionNote, "Session (Template)"),
      fetchDeleted(prisma.analysisSession, "Analysis Session"),
      fetchDeleted(prisma.batch, "Batch"),
    ])).flat();

    // Sort by most recently deleted first
    results.sort((a, b) => b.deletedAt.getTime() - a.deletedAt.getTime());

    return NextResponse.json(results);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST: Restores an item from the Recycle Bin.
 */
export async function POST(req: Request) {
  try {
    const { id, type } = await req.json();
    if (!id || !type) return NextResponse.json({ error: "id and type are required" }, { status: 400 });

    let modelName = "";
    if (type === "Expert") modelName = "expert";
    else if (type === "Course") modelName = "course";
    else if (type === "Module") modelName = "module";
    else if (type === "Session (Template)") modelName = "sessionNote";
    else if (type === "Analysis Session") modelName = "analysisSession";
    else if (type === "Batch") modelName = "batch";
    else throw new Error(`Invalid type: ${type}`);

    await restore(modelName, id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * DELETE: Permanently removes a record from the database.
 */
export async function DELETE(req: Request) {
  try {
    const { id, type } = await req.json();
    if (!id || !type) return NextResponse.json({ error: "id and type are required" }, { status: 400 });

    let dbTable: any = null;
    if (type === "Expert") dbTable = prisma.expert;
    else if (type === "Course") dbTable = prisma.course;
    else if (type === "Module") dbTable = prisma.module;
    else if (type === "Session (Template)") dbTable = prisma.sessionNote;
    else if (type === "Analysis Session") dbTable = prisma.analysisSession;
    else if (type === "Batch") dbTable = prisma.batch;
    else throw new Error(`Invalid type: ${type}`);

    await dbTable.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
