export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getAuthToken } from "@/lib/auth-token";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET() {
  const token = await getAuthToken();

  if (!token || (token as any).role !== "ADMIN" && (token as any).role !== "TEAM") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const experts = await prisma.expert.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        sessions: {
          select: { id: true, name: true, v3Status: true, createdAt: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    return NextResponse.json(experts);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch experts" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const token = await getAuthToken();

  // Only Admin or Team can create experts
  if (!token || ((token as any).role !== "ADMIN" && (token as any).role !== "TEAM")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { name, email, tags, bio } = await req.json();

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    // Default password for new experts (they should change this later, but we use email magic link in spec, 
    // however, we pivoted to credentials. So we generate a random password or a default one)
    const defaultPassword = "expertpassword123";
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    // Create Expert and User in a transaction to ensure database consistency
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the Expert record
      const expert = await tx.expert.create({
        data: {
          name,
          email,
          tags: tags || [],
          bio: bio || "",
        },
      });

      // 2. Create the associated User record with role EXPERT
      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: "EXPERT",
          expertId: expert.id,
        },
      });

      return expert;
    });

    return NextResponse.json({ ...result, defaultPassword }, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create expert:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "An expert or user with this email already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Database error occurred" }, { status: 500 });
  }
}
