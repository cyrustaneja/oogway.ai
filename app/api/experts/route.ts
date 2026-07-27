export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getAuthToken } from "@/lib/auth-token";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

// GET /api/experts — List ALL active users (Admins, Team Members, Experts)
export async function GET() {
  const token = await getAuthToken();

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (token as any).role;
  if (role === "EXPERT") {
    return NextResponse.json({ error: "Access Denied: The user directory is reserved for Admins and Team members." }, { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
        OR: [
          { expertId: null },
          { expert: { deletedAt: null } }
        ]
      },
      orderBy: { createdAt: "desc" },
      include: {
        expert: {
          include: {
            sessions: {
              where: { deletedAt: null },
              select: { id: true, name: true, v3Status: true, createdAt: true, tier: true },
              orderBy: { createdAt: 'desc' }
            }
          }
        }
      }
    });

    // Unified format for roster display
    const roster = users
      .filter((u) => u.deletedAt === null && (!u.expert || u.expert.deletedAt === null))
      .map((u) => ({
        id: u.expert?.id || u.id,
        userId: u.id,
        name: u.name || u.expert?.name || "User",
        email: u.email,
        tags: u.expert?.tags || [],
        bio: u.expert?.bio || null,
        user: { role: u.role },
        sessions: u.expert?.sessions || [],
        createdAt: u.createdAt,
      }));

    return NextResponse.json(roster);
  } catch (error) {
    console.error("[GET /api/experts]", error);
    return NextResponse.json({ error: "Failed to fetch user roster" }, { status: 500 });
  }
}

// POST /api/experts — Create new user (ADMIN ONLY)
export async function POST(req: Request) {
  const token = await getAuthToken();

  // ONLY ADMIN can create users & manage access roles
  if (!token || (token as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Only Admins can create users or assign access roles." }, { status: 403 });
  }

  try {
    const { name, email, tags, bio, role: requestedRole } = await req.json();

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const assignedRole: "ADMIN" | "TEAM" | "EXPERT" = 
      requestedRole === "ADMIN" ? "ADMIN" : requestedRole === "TEAM" ? "TEAM" : "EXPERT";

    const defaultPassword = "expertpassword123";
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    // If an active (non-deleted) user already exists with this email, return conflict
    const existingActiveUser = await prisma.user.findFirst({
      where: { email: cleanEmail, deletedAt: null },
    });
    if (existingActiveUser) {
      return NextResponse.json({ error: `An active user with email "${cleanEmail}" already exists.` }, { status: 409 });
    }

    // Clean up any soft-deleted records occupying this email so re-creation succeeds seamlessly
    await prisma.user.deleteMany({
      where: { email: cleanEmail, deletedAt: { not: null } },
    });
    await prisma.expert.deleteMany({
      where: { email: cleanEmail, deletedAt: { not: null } },
    });

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Expert profile
      const expert = await tx.expert.create({
        data: {
          name,
          email: cleanEmail,
          tags: tags || [],
          bio: bio || "",
        },
      });

      // 2. Create User account with designated role
      const user = await tx.user.create({
        data: {
          name,
          email: cleanEmail,
          passwordHash,
          role: assignedRole,
          expertId: expert.id,
        },
      });

      return { expert, user };
    });

    return NextResponse.json({ ...result.expert, user: { role: result.user.role }, defaultPassword }, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create user:", error);
    return NextResponse.json({ error: error.message || "Database error occurred" }, { status: 500 });
  }
}
