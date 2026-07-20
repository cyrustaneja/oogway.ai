"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Loader2, Tag, Mail, User, Edit2, Trash2, AlertCircle, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Expert {
  id: string; name: string; email: string; tags: string[]; bio: string | null;
  sessions: { id: string }[];
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string; bg: string }> = {
  PENDING:       { label: "Queued",       color: "text-[var(--muted)]",       dot: "bg-slate-500",                  bg: "bg-slate-500/10" },
  PREPROCESSING: { label: "Processing",   color: "text-brand-warning",        dot: "bg-brand-warning animate-pulse",bg: "bg-brand-warning/10" },
  EXTRACTING:    { label: "Scanning",     color: "text-brand-info",           dot: "bg-brand-info animate-pulse",   bg: "bg-brand-info/10" },
  AGGREGATING:   { label: "Structuring",  color: "text-purple-400",           dot: "bg-purple-400 animate-pulse",   bg: "bg-purple-400/10" },
  SYNTHESISING:  { label: "Synthesising", color: "text-brand-warning",        dot: "bg-brand-warning animate-pulse",bg: "bg-brand-warning/10" },
  COMPLETE:      { label: "Validated",    color: "text-brand-success",        dot: "bg-brand-success",              bg: "bg-brand-success/10" },
  FAILED:        { label: "Error",        color: "text-brand-danger",         dot: "bg-brand-danger",               bg: "bg-brand-danger/10" },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as any }
  }
};

export default function ExpertsPage() {
  const [experts, setExperts]     = useState<Expert[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");
  const [flash, setFlash]         = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName]     = useState("");
  const [email, setEmail]   = useState("");
  const [bio, setBio]       = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags]     = useState<string[]>([]);

  const load = () =>
    fetch("/api/experts")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setExperts(data);
        } else {
          setExperts([]);
          setError(data.error || "Failed to load experts.");
        }
      })
      .catch((err) => {
        setExperts([]);
      })
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  };

  const resetForm = () => { 
    setName(""); setEmail(""); setBio(""); setTags([]); 
    setTagInput(""); setError(""); setEditingId(null); 
  };

  const startEdit = (ex: Expert) => {
    setName(ex.name);
    setEmail(ex.email);
    setBio(ex.bio || "");
    setTags(ex.tags || []);
    setEditingId(ex.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Move ${name} to the Recycle Bin? (Access will be archived for 7 days before permanent removal)`)) return;
    
    try {
      const res = await fetch(`/api/experts/${id}`, { method: "DELETE" });
      if (res.ok) {
        setFlash(`${name} moved to Recycle Bin.`);
        load();
        setTimeout(() => setFlash(""), 5000);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete expert.");
      }
    } catch (err) {
      alert("An error occurred while deleting.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) { setError("Name and email are required."); return; }
    setSaving(true); setError("");

    const url = editingId ? `/api/experts/${editingId}` : "/api/experts";
    const method = editingId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, tags, bio }),
    });

    if (res.ok) {
      setFlash(editingId ? "Profile updated successfully." : `Expert registered. Default password: expertpassword123`);
      resetForm(); setShowForm(false); load();
      setTimeout(() => setFlash(""), 8000);
    } else {
      const err = await res.json();
      setError(err.error || `Failed to ${editingId ? 'update' : 'create'} expert.`);
    }
    setSaving(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="flex items-end justify-between px-2"
      >
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)] tracking-tight">Expert Roster</h1>
          <p className="text-sm text-[var(--muted)] mt-1 font-medium">{experts.length} registered intelligence partners</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setError(""); setEditingId(null); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Partner
        </button>
      </motion.div>

      {/* Flash */}
      <AnimatePresence>
        {flash && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 bg-brand-success/10 border border-brand-success/20 rounded-2xl text-brand-success text-sm font-bold text-center"
          >
            {flash}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form Modal */}
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
                onClick={() => { setShowForm(false); resetForm(); }} 
                className="absolute top-4 right-4 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-bold text-[var(--foreground)] mb-6">
                {editingId ? 'Edit Expert Profile' : 'Register New Expert'}
              </h2>

              {error && (
                <div className="mb-6 p-4 bg-brand-danger/10 border border-brand-danger/20 rounded-xl text-brand-danger text-sm flex gap-3 animate-in fade-in zoom-in-95">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span className="font-medium">{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-[11px] font-bold text-[var(--muted-foreground)] tracking-widest mb-2">Display Name</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Priya Sharma"
                    className="liquid-input shadow-inner" required />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[var(--muted-foreground)] tracking-widest mb-2">Primary Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="priya@kraftshala.com"
                    className="liquid-input shadow-inner" required />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[var(--muted-foreground)] tracking-widest mb-2">Partner Bio</label>
                  <textarea value={bio} onChange={e => setBio(e.target.value)} rows={2} placeholder="Brief expertise highlights..."
                    className="liquid-input shadow-inner resize-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[var(--muted-foreground)] tracking-widest mb-2">Core Competencies</label>
                  <div className="flex gap-2">
                    <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())}
                      placeholder="SEO, Strategy..."
                      className="liquid-input shadow-inner" />
                    <button type="button" onClick={addTag} className="btn-secondary px-4 py-3">Add</button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {tags.map(t => (
                        <span key={t} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-orange/10 border border-brand-orange/20 text-brand-orange text-[10px] font-bold tracking-wide">
                          {t} <button type="button" onClick={() => setTags(tags.filter(x => x !== t))} className="hover:text-brand-orange/60 transition-colors"><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button type="submit" disabled={saving}
                  className="w-full btn-primary py-4 mt-4 shadow-xl shadow-brand-orange/10">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> syncing...</> : editingId ? "Save Changes" : "Register Partner"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Expert Grid */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-brand-orange animate-spin" /></div>
      ) : experts.length === 0 ? (
        <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="glass-card p-20 text-center border-dashed border-[var(--card-border)] bg-transparent">
          <User className="w-12 h-12 text-[var(--muted-foreground)] opacity-20 mx-auto mb-4" />
          <p className="text-[var(--muted)] font-medium">No expert partners registered yet.</p>
        </motion.div>
      ) : (
        <motion.div 
          initial="hidden" 
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.1 } }
          }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {experts.map(ex => (
            <motion.div 
              key={ex.id} 
              variants={fadeInUp}
              className="glass-card p-6 flex flex-col hover:scale-[1.02] active:scale-95 transition-all relative group shadow-2xl"
            >
              {/* Context Actions */}
              <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                <button 
                  onClick={() => startEdit(ex)}
                  className="p-2.5 rounded-xl bg-white/10 border border-white/10 text-[var(--muted)] hover:text-brand-orange hover:bg-white transition-all shadow-lg"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => handleDelete(ex.id, ex.name)}
                  className="p-2.5 rounded-xl bg-brand-danger/10 border border-brand-danger/20 text-brand-danger hover:bg-brand-danger/20 transition-all shadow-lg"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-start gap-4 mb-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border border-[var(--card-border)] flex items-center justify-center text-xl font-bold text-[var(--foreground)] shrink-0 shadow-lg">
                  {ex.name[0]}
                </div>
                <div className="min-w-0 pr-12 pt-1">
                  <h3 className="text-sm font-extrabold text-[var(--foreground)] truncate tracking-tight">{ex.name}</h3>
                  <div className="flex items-center gap-1.5 mt-1 opacity-60">
                    <Mail className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                    <span className="text-[11px] font-medium text-[var(--muted)] truncate">{ex.email}</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-6">
                {ex.bio && <p className="text-xs text-[var(--muted)] leading-relaxed line-clamp-2 font-medium italic">"{ex.bio}"</p>}

                {ex.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {ex.tags.map(t => (
                      <span key={t} className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-black/5 dark:bg-white/5 border border-[var(--card-border)] text-[10px] font-bold text-[var(--muted)] tracking-wider">
                        <Tag className="w-2.5 h-2.5 opacity-50" />{t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Session Drill-down */}
                {ex.sessions?.length > 0 && (
                  <div className="bg-[var(--inner-bg)] rounded-2xl border border-[var(--inner-border)] p-4 space-y-3 relative z-10">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[9px] font-bold text-[var(--muted)] tracking-widest uppercase">Intelligence Logs</p>
                      <Link 
                        href={`/experts/${ex.id}`} 
                        className="text-[9px] font-bold text-brand-orange hover:underline flex items-center gap-1"
                      >
                        View Folder <ChevronRight className="w-2.5 h-2.5" />
                      </Link>
                    </div>
                    <div className="space-y-2">
                      {ex.sessions.slice(0, 3).map((s: any) => {
                        const cfg = STATUS_CONFIG[s.v3Status] ?? STATUS_CONFIG.PENDING;
                        let displayLabel = cfg.label;
                        if (s.tier === 'TIER1') {
                          if (s.v3Status === 'FAILED') displayLabel = 'Pulse Error';
                          else if (s.v3Status === 'COMPLETE') displayLabel = 'Pulse Completed';
                          else displayLabel = `Pulse: ${cfg.label}`;
                        } else if (s.tier === 'TIER2') {
                          if (s.v3Status === 'FAILED') displayLabel = 'Analysis Error';
                          else if (s.v3Status === 'COMPLETE') displayLabel = 'Analysis Completed';
                          else displayLabel = `Analysis: ${cfg.label}`;
                        }
                        
                        return (
                        <Link
                          key={s.id}
                          href={`/sessions/${s.id}`}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-white/40 dark:bg-white/5 border border-transparent hover:border-brand-orange/30 hover:bg-white/60 transition-all group/item"
                        >
                          <span className="text-[10px] font-bold text-[var(--foreground)] truncate max-w-[150px] group-hover/item:text-brand-orange">{s.name}</span>
                          <span className={cn(
                            "text-[8px] font-extrabold px-2 py-0.5 rounded-full uppercase whitespace-nowrap ml-2",
                            cfg.color, cfg.bg
                          )}>
                            {displayLabel}
                          </span>
                        </Link>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-5 border-t border-[var(--card-border)]">
                <div className="flex flex-col">
                  <span className="text-[var(--foreground)] font-bold text-lg tracking-tight leading-none">{ex.sessions.length}</span>
                  <span className="text-[9px] text-[var(--muted)] font-bold tracking-widest mt-1 opacity-70">Intelligence Loads</span>
                </div>
                <div className="text-right">
                  <span className="text-[var(--foreground)] text-xs font-bold leading-none block mb-1">
                    {new Date(ex.createdAt).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                  </span>
                  <span className="text-[9px] text-[var(--muted)] font-bold tracking-widest opacity-70">Enrolled</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
