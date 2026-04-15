import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/analysis/[id]
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const analysis = await prisma.analysisSession.findUnique({
    where: { id },
    include: {
      expert: true,
      sessionNote: {
        include: { module: { include: { course: true } } },
      },
      chapters: { orderBy: { chapterIndex: "asc" } },
      extractionResults: { orderBy: { chapterIndex: "asc" } },
      overallAnalysis: true,
    },
  });

  if (!analysis) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(analysis);
}

// DELETE /api/analysis/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "TEAM") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  await prisma.analysisSession.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
