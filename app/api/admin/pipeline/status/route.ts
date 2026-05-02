/**
 * GET /api/admin/pipeline/status
 *
 * Returns pipeline health metrics:
 *  - by_stage: count grouped by pipeline_stage
 *  - stuck_sessions: sessions where updatedAt > 15 mins ago and not terminal
 *  - completed_today: count completed in last 24h
 *  - hourly_throughput: last 24 hourly buckets
 *  - oldest_unprocessed_session_age_mins
 *  - sessions_in_progress_count
 *  - average_session_completion_minutes_last_24h
 */

import { NextResponse } from 'next/server'
import { getAuthToken } from '@/lib/auth-token'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // by_stage
    const byStageRaw: Array<{ pipeline_stage: string; _count: { _all: number } }> =
      await prisma.analysisSession.groupBy({
        by: ['pipeline_stage'],
        where: { deletedAt: null },
        _count: { _all: true },
      }) as any

    const by_stage = byStageRaw.map((r: any) => ({
      pipeline_stage: r.pipeline_stage,
      count: r._count._all ?? r._count,
    }))

    // stuck_sessions (updatedAt > 15 mins ago, not terminal)
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000)
    const stuck_sessions = await prisma.analysisSession.findMany({
      where: {
        deletedAt: null,
        pipeline_stage: { notIn: ['COMPLETE', 'FAILED'] },
        updatedAt: { lt: fifteenMinsAgo },
      },
      select: {
        id: true,
        pipeline_stage: true,
        next_action_at: true,
        stage_attempts: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'asc' },
      take: 20,
    })

    // completed_today
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const completed_today = await prisma.analysisSession.count({
      where: {
        deletedAt: null,
        pipeline_stage: 'COMPLETE',
        updatedAt: { gte: twentyFourHoursAgo },
      },
    })

    // hourly_throughput (last 24h) — raw SQL for hourly bucketing
    const hourly_throughput: Array<{ hour: string; completed: number }> =
      await prisma.$queryRawUnsafe(`
        SELECT
          date_trunc('hour', "updatedAt") AS hour,
          COUNT(*)::int AS completed
        FROM "AnalysisSession"
        WHERE
          pipeline_stage = 'COMPLETE'
          AND "updatedAt" >= NOW() - INTERVAL '24 hours'
          AND "deletedAt" IS NULL
        GROUP BY 1
        ORDER BY 1
      `)

    // oldest_unprocessed_session_age_mins
    const oldestUnprocessed = await prisma.analysisSession.findFirst({
      where: {
        deletedAt: null,
        pipeline_stage: { notIn: ['COMPLETE', 'FAILED'] },
      },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    })
    const oldest_unprocessed_session_age_mins = oldestUnprocessed
      ? Math.round((Date.now() - oldestUnprocessed.createdAt.getTime()) / 60_000)
      : null

    // sessions_in_progress_count
    const sessions_in_progress_count = await prisma.analysisSession.count({
      where: {
        deletedAt: null,
        pipeline_stage: { notIn: ['COMPLETE', 'FAILED', 'UPLOADED'] },
      },
    })

    // average_session_completion_minutes_last_24h
    const avgResult: Array<{ avg_mins: number | null }> = await prisma.$queryRawUnsafe(`
      SELECT
        AVG(EXTRACT(EPOCH FROM ("updatedAt" - "createdAt")) / 60)::float AS avg_mins
      FROM "AnalysisSession"
      WHERE
        pipeline_stage = 'COMPLETE'
        AND "updatedAt" >= NOW() - INTERVAL '24 hours'
        AND "deletedAt" IS NULL
    `)
    const average_session_completion_minutes_last_24h =
      avgResult[0]?.avg_mins ? Math.round(avgResult[0].avg_mins * 10) / 10 : null

    // failed_total
    const failed_total = await prisma.analysisSession.count({
      where: { deletedAt: null, pipeline_stage: 'FAILED' },
    })

    // alert
    const alert =
      stuck_sessions.length > 5
        ? `${stuck_sessions.length} sessions stuck for >15 minutes`
        : failed_total > 10
        ? `${failed_total} total failed sessions`
        : null

    return NextResponse.json({
      by_stage,
      stuck_sessions,
      completed_today,
      hourly_throughput,
      failed_total,
      alert,
      oldest_unprocessed_session_age_mins,
      sessions_in_progress_count,
      average_session_completion_minutes_last_24h,
    })
  } catch (err: any) {
    console.error('[pipeline/status] Error:', err)
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 })
  }
}
