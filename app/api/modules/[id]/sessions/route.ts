import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// POST /api/modules/[id]/sessions — add a SessionNote to a module
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "TEAM") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: moduleId } = await params;
  const { name, content, phase, prerequisites, keyTopics, expertGaps } = await req.json();

  if (!name) return NextResponse.json({ error: "name is required." }, { status: 400 });

  try {
    const sessionNote = await prisma.sessionNote.create({
      data: {
        name,
        content: content || null,
        phase: phase || null,
        prerequisites: prerequisites || null,
        keyTopics: keyTopics || [],
        expertGaps: expertGaps || null,
        moduleId,
      },
    });
    console.log("Successfully created session note:", sessionNote.id);
    return NextResponse.json(sessionNote, { status: 201 });
  } catch (error: any) {
    console.error("Error creating session note:", error);
    return NextResponse.json({ 
      error: `Failed to create session note: ${error.message}`,
      details: error.code // Prisma error code
    }, { status: 500 });
  }
}
