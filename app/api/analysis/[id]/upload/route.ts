import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// POST /api/analysis/[id]/upload
// Accepts a .vtt file and stores it inline as transcriptRaw
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.analysisSession.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  try {
    const formData = await req.formData();
    const file = formData.get("transcript") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded. Field name must be 'transcript'." }, { status: 400 });
    }

    if (!file.name.endsWith(".vtt") && !file.name.endsWith(".txt")) {
      return NextResponse.json({ error: "Only .vtt or .txt transcript files are supported." }, { status: 400 });
    }

    const text = await file.text();

    await prisma.analysisSession.update({
      where: { id },
      data: { transcriptRaw: text },
    });

    return NextResponse.json({ success: true, size: text.length });
  } catch (err: any) {
    console.error("[POST /api/analysis/[id]/upload]", err);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
