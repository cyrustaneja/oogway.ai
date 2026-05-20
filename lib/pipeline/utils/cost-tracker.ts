import { prisma } from '@/lib/prisma'

// Pricing for Gemini 1.5 Flash (as of mid-2024, per 1M tokens)
const PRICING = {
  'gemini-1.5-flash': {
    input: 0.075, // per 1M tokens
    output: 0.30, // per 1M tokens
  },
  'gemini-2.5-flash': {
    input: 0.075,
    output: 0.30,
  },
  'gemini-1.5-pro': {
    input: 3.50,
    output: 10.50,
  }
}

export async function trackCost(
  sessionId: string,
  model: string,
  usage: { promptTokens: number; completionTokens: number }
) {
  try {
    const rates = PRICING[model as keyof typeof PRICING] || PRICING['gemini-1.5-flash']
    
    const inputCost = (usage.promptTokens / 1_000_000) * rates.input
    const outputCost = (usage.completionTokens / 1_000_000) * rates.output
    const totalCost = inputCost + outputCost

    console.log(`[CostTracker] ${sessionId.slice(0, 8)}: $${totalCost.toFixed(6)} (${usage.promptTokens} in, ${usage.completionTokens} out) via ${model}`)

    // Upsert AnalysisV2 to ensure we can track cost even before Stage 3 creates the full record
    await prisma.analysisV2.upsert({
      where: { sessionId },
      update: { costEstimate: { increment: totalCost } },
      create: { sessionId, costEstimate: totalCost, status: 'processing' }
    })
  } catch (err) {
    console.error(`[CostTracker] Failed to track cost for ${sessionId}:`, err)
  }
}
