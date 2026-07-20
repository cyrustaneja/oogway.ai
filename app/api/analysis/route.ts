export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getAuthToken } from "@/lib/auth-token";
import { prisma } from "@/lib/db";
import { POST as triggerTick } from "@/app/api/pipeline/tick/route";

// GET /api/analysis — list all sessions (newest first)
export async function GET() {
  const token = await getAuthToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (token as any).role;
  const userId = (token as any).id;

  // Filter out soft-deleted sessions and apply role-based visibility
  const where: any = { deletedAt: null };
  if (role === "EXPERT") {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { expertId: true } });
    if (!user?.expertId) return NextResponse.json([]);
    where.expertId = user.expertId;
  }

  const analyses = await prisma.analysisSession.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      expertId: true,
      batchId: true,
      sessionNoteId: true,
      scheduledDuration: true,
      v3Status: true,
      v3Progress: true,
      v3Error: true,
      heartbeat: true,
      deletedAt: true,
      createdAt: true,
      updatedAt: true,
      pipeline_stage: true,
      next_action_at: true,
      stage_attempts: true,
      chapters_json: true,
      transcript_quality: true,
      transcript_quality_signals: true,
      schema_version: true,
      zoom_recording_id: true,
      zoom_download_url: true,
      source: true,
      expert: { select: { id: true, name: true } },
      sessionNote: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(analyses);
}

import { z } from "zod";

const createSessionSchema = z.object({
  name: z.string().optional(),
  expertId: z.string().min(1, "expertId is required"),
  sessionNoteId: z.string().optional(),
  schedDuration: z.union([z.string(), z.number()]).optional(),
  batchId: z.string().optional(),
  videoUrl: z.string().url("Invalid video URL").min(1, "Video URL is mandatory"),
  transcriptUrl: z.string().url("Invalid transcript URL").optional().or(z.literal("")),
  transcriptText: z.string().optional(),
  tier: z.enum(["TIER1", "TIER3"]).default("TIER1"),
});

// POST /api/analysis — create a new AnalysisSession
export async function POST(req: Request) {
  const token = await getAuthToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (token as any).role;
  if (role === "EXPERT") {
    return NextResponse.json({ error: "Experts cannot create analysis sessions." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = createSessionSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { name, expertId, sessionNoteId, schedDuration, batchId, videoUrl, transcriptUrl, transcriptText, tier } = parsed.data;

    // Generate name if missing
    let finalName = name;
    if (!finalName) {
      const expert = await prisma.expert.findUnique({ where: { id: expertId }, select: { name: true } });
      const date = new Date().toLocaleDateString("en-GB", { day: '2-digit', month: 'short' });
      finalName = `Analysis - ${expert?.name || 'Expert'} - ${date}`;
    }

    const created = await prisma.analysisSession.create({
      data: {
        name: finalName,
        expertId,
        batchId: batchId || null,
        sessionNoteId: sessionNoteId || null,
        scheduledDuration: schedDuration ? Number(schedDuration) : null,
        videoUrl: videoUrl,
        transcriptUrl: transcriptUrl || null,
        transcriptRaw: transcriptText || null,
        v3Status: "PENDING",
        tier,
        pipeline_stage: tier === "TIER1" ? "PULSE_PENDING" : "UPLOADED",
      },
    });

    // Trigger the background pipeline tick immediately so it doesn't wait for cron
    // and gets processed locally within 30 seconds.
    setTimeout(() => {
      triggerTick(new Request("http://localhost/api/pipeline/tick", { 
        method: "POST",
        headers: { authorization: `Bearer ${process.env.CRON_SECRET}` }
      })).catch(console.error);
    }, 1000);

    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/analysis]", err);
    return NextResponse.json({ error: "Failed to create analysis session." }, { status: 500 });
  }
}
