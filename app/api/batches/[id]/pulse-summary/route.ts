export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

type Params = { params: Promise<{ id: string }> };

const STUDENT_SCORE_ORDER: Record<string, number> = {
  'High': 0, 'Medium': 1, 'Low': 2,
  'Applicative': 0, 'Clarifying': 1, 'Silent': 2,
  'None': 0, 'Isolated': 1, 'Repeated': 2, 'Widespread': 3,
};

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;

  const sessions = await prisma.analysisSession.findMany({
    where: {
      batchId: id,
      deletedAt: null,
      tier: 'TIER1',
      NOT: { tier1Result: { equals: Prisma.JsonNull } },
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      tier1Result: true,
      expert: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  if (sessions.length === 0) {
    return NextResponse.json({ sessions: 0, summary: null });
  }

  // Aggregate student metrics across all sessions for this batch
  const studentMetricMap: Record<string, { scores: string[]; flagCount: number }> = {};
  const confusionTopics: { chapter: string; session: string; score: string }[] = [];

  // Engagement trend over last 10 sessions (chronological)
  const chronoSessions = [...sessions].reverse().slice(-10);
  const engagementTrend = chronoSessions.map(s => {
    const result = s.tier1Result as any;
    const eng = result?.student_insights?.find((i: any) => i.metric === 'Engagement Level');
    return { session: s.name, score: eng?.score ?? 'N/A', date: s.createdAt };
  });

  for (const session of sessions) {
    const result = session.tier1Result as any;

    for (const insight of (result?.student_insights ?? [])) {
      if (!insight.metric || !insight.score) continue;
      if (!studentMetricMap[insight.metric]) {
        studentMetricMap[insight.metric] = { scores: [], flagCount: 0 };
      }
      studentMetricMap[insight.metric].scores.push(insight.score);
      const order = STUDENT_SCORE_ORDER[insight.score] ?? 0;
      if (order >= 2) studentMetricMap[insight.metric].flagCount++;
    }

    // Extract confusion topics from session_flow
    const confusion = (result?.student_insights ?? []).find((i: any) => i.metric === 'Confusion Signals');
    if (confusion && confusion.score !== 'None') {
      confusionTopics.push({
        chapter: (result?.session_flow ?? []).map((f: any) => f.chapter).join(', ').slice(0, 80),
        session: session.name,
        score: confusion.score,
      });
    }
  }

  // Compute metric health
  const metricHealth = Object.entries(studentMetricMap).map(([metric, data]) => {
    const total = data.scores.length;
    const scoreCounts: Record<string, number> = {};
    for (const s of data.scores) scoreCounts[s] = (scoreCounts[s] ?? 0) + 1;
    const mostCommon = Object.entries(scoreCounts).sort((a, b) => b[1] - a[1])[0];
    return {
      metric,
      totalSessions: total,
      flagCount: data.flagCount,
      flagRate: Math.round((data.flagCount / total) * 100),
      mostCommonScore: mostCommon?.[0] ?? 'N/A',
      scoreCounts,
    };
  });

  // Overall health score (0-100, higher = healthier batch)
  const avgFlagRate = metricHealth.reduce((sum, m) => sum + m.flagRate, 0) / (metricHealth.length || 1);
  const healthScore = Math.round(100 - avgFlagRate);

  return NextResponse.json({
    sessions: sessions.length,
    healthScore,
    metricHealth,
    engagementTrend,
    confusionTopics: confusionTopics.slice(0, 10),
  });
}
