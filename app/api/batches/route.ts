import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const batches = await prisma.batch.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        course: { select: { id: true, name: true } },
        sessions: {
          where: { deletedAt: null },
          select: { id: true, name: true, v3Status: true },
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        _count: {
          select: { sessions: true }
        }
      }
    });
    return NextResponse.json(batches);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch batches" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role === "EXPERT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { name, description, courseId } = await req.json();
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const batch = await prisma.batch.create({
      data: { 
        name, 
        description,
        courseId: courseId || null
      }
    });
    return NextResponse.json(batch, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create batch" }, { status: 500 });
  }
}
