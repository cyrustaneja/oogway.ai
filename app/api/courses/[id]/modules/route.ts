import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// POST /api/courses/[id]/modules — add a module to a course
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

  const { id: courseId } = await params;
  const { name, order } = await req.json();
  if (!name) return NextResponse.json({ error: "name is required." }, { status: 400 });

  const mod = await prisma.module.create({
    data: { name, order: order ?? 0, courseId },
  });
  return NextResponse.json(mod, { status: 201 });
}
