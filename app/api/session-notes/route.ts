import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const sessions = await prisma.sessionNote.findMany({
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
