"use client"

import { useState, useEffect } from "react"
import { Activity, AlertCircle, RefreshCw, Clock } from "lucide-react"

interface PipelineStatus {
  by_stage: Array<{ pipeline_stage: string; count: number; oldest_waiting: string }>
  stuck_sessions: Array<{ id: string; pipeline_stage: string; next_action_at: string; stage_attempts: any }>
  hourly_throughput: Array<{ hour: string; completed: number }>
  failed_total: number
  completed_today: number
  alert: string | null
}

export function PipelineMonitor() {
  const [data, setData] = useState<PipelineStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [retryingId, setRetryingId] = useState<string | null>(null)

  const fetchStatus = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/pipeline/status")
      const json = await res.json()
      setData(json)
    } catch (err) {
      console.error("Failed to fetch pipeline status", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 30000) // refresh every 30s
    return () => clearInterval(interval)
  }, [])

  const handleRetry = async (sessionId: string) => {
    setRetryingId(sessionId)
    try {
      const res = await fetch("/api/admin/pipeline/retry", {
        method: "POST",
        body: JSON.stringify({ sessionId })
      })
      if (res.ok) {
        fetchStatus()
      }
    } catch (err) {
      console.error("Retry failed", err)
    } finally {
      setRetryingId(null)
    }
  }

  if (!data && loading) return <div className="animate-pulse glass-card h-64 flex items-center justify-center">Loading monitor...</div>

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {data?.alert && (
        <div className="bg-brand-danger/10 border border-brand-danger/20 p-4 rounded-2xl flex items-center gap-3 animate-pulse">
          <AlertCircle className="w-5 h-5 text-brand-danger" />
          <p className="text-xs font-bold text-brand-danger uppercase tracking-widest">{data.alert}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stage Breakdown */}
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-orange" />
              <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Live Pipeline Stages</p>
            </div>
            <button onClick={fetchStatus} disabled={loading} className="p-1 hover:bg-white/5 rounded transition-colors">
              <RefreshCw className={`w-3 h-3 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="divide-y divide-white/5">
            {data?.by_stage.map(s => (
              <div key={s.pipeline_stage} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white uppercase">{s.pipeline_stage.replace(/_/g, ' ')}</p>
                  <p className="text-[9px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" /> 
                    Oldest: {new Date(s.oldest_waiting).toLocaleTimeString()}
                  </p>
                </div>
                <span className="text-xl font-bold text-brand-orange">{s.count}</span>
              </div>
            ))}
            {data?.by_stage.length === 0 && (
              <p className="px-6 py-8 text-xs text-slate-500 text-center italic">Pipeline is idle</p>
            )}
          </div>
        </div>

        {/* Stuck / Failed Actions */}
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Critical Focus (Stuck/Failed)</p>
          </div>
          <div className="divide-y divide-white/5 max-h-[300px] overflow-y-auto">
            {data?.stuck_sessions.map(s => (
              <div key={s.id} className="px-6 py-4 flex items-center justify-between group">
                <div className="max-w-[150px]">
                  <p className="text-[10px] font-bold text-white truncate">{s.id}</p>
                  <p className="text-[9px] text-brand-danger uppercase">Stuck in {s.pipeline_stage}</p>
                </div>
                <button 
                  onClick={() => handleRetry(s.id)}
                  disabled={retryingId === s.id}
                  className="px-3 py-1.5 rounded-lg bg-brand-orange/10 border border-brand-orange/20 text-[9px] font-black text-brand-orange uppercase tracking-widest hover:bg-brand-orange/20 transition-all"
                >
                  {retryingId === s.id ? "Re-queuing..." : "Force Retry"}
                </button>
              </div>
            ))}
            {data?.stuck_sessions.length === 0 && (
              <div className="px-6 py-12 flex flex-col items-center justify-center text-center opacity-50">
                <Activity className="w-8 h-8 text-brand-success mb-2" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No stuck sessions</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Throughput Summary */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">24h Throughput (By Hour)</p>
          <div className="flex items-center gap-4">
             <div className="text-right">
                <p className="text-[9px] font-bold text-slate-500 uppercase">Completed Today</p>
                <p className="text-lg font-bold text-brand-success">{data?.completed_today}</p>
             </div>
             <div className="text-right">
                <p className="text-[9px] font-bold text-slate-500 uppercase">Failed Total</p>
                <p className="text-lg font-bold text-brand-danger">{data?.failed_total}</p>
             </div>
          </div>
        </div>
        <div className="h-20 flex items-end gap-1 px-2">
          {data?.hourly_throughput.map(t => (
            <div 
              key={t.hour} 
              className="flex-1 bg-brand-orange/20 rounded-t-sm relative group"
              style={{ height: `${Math.min(100, (t.completed / 10) * 100)}%` }}
            >
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 border border-white/10 px-2 py-1 rounded text-[9px] text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                {new Date(t.hour).getHours()}:00 — {t.completed} done
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
