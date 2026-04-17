import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { runPipeline } from "@/lib/pipeline/orchestrator";
import { waitUntil } from "@vercel/functions";

export const maxDuration = 300; // 5 minutes max on Vercel

// POST /api/analysis/[id]/start
// Resets any failed/pending state and fires the pipeline.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role === "EXPERT") {
    return NextResponse.json({ error: "Experts cannot trigger analysis." }, { status: 403 });
  }

  const { id } = await params;

  const analysisSession = await prisma.analysisSession.findUnique({
    where: { id },
    select: { id: true, v3Status: true, transcriptRaw: true, transcriptPath: true },
  });

  if (!analysisSession) {
    return NextResponse.json({ error: "Analysis session not found." }, { status: 404 });
  }

  const hasTranscript = !!(analysisSession.transcriptRaw || analysisSession.transcriptPath);
  if (!hasTranscript) {
    return NextResponse.json({
      error: "No transcript found. Upload a .vtt file first.",
    }, { status: 400 });
  }

  if (analysisSession.v3Status === "COMPLETE") {
    return NextResponse.json({ message: "This session is already COMPLETE." }, { status: 200 });
  }

  const runningStatuses = ["PREPROCESSING", "EXTRACTING", "AGGREGATING", "SYNTHESISING"];
  if (runningStatuses.includes(analysisSession.v3Status)) {
    return NextResponse.json({
      message: `Pipeline is already running (status: ${analysisSession.v3Status}).`,
    }, { status: 200 });
  }

  // Reset the session to PENDING and clear any previous error
  // This ensures the UI shows the correct state when retrying a FAILED session
  await prisma.analysisSession.update({
    where: { id },
    data: {
      v3Status: "PENDING",
      v3Error: null,
      heartbeat: new Date(),
    },
  });

  // Fire pipeline in background — waitUntil keeps the lambda alive on Vercel,
  // and falls back to a fire-and-forget on local dev (Node keeps the process alive).
  waitUntil(
    runPipeline(id).catch((err) => {
      console.error(`[/api/analysis/${id}/start] Pipeline failed:`, err.message);
    })
  );

  return NextResponse.json({ message: "Pipeline started.", sessionId: id }, { status: 202 });
}
