"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Upload, ChevronDown, ArrowLeft, Loader2, CheckCircle, BookOpen, X } from "lucide-react";

interface Expert { id: string; name: string; email: string }
interface SessionNote { 
  id: string; 
  name: string; 
  moduleId: string;
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
  const [transcriptMode, setTranscriptMode] = useState<"file" | "paste">("file");
  const [file, setFile]             = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/experts").then((r) => r.json()),
      fetch("/api/batches").then((r) => r.json()),
      fetch("/api/session-notes").then((r) => r.json()),
    ]).then(([e, b, s]) => {
      setExperts(e);
      setBatches(Array.isArray(b) ? b : []);
      setAllSessions(Array.isArray(s) ? s : []);
    });
  }, []);

  // When session search changes, find matches
  useEffect(() => {
    if (!sessionSearch.trim()) {
      setPotentialMatches([]);
      return;
    }

    const selectedBatch = batches.find(b => b.id === batchId);
    let filtered = allSessions;
    
    // If batch has a course, prioritize those sessions
    if (selectedBatch?.courseId) {
      filtered = allSessions.filter(s => s.module.courseId === selectedBatch.courseId);
    }

    const matches = filtered.filter(s => 
      s.name.toLowerCase().includes(sessionSearch.toLowerCase())
    );
    setPotentialMatches(matches);

    // If exactly one match, auto-select it
    if (matches.length === 1 && sessionSearch.toLowerCase() === matches[0].name.toLowerCase()) {
      setNoteId(matches[0].id);
    } else if (matches.length === 0) {
      setNoteId("");
    }
  }, [sessionSearch, batchId, allSessions, batches]);

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
      // 1. Create session record
      const createRes = await fetch("/api/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          expertId, 
          batchId: batchId || undefined,
          sessionNoteId: noteId || undefined,
          transcriptRaw: transcriptMode === "paste" ? pastedText : undefined
        }),
      });

      if (!createRes.ok) {
        const err = await createRes.json();
        throw new Error(err.error || "Failed to create session.");
      }
      const created = await createRes.json();

      // 2. Upload transcript if in file mode
      if (transcriptMode === "file" && file) {
        setUploading(true);
        const fd = new FormData();
        fd.append("transcript", file);
        const uploadRes = await fetch(`/api/analysis/${created.id}/upload`, { method: "POST", body: fd });
        if (!uploadRes.ok) throw new Error("Transcript upload failed.");
      }

      // 3. Start pipeline
      await fetch(`/api/analysis/${created.id}/start`, { method: "POST" });

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
        <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-outfit)" }}>
          Pipeline Started
        </h2>
        <p className="text-slate-400 text-sm leading-relaxed">
          The analysis pipeline is running in the background. Results will appear on the session page as each stage completes.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => router.push(`/analysis/${sessionId}`)}
            className="btn-primary px-6 py-2.5 text-sm font-bold tracking-widest uppercase"
          >
            View Session
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-6 py-2.5 rounded-lg border border-white/10 text-sm font-bold tracking-widest text-slate-300 hover:border-white/30 transition-colors uppercase"
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
        <button onClick={() => router.back()} className="text-slate-500 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white" style={{ fontFamily: "var(--font-outfit)" }}>New Session Audit</h1>
          <p className="text-xs text-slate-500 mt-0.5">Start AI analysis by providing the session transcript</p>
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
            <label className="block text-[11px] font-bold text-slate-400 tracking-widest uppercase mb-2">Expert *</label>
            <div className="relative">
              <select
                value={expertId}
                onChange={(e) => setExpertId(e.target.value)}
                className="w-full appearance-none bg-slate-900/50 border border-white/10 rounded-lg py-3 px-4 text-white text-sm focus:outline-none focus:border-brand-orange/50 transition-colors"
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
            <label className="block text-[11px] font-bold text-slate-400 tracking-widest uppercase mb-2">Batch / Cohort</label>
            <div className="relative">
              <select
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                className="w-full appearance-none bg-slate-900/50 border border-white/10 rounded-lg py-3 px-4 text-white text-sm focus:outline-none focus:border-brand-orange/50 transition-colors"
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
          <label className="block text-[11px] font-bold text-slate-400 tracking-widest uppercase mb-2">
            Curriculum Mapping <span className="text-slate-600 normal-case font-normal ml-1">(Search session name)</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={sessionSearch}
              onChange={(e) => {
                setSessionSearch(e.target.value);
                setNoteId("");
              }}
              placeholder="e.g. Introduction to Programmatic"
              className="w-full bg-slate-900 border border-white/10 rounded-lg py-3 px-4 text-white text-sm focus:outline-none focus:border-brand-orange/50 transition-colors"
            />
            {potentialMatches.length > 0 && !noteId && (
              <div className="absolute z-10 w-full mt-1 bg-slate-900 border border-white/10 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                {potentialMatches.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setNoteId(m.id);
                      setSessionSearch(m.name);
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-brand-orange/10 hover:text-white transition-colors border-b border-white/5 last:border-0"
                  >
                    <div className="font-bold uppercase tracking-wider">{m.name}</div>
                    <div className="text-[10px] text-slate-500 italic mt-0.5">
                      {m.module.course.name} → {m.module.name}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedMatch && (
            <div className="flex items-center gap-3 p-3 bg-brand-orange/5 border border-brand-orange/10 rounded-lg">
              <div className="p-2 rounded-lg bg-brand-orange/10">
                <BookOpen className="w-4 h-4 text-brand-orange" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Enrolled Curriculum</p>
                <p className="text-xs text-brand-orange font-bold uppercase transition-all">
                  {selectedMatch.module.course.name} <span className="text-slate-500 mx-1">/</span> {selectedMatch.module.name}
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => { setNoteId(""); setSessionSearch(""); }}
                className="ml-auto p-1.5 text-slate-600 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Transcript Input */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-[11px] font-bold text-slate-400 tracking-widest uppercase">Transcript Data *</label>
            <div className="flex bg-slate-900/80 p-1 rounded-lg border border-white/5">
              <button 
                type="button"
                onClick={() => setTranscriptMode("file")}
                className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${transcriptMode === "file" ? "bg-brand-orange text-white" : "text-slate-500 hover:text-white"}`}
              >
                VTT File
              </button>
              <button 
                type="button"
                onClick={() => setTranscriptMode("paste")}
                className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${transcriptMode === "paste" ? "bg-brand-orange text-white" : "text-slate-500 hover:text-white"}`}
              >
                Copy-Paste
              </button>
            </div>
          </div>

          {transcriptMode === "file" ? (
            <label className="flex flex-col items-center justify-center gap-3 w-full h-40 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-brand-orange/40 transition-colors bg-slate-900/30">
              <Upload className="w-8 h-8 text-slate-600" />
              {file ? (
                <span className="text-sm font-bold text-brand-success">{file.name}</span>
              ) : (
                <span className="text-sm text-slate-500">Upload .vtt file</span>
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
              className="w-full h-40 bg-slate-900/50 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-brand-orange/50 transition-colors resize-none font-mono"
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

