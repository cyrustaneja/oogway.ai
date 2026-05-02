export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getAuthToken } from "@/lib/auth-token";
import { prisma } from "@/lib/db";

// POST /api/courses/[id]/modules — add a module to a course
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getAuthToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (token as any).role;
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
