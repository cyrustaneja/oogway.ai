export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

type Params = { params: Promise<{ id: string }> };

// Expert score maps — higher index = worse
const EXPERT_SCORE_ORDER: Record<string, number> = {
  // Pacing
  'On-track': 0, 'Dragging': 1, 'Rushed': 2,
  // Context Setup
  'Strong': 0, 'Weak': 1, 'None': 2,
  // Accuracy
  'Accurate': 0, 'Possibly Off': 1, 'Incorrect': 2,
  // Teaching Depth
  'Applied': 0, 'Explanatory': 1, 'Definitional': 2,
  // Checking for Understanding
  'Active Check': 0, 'Passive Check': 1, 'No Check': 2,
};

const STUDENT_SCORE_ORDER: Record<string, number> = {
  // Engagement
  'High': 0, 'Medium': 1, 'Low': 2,
  // Doubts Quality
  'Applicative': 0, 'Clarifying': 1, 'Silent': 2,
  // Confusion Signals
  'None': 0, 'Isolated': 1, 'Repeated': 2, 'Widespread': 3,
};

function isGoodScore(metric: string, score: string): boolean {
  const order = EXPERT_SCORE_ORDER[score] ?? STUDENT_SCORE_ORDER[score] ?? 1;
  return order === 0;
}

function isFlagScore(metric: string, score: string): boolean {
  const order = EXPERT_SCORE_ORDER[score] ?? STUDENT_SCORE_ORDER[score] ?? 1;
  return order >= 2;
}

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;

  const sessions = await prisma.analysisSession.findMany({
    where: {
      expertId: id,
      deletedAt: null,
      tier: 'TIER1',
      NOT: { tier1Result: { equals: Prisma.JsonNull } },
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      tier1Result: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  if (sessions.length === 0) {
    return NextResponse.json({ sessions: 0, summary: null });
  }

  // Aggregate per metric across all sessions
  const metricMap: Record<string, { scores: string[]; flagCount: number; goodCount: number }> = {};

  for (const session of sessions) {
    const result = session.tier1Result as any;
    const allInsights = [...(result?.expert_insights ?? []), ...(result?.student_insights ?? [])];

    for (const insight of allInsights) {
      if (!insight.metric || !insight.score) continue;
      if (!metricMap[insight.metric]) {
        metricMap[insight.metric] = { scores: [], flagCount: 0, goodCount: 0 };
      }
      metricMap[insight.metric].scores.push(insight.score);
      if (isFlagScore(insight.metric, insight.score)) metricMap[insight.metric].flagCount++;
      if (isGoodScore(insight.metric, insight.score)) metricMap[insight.metric].goodCount++;
    }
  }

  // Find most flagged metric (expert's biggest gap)
  const sortedByFlag = Object.entries(metricMap).sort((a, b) => b[1].flagCount - a[1].flagCount);
  const biggestGap = sortedByFlag[0]?.[0] ?? null;
  const biggestGapCount = sortedByFlag[0]?.[1]?.flagCount ?? 0;

  // Most consistent strength
  const sortedByGood = Object.entries(metricMap).sort((a, b) => b[1].goodCount - a[1].goodCount);
  const biggestStrength = sortedByGood[0]?.[0] ?? null;

  // Summarize each metric
  const metricSummaries = Object.entries(metricMap).map(([metric, data]) => {
    const total = data.scores.length;
    const scoreCounts: Record<string, number> = {};
    for (const s of data.scores) scoreCounts[s] = (scoreCounts[s] ?? 0) + 1;
    const mostCommon = Object.entries(scoreCounts).sort((a, b) => b[1] - a[1])[0];
    return {
      metric,
      totalSessions: total,
      flagCount: data.flagCount,
      goodCount: data.goodCount,
      mostCommonScore: mostCommon?.[0] ?? 'N/A',
      scoreCounts,
    };
  });

  return NextResponse.json({
    sessions: sessions.length,
    biggestGap,
    biggestGapCount,
    biggestStrength,
    metricSummaries,
  });
}
