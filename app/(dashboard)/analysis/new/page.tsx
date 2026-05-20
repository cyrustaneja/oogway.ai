"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Upload, ChevronDown, ArrowLeft, Loader2, CheckCircle, BookOpen, X } from "lucide-react";

interface Expert { id: string; name: string; email: string }
interface SessionNote { 
  id: string; 
  name: string; 
  moduleId: string;
  deletedAt: string | null;
  module: { 
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
  const [batchId, setBatchId]       = useState("");
  const [sessionSearch, setSessionSearch] = useState("");
  const [noteId, setNoteId]         = useState("");
  const [potentialMatches, setPotentialMatches] = useState<SessionNote[]>([]);
  
  // Transcript inputs
  const [transcriptMode, setTranscriptMode] = useState<"file" | "paste">("paste");
  const [file, setFile]             = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
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

  // When session search changes, find matches
  useEffect(() => {
    if (!sessionSearch.trim() && noteId && !isFocused) {
      setPotentialMatches([]);
      return;
    }

    // Filter sessions to strictly exclude those without modules or with deleted modules
    const validSessions = allSessions.filter(s => s.module && !s.deletedAt);
    
    const matches = validSessions.filter(s => {
      if (!sessionSearch.trim()) return true; // Show all if no search
      return s.name.toLowerCase().includes(sessionSearch.toLowerCase()) ||
             s.module.name.toLowerCase().includes(sessionSearch.toLowerCase()) ||
             s.module.course.name.toLowerCase().includes(sessionSearch.toLowerCase());
    });
    
    // Sort matches: sessions in the selected batch's course come first
    const selectedBatch = batches.find(b => b.id === batchId);
    const sortedMatches = [...matches].sort((a, b) => {
      const aInCourse = selectedBatch?.courseId === a.module.courseId ? 1 : 0;
      const bInCourse = selectedBatch?.courseId === b.module.courseId ? 1 : 0;
      return bInCourse - aInCourse;
    });

    setPotentialMatches(sortedMatches);

    // If exactly one match, auto-select it
    if (sortedMatches.length === 1 && sessionSearch.toLowerCase() === sortedMatches[0].name.toLowerCase()) {
      setNoteId(sortedMatches[0].id);
    } else if (sortedMatches.length === 0) {
      setNoteId("");
    }
  }, [sessionSearch, batchId, allSessions, batches, noteId, isFocused]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!expertId) {
      setError("Expert selection is required.");
      return;
    }

    if (transcriptMode === "file" && !file) {
      setError("Please upload a .vtt transcript file.");
      return;
    }
    if (transcriptMode === "paste" && !pastedText.trim()) {
      setError("Please paste the transcript content.");
      return;
    }

    setLoading(true);
    try {
      // 1. Resolve transcript text (paste OR file read inline — no separate upload endpoint).
      let transcriptText = "";
      if (transcriptMode === "paste") {
        transcriptText = pastedText;
      } else if (transcriptMode === "file" && file) {
        setUploading(true);
        transcriptText = await file.text();
        setUploading(false);
      }

      if (!transcriptText.trim()) {
        throw new Error("Transcript content is empty.");
      }

      // 2. Create session — cron tick will auto-claim it because
      //    pipeline_stage defaults to 'UPLOADED' and next_action_at defaults to NOW().
      const createRes = await fetch("/api/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expertId,
          batchId: batchId || undefined,
          sessionNoteId: noteId || undefined,
          transcriptRaw: transcriptText,
        }),
      });

      if (!createRes.ok) {
        const err = await createRes.json();
        throw new Error(err.error || "Failed to create session.");
      }
      const created = await createRes.json();

      setSessionId(created.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  if (sessionId) {
    return (
      <div className="max-w-xl mx-auto mt-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-brand-success/10 border border-brand-success/20 flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8 text-brand-success" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--foreground)]" style={{ fontFamily: "var(--font-outfit)" }}>
          Pipeline Started
        </h2>
        <p className="text-[var(--muted)] text-sm leading-relaxed">
          The analysis pipeline is running in the background. Results will appear on the session page as each stage completes.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => router.push(`/sessions/${sessionId}`)}
            className="btn-primary px-6 py-2.5 text-sm font-bold tracking-widest uppercase"
          >
            View Session
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-6 py-2.5 rounded-lg border border-[var(--inner-border)] bg-[var(--inner-bg)] text-sm font-bold tracking-widest text-[var(--foreground)] opacity-80 hover:opacity-100 hover:border-[var(--muted)] transition-all uppercase"
          >
            Dashboard
          </button>
        </div>
      </div>
    );
  }

  const selectedMatch = potentialMatches.find(m => m.id === noteId);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)]" style={{ fontFamily: "var(--font-outfit)" }}>New Session Audit</h1>
          <p className="text-xs text-[var(--muted)] mt-0.5">Start AI analysis by providing the session transcript</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-brand-danger/10 border border-brand-danger/20 rounded-lg text-brand-danger text-sm text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-card p-8 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {/* Expert */}
          <div>
            <label className="block text-[11px] font-bold text-[var(--muted)] tracking-widest uppercase mb-2">Expert *</label>
            <div className="relative">
              <select
                value={expertId}
                onChange={(e) => setExpertId(e.target.value)}
                className="w-full appearance-none bg-[var(--inner-bg)] border border-[var(--inner-border)] rounded-lg py-3 px-4 text-[var(--foreground)] text-sm focus:outline-none focus:border-brand-orange/50 transition-colors"
                required
              >
                <option value="">Select expert...</option>
                {experts.map((ex) => (
                  <option key={ex.id} value={ex.id}>{ex.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>

          {/* Batch */}
          <div>
            <label className="block text-[11px] font-bold text-[var(--muted)] tracking-widest uppercase mb-2">Batch / Cohort</label>
            <div className="relative">
              <select
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                className="w-full appearance-none bg-[var(--inner-bg)] border border-[var(--inner-border)] rounded-lg py-3 px-4 text-[var(--foreground)] text-sm focus:outline-none focus:border-brand-orange/50 transition-colors"
              >
                <option value="">Select batch...</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} {b.course ? `(${b.course.name})` : ""}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Searchable Session Note */}
        <div className="space-y-4">
          <label className="block text-[11px] font-bold text-[var(--muted)] tracking-widest uppercase mb-2">
            Curriculum Mapping <span className="text-[var(--muted)] opacity-75 normal-case font-normal ml-1">(Search session name)</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={sessionSearch}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)} // Delay to allow click detection
              onChange={(e) => {
                setSessionSearch(e.target.value);
                setNoteId("");
              }}
              placeholder="e.g. Introduction to Programmatic"
              className="w-full bg-[var(--inner-bg)] border border-[var(--inner-border)] rounded-lg py-3 px-4 text-[var(--foreground)] text-sm focus:outline-none focus:border-brand-orange/50 transition-colors"
            />
            <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)] pointer-events-none transition-transform duration-300 ${isFocused ? 'rotate-180 text-brand-orange' : ''}`} />
            
            {/* Dropdown / Search Results */}
            {(isFocused && !noteId && potentialMatches.length > 0) && (
              <div className="absolute z-50 w-full mt-1 bg-[var(--card-bg)] backdrop-blur-xl border border-[var(--inner-border)] rounded-xl shadow-2xl max-h-64 overflow-y-auto overflow-x-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                {(!sessionSearch.trim()) && (
                  <div className="px-4 py-2 border-b border-[var(--inner-border)] bg-[var(--inner-bg)]">
                    <p className="text-[9px] font-bold text-[var(--muted)] uppercase tracking-widest">Select From Curriculum</p>
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
                    className="w-full text-left px-4 py-2 text-xs text-[var(--foreground)] opacity-80 hover:bg-brand-orange/10 hover:opacity-100 transition-colors border-b border-[var(--inner-border)] last:border-0"
                  >
                    <div className="font-bold uppercase tracking-wider">{m.name}</div>
                    <div className="text-[10px] text-[var(--muted)] italic mt-0.5">
                      {m.module.course.name} → {m.module.name}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedMatch && !isFocused && (
            <div className="px-4 py-2 border-l-2 border-brand-orange bg-brand-orange/5">
              <p className="text-[10px] text-brand-orange font-bold uppercase tracking-widest leading-none">Mapped to:</p>
              <p className="text-[10px] text-[var(--muted)] font-medium uppercase truncate mt-1">
                {selectedMatch.module.course.name} <span className="opacity-50 px-1">/</span> {selectedMatch.module.name}
              </p>
            </div>
          )}
        </div>

        {/* Transcript Input */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-[11px] font-bold text-[var(--muted)] tracking-widest uppercase">Transcript Data *</label>
            <div className="flex bg-[var(--inner-bg)] p-1 rounded-lg border border-[var(--inner-border)]">
              <button 
                type="button"
                onClick={() => setTranscriptMode("file")}
                className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${transcriptMode === "file" ? "bg-brand-orange text-white" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}
              >
                VTT File
              </button>
              <button 
                type="button"
                onClick={() => setTranscriptMode("paste")}
                className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${transcriptMode === "paste" ? "bg-brand-orange text-white" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}
              >
                Copy-Paste
              </button>
            </div>
          </div>

          {transcriptMode === "file" ? (
            <label className="flex flex-col items-center justify-center gap-3 w-full h-40 border-2 border-dashed border-[var(--inner-border)] rounded-xl cursor-pointer hover:border-brand-orange/40 transition-colors bg-[var(--inner-bg)]">
              <Upload className="w-8 h-8 text-[var(--muted)]" />
              {file ? (
                <span className="text-sm font-bold text-brand-success">{file.name}</span>
              ) : (
                <span className="text-sm text-[var(--muted)]">Upload .vtt file</span>
              )}
              <input
                type="file"
                accept=".vtt,.txt"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
          ) : (
            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="00:00:00.000 --> 00:00:05.000\nHello everyone, welcome to the session..."
              className="w-full h-40 bg-[var(--inner-bg)] border border-[var(--inner-border)] rounded-xl py-3 px-4 text-[var(--foreground)] text-sm focus:outline-none focus:border-brand-orange/50 transition-colors resize-none font-mono"
            />
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full btn-primary py-4 text-sm font-bold tracking-widest uppercase flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {uploading ? "Uploading transcript..." : "Initializing..."}
            </>
          ) : (
            "Start Oogway Analysis"
          )}
        </button>
      </form>
    </div>
  );
}

