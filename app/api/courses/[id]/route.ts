import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { softDelete } from "@/lib/db/soft-delete";

// GET /api/courses/[id]
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        modules: {
          include: {
            sessions: { // SessionNotes
              include: {
                analysisSessions: {
                  orderBy: { createdAt: "desc" },
                  include: {
                    expert: { select: { id: true, name: true } },
                    sessionNote: { select: { name: true, module: { select: { id: true, name: true } } } },
                    batch: { select: { id: true, name: true } },
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

    // Flatten all analyses from all modules and notes
    const allAnalyses = course.modules.flatMap(m => 
      m.sessions.flatMap(sn => sn.analysisSessions)
    );

    return NextResponse.json({
      ...course,
      allAnalyses: allAnalyses.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch course history" }, { status: 500 });
  }
}

/**
 * PATCH: Updates a Course's details.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, description } = await req.json();
  const updated = await prisma.course.update({
    where: { id },
    data: { name, description }
  });

  return NextResponse.json(updated);
}

/**
 * DELETE: Moves a Course to the Recycle Bin.
 */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await softDelete("course", id);
  return NextResponse.json({ success: true });
}
