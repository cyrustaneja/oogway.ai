import { NextResponse } from "next/server";
import { getAuthToken } from "@/lib/auth-token";
import { prisma } from "@/lib/db";

// GET /api/batches/[id]
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getAuthToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const batch = await prisma.batch.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, name: true } },
        sessions: {
          orderBy: { createdAt: "desc" },
          include: {
            expert: { select: { name: true } },
            sessionNote: { 
              select: { 
                name: true, 
                moduleId: true,
                module: { select: { id: true, name: true } } 
              } 
            },
            batch: { select: { name: true } },
          }
        }
      }
    });

    if (!batch) return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    return NextResponse.json(batch);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch batch" }, { status: 500 });
  }
}
