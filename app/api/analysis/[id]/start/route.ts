import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { runPipeline } from "@/lib/pipeline/orchestrator";
import { waitUntil } from "@vercel/functions";

export const maxDuration = 300; // 5 minutes max on Vercel Pro

// POST /api/analysis/[id]/start
// Validates the session is ready, then fires the pipeline as a Vercel background function.
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
      error: "No transcript found. Upload a .vtt file first via POST /api/analysis/[id]/upload",
    }, { status: 400 });
  }

  if (analysisSession.v3Status === "COMPLETE") {
    return NextResponse.json({ message: "This session is already COMPLETE." }, { status: 200 });
  }

  const runningStatuses = ["PREPROCESSING", "EXTRACTING", "AGGREGATING", "SYNTHESISING"];
  if (runningStatuses.includes(analysisSession.v3Status)) {
    return NextResponse.json({ message: `Pipeline is already running (status: ${analysisSession.v3Status}).` }, { status: 200 });
  }

  // Use Vercel's waitUntil to execute the pipeline securely in the background
  // without blocking the HTTP response, and keeping the lambda alive for maxDuration.
  waitUntil(
    runPipeline(id).catch((err) => {
      console.error(`[/api/analysis/${id}/start] Background pipeline failed:`, err.message);
    })
  );

  return NextResponse.json({ message: "Pipeline started.", sessionId: id }, { status: 202 });
}


