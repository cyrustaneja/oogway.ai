import fs from 'fs'
import path from 'path'
import { prisma } from '@/lib/prisma'
import { LIMITS } from '@/lib/config/limits'
import { callStage } from '@/lib/pipeline/utils/call-stage'
import { OOGWAY_PULSE_SYSTEM_PROMPT } from '../prompts/oogway-pulse-prompts'
import { pulseResponseSchema } from '../schemas/pulse.schema'

export async function handleTier1Review(sessionId: string): Promise<void> {
  const session = await prisma.analysisSession.findUnique({
    where: { id: sessionId },
    include: { sessionNote: true }
  })

  if (!session) throw new Error(`[Pulse] Session not found: ${sessionId}`)

  let transcript = ''
  if (session.transcriptUrl) {
    try {
      const res = await fetch(session.transcriptUrl)
      if (res.ok) transcript = await res.text()
    } catch (err) {
      console.error(`[Pulse] Failed to fetch transcript from URL:`, err)
    }
  }

  if (!transcript && session.transcriptPath) {
    try {
      const p = path.join(/*turbopackIgnore: true*/ process.cwd(), session.transcriptPath)
      transcript = fs.readFileSync(p, 'utf-8')
    } catch {
      transcript = session.transcript_clean ?? session.transcriptRaw ?? ''
    }
  } else if (!transcript) {
    transcript = session.transcript_clean ?? session.transcriptRaw ?? ''
  }

  if (!transcript.trim()) {
    throw new Error(`[Pulse] No transcript found for session ${sessionId}`)
  }

  const sessionContext = session.sessionNote
    ? `Session Topic: ${(session.sessionNote as any).name ?? 'Unknown'}\nPlanned Topics: ${((session.sessionNote as any).keyTopics ?? []).join(', ') || 'Not specified'}`
    : 'No session notes provided.'

  // Slice transcript to a maximum of 250,000 characters to keep latency extremely low (under 15-20 seconds)
  // while ensuring we capture all the crucial context of the session.
  const slicedTranscript = transcript.slice(0, 250000)

  console.log(`[Pulse] Triggering single-call Oogway Pulse review for session ${sessionId} (${slicedTranscript.length} chars).`)

  const systemPrompt = `You are Oogway, KraftShala's AI educational auditor.
${OOGWAY_PULSE_SYSTEM_PROMPT}

SESSION CONTEXT:
${sessionContext}

Review the classroom session transcript. Provide a balanced, objective assessment of the expert execution and student behavior:
1. Extract overall_expert_summary (top 1-2 right, top 1-2 wrong, single top action item for the expert).
2. Extract overall_student_summary (top right, top wrong, top action item for students).
3. Extract session_flow (chronological key milestones, max 8 distinct chapters).
4. Extract the 6 expert metrics, 3 student metrics, and key analogies.
5. Extract student_questions: ALL genuine functional questions and conceptual doubts asked by students during the session (skip administrative logistics or repeat requests). Include student question text, timestamp, concept, and resolution_status (Resolved | Partially Resolved | Unresolved).
Ensure you strictly populate empty strings ("") for fields where no significant highlights or flaws are found.`;

  const finalResult = await callStage<any>({
    model: LIMITS.stage1Model || 'gemini-2.5-flash',
    stageName: 'oogway_pulse_single_call',
    system: systemPrompt,
    user: `TRANSCRIPT:\n${slicedTranscript}`,
    responseSchema: pulseResponseSchema,
    initialBudget: 8000,
    maxBudget: 16384,
    timeoutMs: 40_000 // 40 seconds hard timeout to guarantee we return fast
  })

  console.log(`[Pulse] Single-call review complete. Saving to DB...`)
  await prisma.analysisSession.update({
    where: { id: sessionId },
    data: {
      tier1Result: finalResult as any,
      v3Status: 'COMPLETE', // Mark as complete so dashboard and UI show it validated
      pipeline_stage: 'WAITING_FOR_DEEP_ANALYSIS',
      updatedAt: new Date()
    }
  })
}
export { handleTier1Review as default }
