import { NextResponse } from "next/server";
import { getAuthToken } from "@/lib/auth-token";
import { prisma } from "@/lib/db";

export async function GET() {
  const token = await getAuthToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const sessions = await prisma.sessionNote.findMany({
      where: { 
        deletedAt: null,
        module: { deletedAt: null }
      },
      include: {
        module: {
          include: {
            course: { select: { name: true } }
          }
        }
      },
      orderBy: { name: "asc" }
    });
    
    return NextResponse.json(sessions);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch session notes" }, { status: 500 });
  }
}
