"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Loader2, LayoutGrid, Layers, Calendar, Search, ChevronRight, Trash2 } from "lucide-react";

interface Batch {
  id: string;
  name: string;
  description: string | null;
  course?: { id: string; name: string };
  _count: { sessions: number };
  createdAt: string;
}

interface Course {
  id: string;
  name: string;
}

export default function BatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [courseId, setCourseId] = useState("");

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/batches").then(r => r.json()),
      fetch("/api/courses").then(r => r.json())
    ]).then(([b, c]) => {
      setBatches(Array.isArray(b) ? b : []);
      setCourses(Array.isArray(c) ? c : []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, courseId }),
      });

      if (res.ok) {
        setName("");
        setDescription("");
        setCourseId("");
        setShowForm(false);
        load();
      } else {
        const d = await res.json();
        setError(d.error || "Failed to create batch");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this batch?")) return;
    try {
      const res = await fetch(`/api/batches/${id}`, { method: "DELETE" });
      if (res.ok) load();
    } catch (err) {
      console.error("Failed to delete batch", err);
    }
  };


  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex items-end justify-between px-2">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)] tracking-tight">Batch Registry</h1>
          <p className="text-sm text-[var(--muted)] mt-1 font-medium">Manage and organize sessions by learning cohorts</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create Batch
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-card w-full max-w-md p-8 relative shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-orange to-transparent opacity-50" />
              
              <button 
                onClick={() => setShowForm(false)} 
                className="absolute top-4 right-4 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-bold text-[var(--foreground)] mb-6">New Batch Definition</h2>

              {error && <div className="mb-6 p-4 bg-brand-danger/10 border border-brand-danger/20 rounded-xl text-brand-danger text-sm font-medium">{error}</div>}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-[11px] font-bold text-[var(--muted-foreground)] tracking-widest mb-2">Batch Name *</label>
                  <input 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="e.g. DM L2 - Jan 2024"
                    className="liquid-input shadow-inner" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[var(--muted-foreground)] tracking-widest mb-2">Enrolled Course</label>
                  <div className="relative">
                    <select 
                      value={courseId} 
                      onChange={e => setCourseId(e.target.value)}
                      className="liquid-input shadow-inner appearance-none"
                    >
                      <option value="">Select course...</option>
                      {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)] pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[var(--muted-foreground)] tracking-widest mb-2">Description</label>
                  <textarea 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    placeholder="Optional notes about this cohort..."
                    rows={3}
                    className="liquid-input shadow-inner resize-none" 
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="w-full btn-primary py-4 mt-2 shadow-xl shadow-brand-orange/10"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Initialize Batch"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-brand-orange animate-spin" /></div>
      ) : batches.length === 0 ? (
        <div className="glass-card py-20 text-center border-dashed border-[var(--card-border)] bg-transparent">
          <LayoutGrid className="w-12 h-12 text-[var(--muted-foreground)] opacity-20 mx-auto mb-4" />
          <p className="text-[var(--muted)] font-medium">No batches defined yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {batches.map(b => (
            <div key={b.id} className="glass-card p-6 space-y-5 flex flex-col hover:scale-[1.02] active:scale-95 transition-all shadow-xl group">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl bg-[var(--inner-bg)] border border-[var(--inner-border)] flex items-center justify-center text-brand-orange shadow-lg">
                  <Layers className="w-6 h-6" />
                </div>
                <div className="flex gap-2">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-[var(--muted)] tracking-widest">Sessions</p>
                    <p className="text-2xl font-bold text-[var(--foreground)] tracking-tight">{b._count.sessions}</p>
                  </div>
                  <button 
                    onClick={() => handleDelete(b.id)}
                    className="p-2 rounded-xl text-[var(--muted)] hover:text-brand-danger hover:bg-brand-danger/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 space-y-6">
                <div>
                  <h3 className="text-base font-bold text-[var(--foreground)] tracking-tight group-hover:text-brand-orange transition-colors">{b.name}</h3>
                  {b.course && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-brand-orange/90 tracking-wide bg-brand-orange/10 px-3 py-1 rounded-full border border-brand-orange/10 italic">
                        {b.course.name}
                      </span>
                    </div>
                  )}
                  {b.description && <p className="text-xs text-[var(--muted)] mt-4 line-clamp-2 leading-relaxed font-medium italic">"{b.description}"</p>}
                </div>

                {/* Session Drill-down */}
                {(b as any).sessions?.length > 0 && (
                  <div className="bg-[var(--inner-bg)] rounded-2xl border border-[var(--inner-border)] p-4 space-y-3 relative z-10">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[9px] font-bold text-[var(--muted)] tracking-widest uppercase">Analysis Logs</p>
                      <Link 
                        href={`/batches/${b.id}`} 
                        className="text-[9px] font-bold text-brand-orange hover:underline flex items-center gap-1"
                      >
                        View Folder <ChevronRight className="w-2.5 h-2.5" />
                      </Link>
                    </div>
                    <div className="space-y-2">
                      {(b as any).sessions.slice(0, 3).map((s: any) => (
                        <Link
                          key={s.id}
                          href={`/sessions/${s.id}`}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-white/40 dark:bg-white/5 border border-transparent hover:border-brand-orange/30 hover:bg-white/60 transition-all pointer-events-auto group/item"
                        >
                          <span className="text-[10px] font-bold text-[var(--foreground)] truncate max-w-[140px] group-hover/item:text-brand-orange">{s.name}</span>
                          <span className={cn(
                            "text-[8px] font-extrabold px-2 py-0.5 rounded-full",
                            s.v3Status === 'COMPLETE' ? "bg-brand-success/10 text-brand-success" : "bg-brand-warning/10 text-brand-warning"
                          )}>
                            {s.v3Status === 'COMPLETE' ? 'VALIDATED' : 'SYNCING'}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-[var(--card-border)] flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] text-[var(--muted)] font-bold tracking-widest">
                  <Calendar className="w-3.5 h-3.5 opacity-60" />
                  {new Date(b.createdAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
                <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-[var(--inner-bg)] text-[var(--muted)] tracking-widest border border-[var(--inner-border)]">Active</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
