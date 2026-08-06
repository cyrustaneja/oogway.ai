export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getAuthToken } from "@/lib/auth-token";
import { prisma } from "@/lib/db";

// GET /api/courses — list all courses with nested modules + session notes
export async function GET() {
  const token = await getAuthToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const courses = await prisma.course.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      modules: {
        where: { deletedAt: null },
        orderBy: { order: "asc" },
        include: {
          evaluationConfigs: {
            where: { deletedAt: null },
          },
          sessions: {
            where: { deletedAt: null },
            orderBy: [{ weekOrder: "asc" }, { createdAt: "asc" }],
            select: {
              id: true,
              name: true,
              sessionId: true,
              phase: true,
              content: true,
              expertBrief: true,
              sessionType: true,
              expertType: true,
              duration: true,
              weekOrder: true,
              evaluationRequired: true,
              linkContent: true,
              linkCharter: true,
              linkModelSolution: true,
              linkTest: true,
              linkEvalParams: true,
              syncedAt: true,
            },
          },
        },
      },
    },
  });

  return NextResponse.json(courses);
}

// POST /api/courses — create a new course
export async function POST(req: Request) {
  const token = await getAuthToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (token as any).role;
  if (role !== "ADMIN" && role !== "TEAM") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { name, description } = await req.json();
    if (!name) return NextResponse.json({ error: "name is required." }, { status: 400 });

    const course = await prisma.course.create({ data: { name, description } });
    return NextResponse.json(course, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/courses] FATAL SAVE ERROR:", err);
    return NextResponse.json({ 
      error: "Critical Database Error: Failed to save course structure.",
      details: err.message
    }, { status: 500 });
  }
}
