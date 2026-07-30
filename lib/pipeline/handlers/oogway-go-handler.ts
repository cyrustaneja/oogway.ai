import fs from 'fs'
import path from 'path'
import { prisma } from '@/lib/prisma'
import { callStage } from '@/lib/pipeline/utils/call-stage'
import { OOGWAY_GO_SYSTEM_PROMPT } from '../prompts/oogway-go-prompts'
import { oogwayGoResponseSchema } from '../schemas/oogway-go.schema'

/**
 * Oogway Go — On-demand deep expert session audit.
 * 
 * Runs the SST 6-dimension rubric against the session transcript.
 * Target: 60-120 second completion on Gemini 2.5 Flash.
 */
export async function handleOogwayGo(sessionId: string): Promise<void> {
  const session = await prisma.analysisSession.findUnique({
    where: { id: sessionId },
    include: { sessionNote: true, expert: true, batch: true }
  })

  if (!session) throw new Error(`[Oogway Go] Session not found: ${sessionId}`)

  // Mark as running
  await prisma.analysisSession.update({
    where: { id: sessionId },
    data: { oogwayGoStatus: 'RUNNING' }
  })

  try {
    // ── Fetch transcript ───────────────────────────────────────────
    let transcript = ''
    if (session.transcriptUrl) {
      try {
        const res = await fetch(session.transcriptUrl)
        if (res.ok) transcript = await res.text()
      } catch (err) {
        console.error(`[Oogway Go] Failed to fetch transcript from URL:`, err)
      }
    }

    if (!transcript && session.transcriptPath) {
      try {
        const p = path.join(process.cwd(), session.transcriptPath)
        transcript = fs.readFileSync(p, 'utf-8')
      } catch {
        transcript = session.transcript_clean ?? session.transcriptRaw ?? ''
      }
    } else if (!transcript) {
      transcript = session.transcript_clean ?? session.transcriptRaw ?? ''
    }

    if (!transcript.trim()) {
      throw new Error(`[Oogway Go] No transcript found for session ${sessionId}`)
    }

    // ── Build context ──────────────────────────────────────────────
    const sessionContext = [
      `Session Name: ${session.name}`,
      `Expert: ${session.expert?.name ?? 'Unknown'}`,
      `Batch: ${(session.batch as any)?.name ?? 'Unknown'}`,
      session.sessionNote
        ? `Topic: ${(session.sessionNote as any).name ?? 'Unknown'}\nPlanned Topics: ${((session.sessionNote as any).keyTopics ?? []).join(', ') || 'Not specified'}`
        : 'No session notes provided.',
      session.scheduledDuration ? `Scheduled Duration: ${session.scheduledDuration} minutes` : '',
    ].filter(Boolean).join('\n')

    // Slice transcript — 120k chars is the sweet spot for Flash (<2min)
    const slicedTranscript = transcript.slice(0, 120000)

    console.log(`[Oogway Go] Starting 6-dimension audit for session ${sessionId} (${slicedTranscript.length} chars)`)

    const systemPrompt = `${OOGWAY_GO_SYSTEM_PROMPT}

SESSION CONTEXT:
${sessionContext}

INSTRUCTIONS:
1. Run the pre-scoring checklist first — verify all 8 items against the transcript before scoring any dimension.
2. Score each of the 6 dimensions (1-10) using the EXACT benchmarks defined in the rubric. Use the skill file dimension names exactly: "Content Accuracy", "Pedagogical Approach", "Live Platform Walkthrough", "Pacing and Time Management", "Student Emotional Support", "Delivery Fluency".
3. Apply ALL hard rules:
   - Never score ≥ 8 if a live platform walkthrough was missing for platform-action concepts
   - Never score ≥ 8 if factual errors were left uncorrected
   - If any Notable finding exists → cap overall_score at 7.0
   - If overall_score < 7.0 → populate critical_red_flags (mandatory)
4. Provide minimum 5, aim for 10-15 detailed_findings ordered by severity (Notable first). EVERY finding must have a verbatim_quote and timestamp.
5. Generate both feedback email variants (Warm + Direct), 200-300 words each:
   - NEVER mention the numerical score in either email
   - NEVER use vague language — name the specific gap
   - ALWAYS reference the session name and batch
   - ALWAYS include what the expert did well — even in the Direct variant
   - ALWAYS include a clear, single actionable ask for the next session
   - Sign both as: Prerna
6. Be SPECIFIC: reference exact timestamps, student names, and verbatim quotes. Generic or vague observations are unacceptable.
7. Use Indian brand examples where applicable (boAt, Nykaa, Mamaearth, CRED, Zepto, Swiggy, etc.) and flag them as illustrative.
8. Terminology: Never write "Advantage+ Shopping Campaigns" — use "Advantage+ Sales Campaigns (previously Advantage+ Shopping Campaigns)" on first mention.`

    const finalResult = await callStage<any>({
      model: 'gemini-2.5-flash',
      stageName: 'oogway_go_audit',
      system: systemPrompt,
      user: `TRANSCRIPT:\n${slicedTranscript}`,
      responseSchema: oogwayGoResponseSchema,
      initialBudget: 12000,
      maxBudget: 32768,
      timeoutMs: 120_000 // 2 minute timeout
    })

    console.log(`[Oogway Go] Audit complete for session ${sessionId}. Overall score: ${finalResult.overall_score}. Saving...`)

    await prisma.analysisSession.update({
      where: { id: sessionId },
      data: {
        oogwayGoResult: finalResult as any,
        oogwayGoStatus: 'COMPLETE',
        updatedAt: new Date()
      }
    })
  } catch (error: any) {
    console.error(`[Oogway Go] Failed for session ${sessionId}:`, error)
    await prisma.analysisSession.update({
      where: { id: sessionId },
      data: {
        oogwayGoStatus: 'FAILED',
        updatedAt: new Date()
      }
    })
    throw error
  }
}
