import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/modules/[id]
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const module = await prisma.module.findUnique({
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

    if (!module) return NextResponse.json({ error: "Module not found" }, { status: 404 });

    // Flatten analysisSessions from all sessionNotes in this module
    const allAnalyses = module.sessions.flatMap(sn => sn.analysisSessions);

    return NextResponse.json({
      ...module,
      allAnalyses: allAnalyses.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    });
  } catch (error) {
    console.error("Failed to fetch module:", error);
    return NextResponse.json({ error: "Failed to fetch module history" }, { status: 500 });
  }
}
