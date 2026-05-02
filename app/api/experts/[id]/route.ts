import { NextResponse } from "next/server";
import { getAuthToken } from "@/lib/auth-token";
import { prisma } from "@/lib/db";

// GET /api/experts/[id]
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getAuthToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const expert = await prisma.expert.findUnique({
      where: { id },
      include: {
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

    if (!expert) return NextResponse.json({ error: "Expert not found" }, { status: 404 });
    return NextResponse.json(expert);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch expert" }, { status: 500 });
  }
}

// PATCH /api/experts/[id]
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getAuthToken();
  if (!token || ((token as any).role !== "ADMIN" && (token as any).role !== "TEAM")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  try {
    const { name, email, tags, bio } = await req.json();

    const expert = await prisma.$transaction(async (tx) => {
      const updatedExpert = await tx.expert.update({
        where: { id },
        data: {
          name,
          email,
          tags: tags || [],
          bio: bio || "",
        },
      });

      // Update associated user if exists
      await tx.user.updateMany({
        where: { expertId: id },
        data: {
          name,
          email,
        },
      });

      return updatedExpert;
    });

    return NextResponse.json(expert);
  } catch (error: any) {
    console.error("Failed to update expert:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "An expert or user with this email already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Database error occurred" }, { status: 500 });
  }
}

import { softDelete } from "@/lib/db/soft-delete";

// DELETE /api/experts/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getAuthToken();
  if (!token || ((token as any).role !== "ADMIN" && (token as any).role !== "TEAM")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  try {
    // Soft delete the expert - this moves them to the Recycle Bin for 7 days
    await softDelete("expert", id);
    
    // We keep the User record intact so they can still see historical data or log in, 
    // but the expert profile is 'archived' in the dashboard.
    
    return NextResponse.json({ success: true, message: "Expert moved to Recycle Bin" });
  } catch (error) {
    console.error("Failed to soft-delete expert:", error);
    return NextResponse.json({ error: "Database error occurred" }, { status: 500 });
  }
}
