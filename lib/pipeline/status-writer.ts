import { prisma } from "@/lib/db";
import { PipelineStatus } from "@prisma/client";

/**
 * STATUS WRITER — Production-Grade Debounced DB Writer
 *
 * Problem it solves:
 * The pipeline previously called prisma.analysisSession.update() on every
 * stage transition (~12 times per analysis). With 3 concurrent analyses,
 * that's 36 simultaneous pool requests against a pool of 10, causing timeouts.
 *
 * Solution:
 * Buffers status updates in memory and flushes to DB at most once every
 * WRITE_INTERVAL_MS (5 seconds). The final status (COMPLETE/FAILED) is
 * always written immediately — no buffering on terminal states.
 *
 * Usage:
 *   const writer = new StatusWriter(sessionId);
 *   writer.set("EXTRACTING", "30%");
 *   // ... later ...
 *   await writer.complete();   // or writer.fail(errorMessage)
 */

const WRITE_INTERVAL_MS = 5_000;

export class StatusWriter {
  private sessionId: string;
  private pendingStatus: PipelineStatus | null = null;
  private pendingProgress: string | null = null;
  private pendingError: string | null = null;
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private flushing = false;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  /**
   * Queue a status update. Will be written within WRITE_INTERVAL_MS.
   * Do NOT use for terminal states (COMPLETE/FAILED) — use complete()/fail() instead.
   */
  set(status: PipelineStatus, progress?: string) {
    this.pendingStatus = status;
    if (progress !== undefined) this.pendingProgress = progress;

    if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => this._flush(), WRITE_INTERVAL_MS);
    }
  }

  /**
   * Immediately write COMPLETE status and clear the buffer.
   */
  async complete() {
    this._cancelTimer();
    await this._writeNow("COMPLETE", "100%", null);
    console.log(`[StatusWriter:${this.sessionId}] ✅ Final status: COMPLETE`);
  }

  /**
   * Immediately write FAILED status with error message and clear the buffer.
   */
  async fail(error: string) {
    this._cancelTimer();
    await this._writeNow("FAILED", null, error);
    console.log(`[StatusWriter:${this.sessionId}] ❌ Final status: FAILED — ${error}`);
  }

  /**
   * Force an immediate flush of any pending update.
   * Safe to call multiple times — no-ops if nothing is pending.
   */
  async flush() {
    this._cancelTimer();
    await this._flush();
  }

  private async _flush() {
    if (this.flushing || !this.pendingStatus) return;
    this.flushing = true;
    this.flushTimer = null;

    const status = this.pendingStatus;
    const progress = this.pendingProgress;
    this.pendingStatus = null;
    this.pendingProgress = null;

    try {
      await this._writeNow(status, progress, null);
    } catch (err: any) {
      // Non-fatal: log but do not throw — pipeline health > observability
      console.error(`[StatusWriter:${this.sessionId}] ⚠️ Flush failed (non-fatal):`, err.message);
    } finally {
      this.flushing = false;
    }
  }

  private async _writeNow(
    status: PipelineStatus,
    progress: string | null,
    error: string | null
  ) {
    const data: Record<string, any> = {
      v3Status: status,
      heartbeat: new Date(),
    };
    if (progress !== null) data.v3Progress = progress;
    if (error !== null) data.v3Error = error;

    await prisma.analysisSession.update({
      where: { id: this.sessionId },
      data,
    });

    console.log(`[StatusWriter:${this.sessionId}] DB write → status=${status} progress=${progress ?? "-"}`);
  }

  private _cancelTimer() {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
  }
}
