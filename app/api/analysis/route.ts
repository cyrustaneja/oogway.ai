export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getAuthToken } from "@/lib/auth-token";
import { prisma } from "@/lib/db";

// GET /api/analysis — list all sessions (newest first)
export async function GET() {
  const token = await getAuthToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (token as any).role;
  const userId = (token as any).id;

  // Filter out soft-deleted sessions and apply role-based visibility
  let where: any = { deletedAt: null };
  if (role === "EXPERT") {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { expertId: true } });
    if (!user?.expertId) return NextResponse.json([]);
    where.expertId = user.expertId;
  }

  const analyses = await prisma.analysisSession.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      expert: { select: { id: true, name: true } },
      sessionNote: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(analyses);
}

// POST /api/analysis — create a new AnalysisSession
export async function POST(req: Request) {
  const token = await getAuthToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (token as any).role;
  if (role === "EXPERT") {
    return NextResponse.json({ error: "Experts cannot create analysis sessions." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, expertId, sessionNoteId, schedDuration, batchId, transcriptRaw } = body;

    if (!expertId) {
      return NextResponse.json({ error: "expertId is required." }, { status: 400 });
    }

    // Generate name if missing
    let finalName = name;
    if (!finalName) {
      const expert = await prisma.expert.findUnique({ where: { id: expertId }, select: { name: true } });
      const date = new Date().toLocaleDateString("en-GB", { day: '2-digit', month: 'short' });
      finalName = `Analysis - ${expert?.name || 'Expert'} - ${date}`;
    }

    const created = await prisma.analysisSession.create({
      data: {
        name: finalName,
        expertId,
        batchId: batchId || null,
        sessionNoteId: sessionNoteId || null,
        scheduledDuration: schedDuration ? Number(schedDuration) : null,
        transcriptRaw: transcriptRaw || null,
        v3Status: "PENDING",
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/analysis]", err);
    return NextResponse.json({ error: "Failed to create analysis session." }, { status: 500 });
  }
}
