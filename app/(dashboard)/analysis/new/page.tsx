"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Upload, ChevronDown, ArrowLeft, Loader2, CheckCircle, BookOpen, X, Search } from "lucide-react";

interface Expert { id: string; name: string; email: string }
interface SessionNote { 
  id: string; 
  sessionId?: string | null;
  name: string; 
  moduleId: string;
  deletedAt: string | null;
  module: { 
    id?: string;
    sheetModuleId?: string | null;
    name: string; 
    courseId: string;
    course: { name: string }
  }
}
interface Batch { 
  id: string; 
  name: string; 
  courseId: string | null;
  course?: { name: string }
}

export default function NewAnalysisPage() {
  const router = useRouter();
  const [experts, setExperts]       = useState<Expert[]>([]);
  const [batches, setBatches]       = useState<Batch[]>([]);
  const [allSessions, setAllSessions] = useState<SessionNote[]>([]);
  
  const [loading, setLoading]       = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [sessionId, setSessionId]   = useState<string | null>(null);
  const [error, setError]           = useState("");

  const [expertId, setExpertId]     = useState("");
  const [expertSearch, setExpertSearch] = useState("");
  const [showExpertPicker, setShowExpertPicker] = useState(false);

  const [batchId, setBatchId]       = useState("");
  const [batchSearch, setBatchSearch] = useState("");
  const [showBatchPicker, setShowBatchPicker] = useState(false);

  const [sessionDate, setSessionDate] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [sessionSearch, setSessionSearch] = useState("");
  const [noteId, setNoteId]         = useState("");
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [potentialMatches, setPotentialMatches] = useState<SessionNote[]>([]);
  
  // Asset links
  const [videoUrl, setVideoUrl] = useState("");
  const [transcriptMode, setTranscriptMode] = useState<'url' | 'manual'>('url');
  const [transcriptUrl, setTranscriptUrl] = useState("");
  const [transcriptText, setTranscriptText] = useState("");
  const [isFocused, setIsFocused]   = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/experts").then((r) => r.json()),
      fetch("/api/batches").then((r) => r.json()),
      fetch("/api/session-notes").then((r) => r.json()),
    ]).then(([e, b, s]) => {
      setExperts(Array.isArray(e) ? e : []);
      setBatches(Array.isArray(b) ? b : []);
      setAllSessions(Array.isArray(s) ? s : []);
    });
  }, []);

  const uniqueModules = Array.from(
    new Map(
      allSessions
        .filter(s => s.module && !s.deletedAt)
        .map(s => [s.moduleId, { id: s.moduleId, name: s.module.name, courseName: s.module.course.name }])
    ).values()
  ).sort((a, b) => a.courseName.localeCompare(b.courseName) || a.name.localeCompare(b.name));

  useEffect(() => {
    if (!sessionSearch.trim() && noteId && !isFocused && !selectedModuleId) {
      setPotentialMatches([]);
      return;
    }

    const validSessions = allSessions.filter(s => s.module && !s.deletedAt);
    
    const matches = validSessions.filter(s => {
      if (selectedModuleId && s.moduleId !== selectedModuleId) return false;
      if (!sessionSearch.trim()) return true; 
      const q = sessionSearch.toLowerCase();
      return s.name.toLowerCase().includes(q) ||
             (s.sessionId && s.sessionId.toLowerCase().includes(q)) ||
             s.id.toLowerCase().includes(q) ||
             s.module.name.toLowerCase().includes(q) ||
             (s.module.sheetModuleId && s.module.sheetModuleId.toLowerCase().includes(q)) ||
             (s.module.id && s.module.id.toLowerCase().includes(q)) ||
             s.module.course.name.toLowerCase().includes(q);
    });
    
    const selectedBatch = batches.find(b => b.id === batchId);
    const sortedMatches = [...matches].sort((a, b) => {
      const aInCourse = selectedBatch?.courseId === a.module.courseId ? 1 : 0;
      const bInCourse = selectedBatch?.courseId === b.module.courseId ? 1 : 0;
      return bInCourse - aInCourse;
    });

    setPotentialMatches(sortedMatches);

    if (sortedMatches.length === 1 && sessionSearch.toLowerCase() === sortedMatches[0].name.toLowerCase()) {
      setNoteId(sortedMatches[0].id);
      setSelectedModuleId(sortedMatches[0].moduleId);
    } else if (sortedMatches.length === 0) {
      setNoteId("");
    }
  }, [sessionSearch, batchId, allSessions, batches, noteId, isFocused, selectedModuleId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!expertId) { setError("Expert selection is required."); return; }
    if (!videoUrl.trim()) { setError("Video link is required."); return; }
    if (transcriptMode === 'url' && !transcriptUrl.trim()) { setError("Please provide a Transcript URL."); return; }
    if (transcriptMode === 'manual' && !transcriptText.trim()) { setError("Please paste the manual transcript text."); return; }

    setLoading(true);
    try {
      const createRes = await fetch("/api/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expertId,
          batchId: batchId || undefined,
          sessionNoteId: noteId || undefined,
          sessionDate: sessionDate || undefined,
          videoUrl: videoUrl.trim(),
          transcriptUrl: transcriptMode === 'url' ? transcriptUrl.trim() : undefined,
          transcriptText: transcriptMode === 'manual' ? transcriptText.trim() : undefined,
        }),
      });

      if (!createRes.ok) {
        const err = await createRes.json();
        throw new Error(err.error || "Failed to create session.");
      }
      const created = await createRes.json();

      setSessionId(created.id);
      router.push(`/sessions/${created.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  if (sessionId) {
    return (
      <div className="w-full max-w-xl mx-auto mt-20 text-center space-y-6 px-4">
        <div className="w-16 h-16 rounded-2xl bg-[var(--chip-green-bg)] border border-[var(--chip-green-border)] flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle className="w-8 h-8 text-[var(--chip-green-text)]" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">
          Pipeline Started
        </h2>
        <p className="text-[var(--muted)] text-sm leading-relaxed">
          The analysis pipeline is running in the background. Results will appear on the session page as each stage completes.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            onClick={() => router.push(`/sessions/${sessionId}`)}
            className="btn-primary w-full sm:w-auto px-6 py-3 text-sm font-bold tracking-widest uppercase shadow-sm"
          >
            View Session
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full sm:w-auto px-6 py-3 rounded-full border border-[var(--border)] bg-white text-sm font-bold tracking-widest text-[var(--foreground)] hover:bg-[var(--layer-2)] transition-all uppercase shadow-sm"
          >
            Dashboard
          </button>
        </div>
      </div>
    );
  }

  const selectedMatch = potentialMatches.find(m => m.id === noteId);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 px-4 sm:px-6 md:px-0 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--layer-2)] transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">New Session Audit</h1>
            <p className="text-sm text-[var(--muted)] mt-1 font-medium">Start AI analysis by providing the session transcript and conducted date</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-[var(--layer-2)] p-1 rounded-xl border border-[var(--border)] shrink-0">
          <button className="px-3 py-1.5 rounded-lg text-xs font-extrabold bg-white text-[var(--foreground)] shadow-xs border border-[var(--border)]">
            Single Audit
          </button>
          <button
            onClick={() => router.push("/analysis/bulk")}
            className="px-3 py-1.5 rounded-lg text-xs font-extrabold text-[var(--muted)] hover:text-[var(--foreground)] transition-all"
          >
            Bulk Import
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-[var(--chip-red-bg)] border border-[var(--chip-red-border)] rounded-2xl text-[var(--chip-red-text)] text-sm text-center shadow-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-card p-6 sm:p-8 space-y-6 sm:space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {/* SEARCHABLE EXPERT PICKER */}
          <div className="relative">
            <label className="block text-[11px] font-bold text-[var(--muted-foreground)] tracking-widest uppercase mb-2">Expert *</label>
            
            {/* Display Input Button */}
            <div
              onClick={() => { setShowExpertPicker(!showExpertPicker); setShowBatchPicker(false); }}
              className="w-full liquid-input flex items-center justify-between cursor-pointer select-none"
            >
              <span className={expertId ? "text-[var(--foreground)] font-bold" : "text-slate-400 font-medium"}>
                {experts.find((ex) => ex.id === expertId)?.name || "Select expert..."}
              </span>
              <div className="flex items-center gap-1">
                {expertId && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setExpertId(""); }}
                    className="p-1 hover:bg-slate-200 rounded-md text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <ChevronDown className={`w-4 h-4 text-[var(--muted)] transition-transform ${showExpertPicker ? 'rotate-180' : ''}`} />
              </div>
            </div>

            {/* Dropdown Menu */}
            {showExpertPicker && (
              <div className="absolute z-50 left-0 right-0 mt-1 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 space-y-2 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={expertSearch}
                    onChange={(e) => setExpertSearch(e.target.value)}
                    placeholder="Search expert name or email..."
                    className="w-full text-xs font-medium pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E8A020]"
                    autoFocus
                  />
                </div>

                <div className="max-h-52 overflow-y-auto space-y-1">
                  {experts
                    .filter((ex) =>
                      !expertSearch ||
                      ex.name.toLowerCase().includes(expertSearch.toLowerCase()) ||
                      ex.email?.toLowerCase().includes(expertSearch.toLowerCase())
                    )
                    .map((ex) => (
                      <div
                        key={ex.id}
                        onClick={() => {
                          setExpertId(ex.id);
                          setShowExpertPicker(false);
                          setExpertSearch("");
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center justify-between ${
                          ex.id === expertId ? "bg-amber-50 text-[#E8A020]" : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <div>
                          <div className="font-extrabold">{ex.name}</div>
                          {ex.email && <div className="text-[10px] text-slate-400 font-medium">{ex.email}</div>}
                        </div>
                        {ex.id === expertId && <CheckCircle className="w-4 h-4 text-[#E8A020]" />}
                      </div>
                    ))}
                  {experts.filter((ex) =>
                    !expertSearch ||
                    ex.name.toLowerCase().includes(expertSearch.toLowerCase()) ||
                    ex.email?.toLowerCase().includes(expertSearch.toLowerCase())
                  ).length === 0 && (
                    <div className="p-3 text-center text-xs text-slate-400 font-medium">No matching experts found</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* SEARCHABLE BATCH PICKER */}
          <div className="relative">
            <label className="block text-[11px] font-bold text-[var(--muted-foreground)] tracking-widest uppercase mb-2">Batch / Cohort</label>
            
            {/* Display Input Button */}
            <div
              onClick={() => { setShowBatchPicker(!showBatchPicker); setShowExpertPicker(false); }}
              className="w-full liquid-input flex items-center justify-between cursor-pointer select-none"
            >
              <span className={batchId ? "text-[var(--foreground)] font-bold" : "text-slate-400 font-medium"}>
                {batches.find((b) => b.id === batchId)?.name
                  ? `${batches.find((b) => b.id === batchId)?.name} ${batches.find((b) => b.id === batchId)?.course ? `(${batches.find((b) => b.id === batchId)?.course?.name})` : ""}`
                  : "Select batch..."}
              </span>
              <div className="flex items-center gap-1">
                {batchId && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setBatchId(""); }}
                    className="p-1 hover:bg-slate-200 rounded-md text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <ChevronDown className={`w-4 h-4 text-[var(--muted)] transition-transform ${showBatchPicker ? 'rotate-180' : ''}`} />
              </div>
            </div>

            {/* Dropdown Menu */}
            {showBatchPicker && (
              <div className="absolute z-50 left-0 right-0 mt-1 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 space-y-2 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={batchSearch}
                    onChange={(e) => setBatchSearch(e.target.value)}
                    placeholder="Search batch or course..."
                    className="w-full text-xs font-medium pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E8A020]"
                    autoFocus
                  />
                </div>

                <div className="max-h-52 overflow-y-auto space-y-1">
                  <div
                    onClick={() => {
                      setBatchId("");
                      setShowBatchPicker(false);
                      setBatchSearch("");
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                      !batchId ? "bg-amber-50 text-[#E8A020]" : "text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    None / Unassigned
                  </div>
                  {batches
                    .filter((b) =>
                      !batchSearch ||
                      b.name.toLowerCase().includes(batchSearch.toLowerCase()) ||
                      b.course?.name.toLowerCase().includes(batchSearch.toLowerCase())
                    )
                    .map((b) => (
                      <div
                        key={b.id}
                        onClick={() => {
                          setBatchId(b.id);
                          setShowBatchPicker(false);
                          setBatchSearch("");
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center justify-between ${
                          b.id === batchId ? "bg-amber-50 text-[#E8A020]" : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <div>
                          <div className="font-extrabold">{b.name}</div>
                          {b.course && <div className="text-[10px] text-slate-400 font-medium">{b.course.name}</div>}
                        </div>
                        {b.id === batchId && <CheckCircle className="w-4 h-4 text-[#E8A020]" />}
                      </div>
                    ))}
                  {batches.filter((b) =>
                    !batchSearch ||
                    b.name.toLowerCase().includes(batchSearch.toLowerCase()) ||
                    b.course?.name.toLowerCase().includes(batchSearch.toLowerCase())
                  ).length === 0 && (
                    <div className="p-3 text-center text-xs text-slate-400 font-medium">No matching batches found</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Session Conducted Date & Time */}
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-[var(--muted-foreground)] tracking-widest uppercase mb-2">
              Session Conducted Date &amp; Time *
            </label>
            <input
              type="datetime-local"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="w-full liquid-input font-medium text-sm"
              required
            />
          </div>
        </div>

        {/* Module Selection */}
        <div>
          <label className="block text-[11px] font-bold text-[var(--muted-foreground)] tracking-widest uppercase mb-2">Module (Optional)</label>
          <div className="relative">
            <select
              value={selectedModuleId}
              onChange={(e) => {
                setSelectedModuleId(e.target.value);
                setNoteId("");
                setSessionSearch("");
              }}
              className="w-full appearance-none liquid-input pr-10"
            >
              <option value="">All Modules...</option>
              {uniqueModules.map((m) => (
                <option key={m.id} value={m.id}>{m.courseName} — {m.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)] pointer-events-none" />
          </div>
        </div>

        {/* Searchable Session Note */}
        <div className="space-y-3">
          <label className="block text-[11px] font-bold text-[var(--muted-foreground)] tracking-widest uppercase mb-1">
            Curriculum Mapping <span className="text-brand-orange normal-case font-bold ml-1">(Search by ID or Name)</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={sessionSearch}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              onChange={(e) => {
                setSessionSearch(e.target.value);
                setNoteId("");
              }}
              placeholder="Search by Session ID (e.g. S101), Module ID (e.g. MM109), or Name..."
              className="w-full liquid-input pr-10"
            />
            <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)] pointer-events-none transition-transform duration-300 ${isFocused ? 'rotate-180 text-[var(--foreground)]' : ''}`} />
            
            <p className="text-[11px] text-[var(--muted)] font-medium mt-1">
              💡 You can search using Session ID, Module ID, or Name.
            </p>

            {/* Dropdown / Search Results */}
            {(isFocused && !noteId && potentialMatches.length > 0) && (
              <div className="absolute z-50 w-full mt-2 bg-white backdrop-blur-xl border border-[var(--border)] rounded-2xl shadow-xl max-h-64 overflow-y-auto overflow-x-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                {(!sessionSearch.trim()) && (
                  <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--layer-2)] sticky top-0 flex items-center justify-between">
                    <p className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">Select From Curriculum</p>
                    <span className="text-[10px] text-brand-orange font-bold">Search with ID or Name</span>
                  </div>
                )}
                {potentialMatches.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setNoteId(m.id);
                      setSessionSearch(m.name);
                      setIsFocused(false);
                    }}
                    className="w-full text-left px-5 py-3 text-sm text-[var(--foreground)] hover:bg-[var(--layer-2)] transition-colors border-b border-[var(--border)] last:border-0"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold tracking-tight">{m.name}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        {m.sessionId && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-mono font-bold">
                            {m.sessionId}
                          </span>
                        )}
                        {m.module?.sheetModuleId && (
                          <span className="px-1.5 py-0.5 rounded bg-blue-100 border border-blue-300 text-blue-900 text-[10px] font-mono font-bold">
                            {m.module.sheetModuleId}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-[11px] text-[var(--muted)] font-medium mt-1">
                      {m.module.course.name} <span className="mx-1 text-[var(--border)]">/</span> {m.module.name}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedMatch && !isFocused && (
            <div className="px-4 py-3 border border-[var(--border)] bg-[var(--layer-2)] rounded-xl flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <span className="text-[10px] text-[var(--foreground)] font-bold uppercase tracking-widest px-2.5 py-1 bg-white rounded-md border border-[var(--border)] shrink-0">Mapped to</span>
              <p className="text-[12px] text-[var(--muted)] font-medium truncate">
                <span className="text-[var(--foreground)]">{selectedMatch.module.course.name}</span> 
                <span className="mx-1.5 opacity-50">/</span> 
                {selectedMatch.module.name}
              </p>
            </div>
          )}
        </div>

        <div className="w-full h-px bg-[var(--border)] my-6" />

        {/* Asset Inputs */}
        <div className="space-y-6">
          <div>
            <label className="block text-[11px] font-bold text-[var(--muted-foreground)] tracking-widest uppercase mb-2">Video Link *</label>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://..."
              className="w-full liquid-input"
              required
            />
          </div>

          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <label className="block text-[11px] font-bold text-[var(--muted-foreground)] tracking-widest uppercase">Transcript *</label>
              <div className="flex bg-[var(--layer-2)] rounded-lg p-1 border border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setTranscriptMode('url')}
                  className={`flex-1 sm:flex-none px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all ${transcriptMode === 'url' ? 'bg-white text-[var(--foreground)] shadow-sm' : 'text-[var(--muted)] hover:text-[var(--foreground)]'}`}
                >
                  Link
                </button>
                <button
                  type="button"
                  onClick={() => setTranscriptMode('manual')}
                  className={`flex-1 sm:flex-none px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all ${transcriptMode === 'manual' ? 'bg-white text-[var(--foreground)] shadow-sm' : 'text-[var(--muted)] hover:text-[var(--foreground)]'}`}
                >
                  Manual Text
                </button>
              </div>
            </div>

            {transcriptMode === 'url' ? (
              <input
                type="url"
                value={transcriptUrl}
                onChange={(e) => setTranscriptUrl(e.target.value)}
                placeholder="https://... (VTT link)"
                className="w-full liquid-input"
                required={transcriptMode === 'url'}
              />
            ) : (
              <textarea
                value={transcriptText}
                onChange={(e) => setTranscriptText(e.target.value)}
                placeholder="Paste the raw transcript text here..."
                rows={6}
                className="w-full liquid-input resize-y"
                required={transcriptMode === 'manual'}
              />
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full btn-primary py-4 text-sm font-bold tracking-widest uppercase flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-sm"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {uploading ? "Uploading transcript..." : "Initializing..."}
            </>
          ) : (
            "Start Analysis"
          )}
        </button>
      </form>
    </div>
  );
}
