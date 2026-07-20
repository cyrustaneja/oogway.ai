export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getAuthToken } from "@/lib/auth-token";
import { prisma } from "@/lib/db";
import { softDelete } from "@/lib/db/soft-delete";

// GET /api/modules/[id]
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getAuthToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const moduleData = await prisma.module.findUnique({
      where: { id },
      include: {
        course: { select: { name: true } },
        sessions: { // These are SessionNotes
          include: {
            analysisSessions: {
              orderBy: { createdAt: "desc" },
              include: {
                expert: { select: { id: true, name: true } },
                sessionNote: { 
                  select: { 
                    name: true,
                    module: { select: { id: true, name: true } }
                  } 
                },
                batch: { select: { id: true, name: true } },
              }
            }
          }
        }
      }
    });

    if (!moduleData) return NextResponse.json({ error: "Module not found" }, { status: 404 });

    // Flatten analysisSessions from all sessionNotes in this module
    const allAnalyses = moduleData.sessions.flatMap(sn => sn.analysisSessions);

    return NextResponse.json({
      ...moduleData,
      allAnalyses: allAnalyses.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    });
  } catch (error) {
    console.error("Failed to fetch module:", error);
    return NextResponse.json({ error: "Failed to fetch module history" }, { status: 500 });
  }
}
// DELETE /api/modules/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getAuthToken();
  if (!token || (token as any).role === "EXPERT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  try {
    await softDelete("module", id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete module:", error);
    return NextResponse.json({ error: "Failed to delete module" }, { status: 500 });
  }
}
