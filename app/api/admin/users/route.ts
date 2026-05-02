import { NextResponse } from "next/server";
import { getAuthToken } from "@/lib/auth-token";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const token = await getAuthToken();

  // Only Admin can create other admins/team members
  if (!token || (token as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { name, email, role, password } = await req.json();

    if (!name || !email || !role) {
      return NextResponse.json({ error: "Name, email, and role are required" }, { status: 400 });
    }

    if (!["ADMIN", "TEAM", "EXPERT"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const defaultPassword = password || "kraftshala123";
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const result = await prisma.$transaction(async (tx) => {
      // If role is EXPERT, we should ideally also create an Expert record
      // But for now, let's handle the direct User creation as requested
      
      let expertId = null;
      if (role === "EXPERT") {
        const expert = await tx.expert.create({
          data: {
            name,
            email,
            tags: [],
            bio: "",
          },
        });
        expertId = expert.id;
      }

      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          role,
          expertId,
        },
      });

      return user;
    });

    return NextResponse.json({ 
      id: result.id, 
      name: result.name, 
      email: result.email, 
      role: result.role,
      defaultPassword 
    }, { status: 201 });

  } catch (error: any) {
    console.error("Failed to create user:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Database error occurred" }, { status: 500 });
  }
}
