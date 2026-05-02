import { NextResponse } from "next/server";
import { getAuthToken } from "@/lib/auth-token";
import { prisma } from "@/lib/db";
import { softDelete } from "@/lib/db/soft-delete";

// GET /api/session-notes/[id]
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getAuthToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const note = await prisma.sessionNote.findUnique({
      where: { id },
      include: {
        module: { select: { id: true, name: true, course: { select: { id: true, name: true } } } },
        analysisSessions: {
          orderBy: { createdAt: "desc" },
          include: {
            expert: { select: { id: true, name: true } },
            sessionNote: { select: { name: true, module: { select: { id: true, name: true } } } },
            batch: { select: { id: true, name: true } },
          }
        }
      }
    });

    if (!note) return NextResponse.json({ error: "Session definition not found" }, { status: 404 });
    return NextResponse.json(note);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch session history" }, { status: 500 });
  }
}

/**
 * PATCH: Updates a Course's Session Note details.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = await getAuthToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (token as any).role;
  if (role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, content, phase, keyTopics } = await req.json();
  const updated = await prisma.sessionNote.update({
    where: { id },
    data: { name, content, phase, keyTopics }
  });

  return NextResponse.json(updated);
}

/**
 * DELETE: Moves a Course's Session Note to the Recycle Bin.
 */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = await getAuthToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (token as any).role;
  if (role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await softDelete("sessionNote", id);
  return NextResponse.json({ success: true });
}
