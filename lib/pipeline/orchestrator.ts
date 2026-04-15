/**
 * PIPELINE ORCHESTRATOR
 *
 * Runs all stages in sequence for a given AnalysisSession ID.
 * Writes results to the database as each stage completes.
 * Updates v3Status and heartbeat throughout.
 *
 * STAGES:
 *   PREPROCESSING  → Stage 0: parse .vtt
 *   EXTRACTING     → Stage 1: detect chapters → Stage 2: slice → Stage 3: extract (per chapter)
 *   AGGREGATING    → Stage 5: compute aggregates
 *   SYNTHESISING   → Stage 6A + 6B: context + synthesis
 *   COMPLETE
 */

import { prisma } from "@/lib/db";
import { preprocessWebVTT } from "./stage0-preprocess";
import { detectChapters } from "./stage1-structure";
import { sliceTranscriptByChapters, sliceFirstNMinutes, sliceLastNMinutes } from "./stage2-slicer";
import { extractChapter } from "./stage3-extract";
import { aggregateResults, ChapterRow } from "./stage5-aggregate";
import { runStage6A, runStage6B } from "./stage6-synthesis";

// ─── STATUS HELPER ────────────────────────────────────────────────────────────

type PipelineStatus = "PENDING" | "PREPROCESSING" | "EXTRACTING" | "AGGREGATING" | "SYNTHESISING" | "COMPLETE" | "FAILED";

async function setStatus(sessionId: string, status: PipelineStatus) {
  await prisma.analysisSession.update({
    where: { id: sessionId },
    data: { v3Status: status, heartbeat: new Date() },
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
  // Prefer inline raw content
  if (session.transcriptRaw && session.transcriptRaw.trim().length > 100) {
    return session.transcriptRaw;
  }

  // Fall back to Supabase Storage path
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
  // ── Load session ────────────────────────────────────────────────────
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
    await setStatus(sessionId, "PREPROCESSING");
    const rawVtt = await fetchTranscript(session);
    const cleanTranscript = preprocessWebVTT(rawVtt);
    console.log(`[PIPELINE:${sessionId}] Stage 0 complete — ${cleanTranscript.split("\n").length} lines.`);

    // ── STAGE 1: Detect Chapters ───────────────────────────────────
    await setStatus(sessionId, "EXTRACTING");
    const chapters = await detectChapters(cleanTranscript);
    console.log(`[PIPELINE:${sessionId}] Stage 1 complete — ${chapters.length} chapters detected.`);

    // Save chapters to DB
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

    // ── STAGE 2: Slice transcript ──────────────────────────────────
    const slices = sliceTranscriptByChapters(cleanTranscript, chapters);

    // ── STAGE 3: Extract per chapter ──────────────────────────────────
    // Ensure extraction rows exist (without deleting existing progress)
    const existingExtracts = await prisma.chapterExtractionResult.findMany({
      where: { sessionId },
      select: { chapterIndex: true, task: true, status: true },
    });

    const tasksToCreate: any[] = [];
    for (const chapter of chapters) {
      for (const task of ["3A", "3B", "3C"] as const) {
        const exists = existingExtracts.some(
          (e) => e.chapterIndex === chapter.chapterIndex && e.task === task
        );
        if (!exists) {
          tasksToCreate.push({
            sessionId,
            chapterIndex: chapter.chapterIndex,
            chapterTitle: chapter.chapterTitle,
            task,
            status: "pending",
          });
        }
      }
    }

    if (tasksToCreate.length > 0) {
      await prisma.chapterExtractionResult.createMany({ data: tasksToCreate });
    }

    const failedChapterIndices: number[] = [];

    for (const slice of slices) {
      await heartbeat(sessionId);
      const { chapterIndex, chapterTitle } = slice.chapter;

      // Check if all 3 tasks for this chapter are already 'complete'
      const completedTasksForChapter = existingExtracts.filter(
        (e) => e.chapterIndex === chapterIndex && e.status === "complete"
      );

      if (completedTasksForChapter.length === 3) {
        console.log(`[PIPELINE:${sessionId}] Stage 3 — chapter ${chapterIndex} already complete. Skipping.`);
        continue;
      }

      console.log(`[PIPELINE:${sessionId}] Stage 3 — extracting chapter ${chapterIndex}: ${chapterTitle}`);

      try {
        const results = await extractChapter(slice, sessionNotes);
        
        // Update all 3 tasks (3A, 3B, 3C) in parallel for this chapter
        await Promise.all(results.map(r => 
          prisma.chapterExtractionResult.update({
            where: { sessionId_chapterIndex_task: { sessionId, chapterIndex, task: r.task } },
            data: { status: "complete", resultJson: r.resultJson as any, attemptCount: { increment: 1 } },
          })
        ));

        // Small breather to let the event loop handle other requests (like UI navigation)
        await new Promise(r => setTimeout(r, 50));
      } catch (err: any) {
        console.error(`[PIPELINE:${sessionId}] Chapter ${chapterIndex} extraction failed:`, err.message);
        failedChapterIndices.push(chapterIndex);
        await prisma.chapterExtractionResult.updateMany({
          where: { sessionId, chapterIndex, status: { not: "complete" } },
          data: { status: "failed", errorMessage: err.message, attemptCount: { increment: 1 } },
        });
      }
    }

    // ── STAGE 5: Aggregate ─────────────────────────────────────────
    await setStatus(sessionId, "AGGREGATING");
    console.log(`[PIPELINE:${sessionId}] Stage 5 — aggregating...`);

    const extractionRows = await prisma.chapterExtractionResult.findMany({
      where: { sessionId, status: "complete" },
    });

    const chapterRows: ChapterRow[] = chapters.map((c) => ({
      chapterIndex: c.chapterIndex,
      chapterTitle: c.chapterTitle,
      startTime: c.startTime,
      endTime: c.endTime,
      result3A: (extractionRows.find((r) => r.chapterIndex === c.chapterIndex && r.task === "3A")?.resultJson ?? null) as any,
      result3B: (extractionRows.find((r) => r.chapterIndex === c.chapterIndex && r.task === "3B")?.resultJson ?? null) as any,
      result3C: (extractionRows.find((r) => r.chapterIndex === c.chapterIndex && r.task === "3C")?.resultJson ?? null) as any,
    }));

    const aggregation = aggregateResults(chapterRows);

    // ── STAGE 6A: Context + Logistics ──────────────────────────────
    await setStatus(sessionId, "SYNTHESISING");
    console.log(`[PIPELINE:${sessionId}] Stage 6A — context + logistics...`);

    const contextSlice    = sliceFirstNMinutes(cleanTranscript, 20);
    const logisticsSlice  = sliceFirstNMinutes(cleanTranscript, 3) + "\n" + sliceLastNMinutes(cleanTranscript, 3);
    const contextResult   = await runStage6A(contextSlice, logisticsSlice, trainerName);

    // Save 6A partial result + aggregates
    await prisma.sessionOverallAnalysis.upsert({
      where: { sessionId },
      create: {
        sessionId,
        status: "synthesising",
        contextSetting: contextResult.context_setting as any,
        sessionLogistics: contextResult.session_logistics as any,
        sessionCounts: aggregation.sessionCounts as any,
        sessionFlow: aggregation.sessionFlow as any,
        studentProfiles: aggregation.studentProfiles as any,
        pedagogicalGaps: aggregation.pedagogicalGaps as any,
        failedChapterIndices,
      },
      update: {
        status: "synthesising",
        contextSetting: contextResult.context_setting as any,
        sessionLogistics: contextResult.session_logistics as any,
        sessionCounts: aggregation.sessionCounts as any,
        sessionFlow: aggregation.sessionFlow as any,
        studentProfiles: aggregation.studentProfiles as any,
        pedagogicalGaps: aggregation.pedagogicalGaps as any,
        failedChapterIndices,
      },
    });

    // ── STAGE 6B: Overall Synthesis ────────────────────────────────
    console.log(`[PIPELINE:${sessionId}] Stage 6B — overall synthesis...`);
    const synthesis = await runStage6B(session.name, trainerName, aggregation, contextResult);

    // Save final overall synthesis
    await prisma.sessionOverallAnalysis.update({
      where: { sessionId },
      data: {
        status: "complete",
        overallSynthesis: synthesis as any,
      },
    });

    // ── Mark COMPLETE ───────────────────────────────────────────────
    await setStatus(sessionId, "COMPLETE");
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
