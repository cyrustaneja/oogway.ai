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
  console.log(`[GET /api/analysis/${id}] Fetching...`);

  try {
    const analysis = await prisma.analysisSession.findUnique({
      where: { id, deletedAt: null },
      include: {
        expert: true,
        sessionNote: {
          include: { module: { include: { course: true } } },
        },
        chapters: { orderBy: { chapterIndex: "asc" } },
        extractionResults: { orderBy: { chapterIndex: "asc" } },
        overallAnalysis: true,
        v2Analysis: {
          include: {
            scores: { orderBy: { createdAt: "asc" } }
          }
        }
      },
    });

    if (!analysis) {
      console.warn(`[GET /api/analysis/${id}] Not found or deleted.`);
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    console.log(`[GET /api/analysis/${id}] Success: ${analysis.name}`);
    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error(`[GET /api/analysis/${id}] Error:`, error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

import { softDelete } from "@/lib/db/soft-delete";

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

  await softDelete("analysisSession", id);
  return NextResponse.json({ success: true });
}
