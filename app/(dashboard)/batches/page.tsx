"use client";

import { useState, useEffect } from "react";
import { Plus, X, Loader2, LayoutGrid, Layers, Calendar, Search } from "lucide-react";

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


  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: "var(--font-outfit)" }}>Batch Records</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage and organize sessions by cohorts/batches</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2 text-xs font-bold tracking-widest uppercase py-2.5 px-5"
        >
          <Plus className="w-4 h-4" /> Create Batch
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-card w-full max-w-md p-8 relative border border-white/10">
            <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-white mb-6" style={{ fontFamily: "var(--font-outfit)" }}>New Batch Definition</h2>

            {error && <div className="mb-4 p-3 bg-brand-danger/10 border border-brand-danger/20 rounded-lg text-brand-danger text-xs">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-2">Batch Name *</label>
                <input 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="e.g. DM L2 - Jan 2024"
                  className="w-full bg-slate-900 border border-white/5 rounded-lg py-3 px-4 text-white text-sm focus:outline-none focus:border-brand-orange/50 transition-colors" 
                  required 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-2">Enrolled Course</label>
                <div className="relative">
                  <select 
                    value={courseId} 
                    onChange={e => setCourseId(e.target.value)}
                    className="w-full appearance-none bg-slate-900 border border-white/5 rounded-lg py-3 px-4 text-white text-sm focus:outline-none focus:border-brand-orange/50 transition-colors"
                  >
                    <option value="">Select course...</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-2">Description</label>
                <textarea 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  placeholder="Optional notes about this cohort..."
                  rows={3}
                  className="w-full bg-slate-900 border border-white/5 rounded-lg py-3 px-4 text-white text-sm focus:outline-none focus:border-brand-orange/50 transition-colors resize-none" 
                />
              </div>
              <button 
                type="submit" 
                disabled={saving}
                className="w-full btn-primary py-3 text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Initialize Batch"}
              </button>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-brand-orange animate-spin" /></div>
      ) : batches.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <LayoutGrid className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <p className="text-slate-500 text-sm">No batches defined yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {batches.map(b => (
            <div key={b.id} className="glass-card p-6 space-y-4 border border-white/5 hover:border-brand-orange/20 transition-all cursor-default group">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center text-brand-orange">
                  <Layers className="w-5 h-5" />
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sessions</p>
                  <p className="text-lg font-bold text-white">{b._count.sessions}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-bold text-white uppercase group-hover:text-brand-orange transition-colors">{b.name}</h3>
                {b.course && (
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="text-[9px] font-bold text-brand-orange/80 uppercase tracking-widest bg-brand-orange/5 px-2 py-0.5 rounded border border-brand-orange/10 italic">
                      {b.course.name}
                    </span>
                  </div>
                )}
                {b.description && <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 leading-relaxed">{b.description}</p>}
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-600 font-medium">
                  <Calendar className="w-3 h-3" />
                  {new Date(b.createdAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 uppercase tracking-wider">Active</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
