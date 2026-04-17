/**
 * PIPELINE ORCHESTRATOR
 *
 * Runs all stages in sequence for a given AnalysisSession ID.
 * Writes results to the database as each stage completes.
 * Updates v3Status and heartbeat throughout.
 *
 * STAGES:
 *   PREPROCESSING  → Stage 0: parse .vtt
 *   EXTRACTING     → Stage 1: detect chapters → Stage 2: slice → Stage 3: extract (INSIGHTS)
 *   AGGREGATING    → Stage 5: compute timeline
 *   SYNTHESISING   → Stage 6: generate overall/expert/student synthesis
 *   COMPLETE
 */

import { prisma } from "@/lib/db";
import { preprocessWebVTT } from "./stage0-preprocess";
import { detectChapters } from "./stage1-structure";
import { sliceTranscriptByChapters } from "./stage2-slicer";
import { extractChapter } from "./stage3-extract";
import { aggregateResults } from "./stage5-aggregate";
import { runStage6Synthesis } from "./stage6-synthesis";

// ─── STATUS HELPER ────────────────────────────────────────────────────────────

type PipelineStatus = "PENDING" | "PREPROCESSING" | "EXTRACTING" | "AGGREGATING" | "SYNTHESISING" | "COMPLETE" | "FAILED";

async function setStatus(sessionId: string, status: PipelineStatus, progress?: string) {
  await prisma.analysisSession.update({
    where: { id: sessionId },
    data: { 
      v3Status: status, 
      v3Progress: progress || null,
      heartbeat: new Date() 
    },
  });
}

async function heartbeat(sessionId: string) {
  await prisma.analysisSession.update({
    where: { id: sessionId },
    data: { heartbeat: new Date() },
  });
}

// ─── TRANSCRIPT FETCHER ───────────────────────────────────────────────────────

async function fetchTranscript(session: { transcriptRaw: string | null; transcriptPath: string | null }): Promise<string> {
  if (session.transcriptRaw && session.transcriptRaw.trim().length > 100) {
    return session.transcriptRaw;
  }
  if (session.transcriptPath) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bucket = process.env.SUPABASE_BUCKET ?? "transcripts";

    if (!supabaseUrl || !serviceKey) {
      throw new Error("TRANSCRIPT_FETCH: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set to fetch from storage.");
    }

    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(supabaseUrl, serviceKey);
    const { data, error } = await supabase.storage.from(bucket).download(session.transcriptPath);

    if (error || !data) {
      throw new Error(`TRANSCRIPT_FETCH: Supabase error — ${error?.message ?? "unknown"}`);
    }
    return await data.text();
  }
  throw new Error("TRANSCRIPT_FETCH: No transcript source available (transcriptRaw and transcriptPath are both empty).");
}

// ─── MAIN ORCHESTRATOR ─────────────────────────────────────────────────────────

export async function runPipeline(sessionId: string): Promise<void> {
  const session = await prisma.analysisSession.findUnique({
    where: { id: sessionId },
    include: {
      expert: true,
      sessionNote: { include: { module: { include: { course: true } } } },
    },
  });

  if (!session) throw new Error(`PIPELINE: Session ${sessionId} not found.`);
  if (session.v3Status === "COMPLETE") {
    console.log(`[PIPELINE] Session ${sessionId} is already COMPLETE. Skipping.`);
    return;
  }

  const trainerName = session.expert?.name ?? "Trainer";
  const sessionNotes = session.sessionNote
    ? [
        `Module: ${session.sessionNote.module.name}`,
        `Course: ${session.sessionNote.module.course.name}`,
        `Session: ${session.sessionNote.name}`,
        session.sessionNote.phase ? `Phase: ${session.sessionNote.phase}` : "",
        session.sessionNote.prerequisites ? `Prerequisites: ${session.sessionNote.prerequisites}` : "",
        session.sessionNote.keyTopics.length > 0 ? `Key Topics: ${session.sessionNote.keyTopics.join(", ")}` : "",
        session.sessionNote.expertGaps ? `Known Expert Gaps: ${session.sessionNote.expertGaps}` : "",
      ].filter(Boolean).join("\n")
    : "No session notes provided.";

  try {
    // ── STAGE 0: Preprocess ─────────────────────────────────────────
    await setStatus(sessionId, "PREPROCESSING", "0/6");
    const rawVtt = await fetchTranscript(session);
    const cleanTranscript = preprocessWebVTT(rawVtt);
    console.log(`[PIPELINE:${sessionId}] Stage 0 complete — ${cleanTranscript.split("\n").length} lines.`);

    // ── STAGE 1: Detect Chapters ───────────────────────────────────
    await setStatus(sessionId, "EXTRACTING", "1/6");
    const chapters = await detectChapters(cleanTranscript);
    console.log(`[PIPELINE:${sessionId}] Stage 1 complete — ${chapters.length} chapters detected.`);

    await prisma.analysisChapter.deleteMany({ where: { sessionId } });
    await prisma.analysisChapter.createMany({
      data: chapters.map((c) => ({
        sessionId,
        chapterIndex: c.chapterIndex,
        chapterTitle: c.chapterTitle,
        startTime: c.startTime,
        endTime: c.endTime,
      })),
    });

    const slices = sliceTranscriptByChapters(cleanTranscript, chapters);

    // ── STAGE 3: Extract per chapter ──────────────────────────────────
    const existingExtracts = await prisma.chapterExtractionResult.findMany({
      where: { sessionId, task: "INSIGHTS" },
      select: { chapterIndex: true, status: true },
    });

    const tasksToCreate: any[] = [];
    for (const chapter of chapters) {
      const exists = existingExtracts.some((e) => e.chapterIndex === chapter.chapterIndex);
      if (!exists) {
        tasksToCreate.push({
          sessionId,
          chapterIndex: chapter.chapterIndex,
          chapterTitle: chapter.chapterTitle,
          task: "INSIGHTS",
          status: "pending",
        });
      }
    }

    if (tasksToCreate.length > 0) {
      await prisma.chapterExtractionResult.createMany({ data: tasksToCreate });
    }

    const failedChapterIndices: number[] = [];

    for (const slice of slices) {
      await heartbeat(sessionId);
      const { chapterIndex, chapterTitle } = slice.chapter;

      const isComplete = existingExtracts.some(
        (e) => e.chapterIndex === chapterIndex && e.status === "complete"
      );
      if (isComplete) {
        console.log(`[PIPELINE:${sessionId}] Stage 3 — chapter ${chapterIndex} already complete. Skipping.`);
        continue;
      }

      const currentChapterIdx = chapters.indexOf(slice.chapter) + 1;
      await setStatus(sessionId, "EXTRACTING", `3/6 (${currentChapterIdx}/${chapters.length})`);

      console.log(`[PIPELINE:${sessionId}] Stage 3 — extracting chapter ${chapterIndex}: ${chapterTitle}`);

      try {
        const result = await extractChapter(slice, sessionNotes);
        
        await prisma.chapterExtractionResult.update({
          where: { sessionId_chapterIndex_task: { sessionId, chapterIndex, task: "INSIGHTS" } },
          data: { status: "complete", resultJson: result.resultJson as any, attemptCount: { increment: 1 } },
        });

        await new Promise(r => setTimeout(r, 50));
      } catch (err: any) {
        console.error(`[PIPELINE:${sessionId}] Chapter ${chapterIndex} extraction failed:`, err.message);
        failedChapterIndices.push(chapterIndex);
        await prisma.chapterExtractionResult.update({
          where: { sessionId_chapterIndex_task: { sessionId, chapterIndex, task: "INSIGHTS" } },
          data: { status: "failed", errorMessage: err.message, attemptCount: { increment: 1 } },
        });
      }
    }

    // ── STAGE 5: Aggregate ─────────────────────────────────────────
    await setStatus(sessionId, "AGGREGATING", "5/6");
    console.log(`[PIPELINE:${sessionId}] Stage 5 — generating session flow...`);

    const extractionRows = await prisma.chapterExtractionResult.findMany({
      where: { sessionId, status: "complete", task: "INSIGHTS" },
      orderBy: { chapterIndex: 'asc' }
    });

    // We build an array containing the exact extraction payload per chapter + start/end times
    const chapterRowsForAggr = chapters.map(c => {
      const ext = extractionRows.find(e => e.chapterIndex === c.chapterIndex);
      return {
        chapterIndex: c.chapterIndex,
        chapterTitle: c.chapterTitle,
        startTime: c.startTime,
        endTime: c.endTime,
        resultJson: ext?.resultJson || {}
      };
    });

    const sessionFlow = aggregateResults(chapterRowsForAggr);

    // Save partial flow to UI can render intermediate status
    await prisma.sessionOverallAnalysis.upsert({
      where: { sessionId },
      create: {
        sessionId,
        status: "synthesising",
        sessionFlow: sessionFlow as any,
        failedChapterIndices,
      },
      update: {
        status: "synthesising",
        sessionFlow: sessionFlow as any,
        failedChapterIndices,
      },
    });

    // ── STAGE 6: Overall Synthesis ────────────────────────────────
    await setStatus(sessionId, "SYNTHESISING", "6/6");
    console.log(`[PIPELINE:${sessionId}] Stage 6 — overall synthesis...`);
    const { overallSummary, expertAnalysis, studentAnalysis } = await runStage6Synthesis(sessionFlow, sessionNotes, trainerName);

    // Save final overall synthesis
    await prisma.sessionOverallAnalysis.update({
      where: { sessionId },
      data: {
        status: "complete",
        overallSummary: overallSummary as any,
        expertAnalysis: expertAnalysis as any,
        studentAnalysis: studentAnalysis as any,
      },
    });

    // ── Mark COMPLETE ───────────────────────────────────────────────
    await setStatus(sessionId, "COMPLETE", "Complete");
    console.log(`[PIPELINE:${sessionId}] ✅ COMPLETE.`);

  } catch (err: any) {
    console.error(`[PIPELINE:${sessionId}] ❌ FAILED:`, err.message);
    await prisma.analysisSession.update({
      where: { id: sessionId },
      data: { 
        v3Status: "FAILED", 
        v3Error: err.message, 
        heartbeat: new Date() 
      },
    });
    throw err;
  }
}
