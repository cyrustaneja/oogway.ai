"use client";

import { useState, useEffect } from "react";
import { Plus, X, Loader2, Tag, Mail, User } from "lucide-react";

interface Expert {
  id: string; name: string; email: string; tags: string[]; bio: string | null;
  sessions: { id: string }[];
  createdAt: string;
}

export default function ExpertsPage() {
  const [experts, setExperts]     = useState<Expert[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");
  const [flash, setFlash]         = useState("");

  const [name, setName]     = useState("");
  const [email, setEmail]   = useState("");
  const [bio, setBio]       = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags]     = useState<string[]>([]);

  const load = () =>
    fetch("/api/experts").then((r) => r.json()).then(setExperts).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  };

  const resetForm = () => { setName(""); setEmail(""); setBio(""); setTags([]); setTagInput(""); setError(""); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) { setError("Name and email are required."); return; }
    setSaving(true); setError("");
    const res = await fetch("/api/experts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, tags, bio }),
    });
    if (res.ok) {
      setFlash(`Expert created. Default password: expertpassword123`);
      resetForm(); setShowForm(false); load();
      setTimeout(() => setFlash(""), 8000);
    } else {
      const err = await res.json();
      setError(err.error || "Failed to create expert.");
    }
    setSaving(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-outfit)" }}>Expert Roster</h1>
          <p className="text-xs text-slate-500 mt-0.5">{experts.length} experts registered</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setError(""); }}
          className="btn-primary flex items-center gap-2 text-xs font-bold tracking-widest uppercase py-2.5 px-5"
        >
          <Plus className="w-4 h-4" /> Add Expert
        </button>
      </div>

      {/* Flash */}
      {flash && (
        <div className="p-4 bg-brand-success/10 border border-brand-success/20 rounded-xl text-brand-success text-sm font-medium">
          {flash}
        </div>
      )}

      {/* Add Expert Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md p-8 relative">
            <button onClick={() => { setShowForm(false); resetForm(); }} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-white mb-6" style={{ fontFamily: "var(--font-outfit)" }}>Add New Expert</h2>

            {error && <div className="mb-4 p-3 bg-brand-danger/10 border border-brand-danger/20 rounded-lg text-brand-danger text-sm">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 tracking-widest uppercase mb-2">Full Name *</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Priya Sharma"
                  className="w-full bg-slate-900/50 border border-white/10 rounded-lg py-3 px-4 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-brand-orange/50 transition-colors" required />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 tracking-widest uppercase mb-2">Email *</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="priya@kraftshala.com"
                  className="w-full bg-slate-900/50 border border-white/10 rounded-lg py-3 px-4 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-brand-orange/50 transition-colors" required />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 tracking-widest uppercase mb-2">Bio</label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} rows={2} placeholder="Short bio about this expert..."
                  className="w-full bg-slate-900/50 border border-white/10 rounded-lg py-3 px-4 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-brand-orange/50 transition-colors resize-none" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 tracking-widest uppercase mb-2">Expertise Tags</label>
                <div className="flex gap-2">
                  <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())}
                    placeholder="SEO, Paid Ads, Analytics..."
                    className="flex-1 bg-slate-900/50 border border-white/10 rounded-lg py-2.5 px-4 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-brand-orange/50 transition-colors" />
                  <button type="button" onClick={addTag} className="px-4 py-2.5 rounded-lg bg-slate-800 text-white text-xs font-bold border border-white/10 hover:border-brand-orange/40 transition-colors">Add</button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map(t => (
                      <span key={t} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-orange/10 border border-brand-orange/20 text-brand-orange text-[10px] font-bold">
                        {t} <button type="button" onClick={() => setTags(tags.filter(x => x !== t))}><X className="w-2.5 h-2.5" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <button type="submit" disabled={saving}
                className="w-full btn-primary py-3 text-sm font-bold tracking-widest uppercase flex items-center justify-center gap-2 disabled:opacity-50">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : "Create Expert"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Expert Grid */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-brand-orange animate-spin" /></div>
      ) : experts.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <User className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <p className="text-slate-500 text-sm">No experts yet. Add one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {experts.map(ex => (
            <div key={ex.id} className="glass-card p-6 space-y-4 hover:border-brand-orange/20 transition-colors border border-white/5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center text-lg font-bold text-white shrink-0">
                  {ex.name[0]}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white truncate uppercase">{ex.name}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Mail className="w-3 h-3 text-slate-600" />
                    <span className="text-[10px] text-slate-500 truncate">{ex.email}</span>
                  </div>
                </div>
              </div>

              {ex.bio && <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{ex.bio}</p>}

              {ex.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {ex.tags.map(t => (
                    <span key={t} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 border border-white/10 text-[10px] font-bold text-slate-300">
                      <Tag className="w-2.5 h-2.5" />{t}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <span className="text-[10px] text-slate-500">
                  <span className="text-white font-bold">{ex.sessions.length}</span> sessions analysed
                </span>
                <span className="text-[10px] text-slate-600">
                  Since {new Date(ex.createdAt).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
