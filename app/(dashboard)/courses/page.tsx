"use client";

import { useState, useEffect } from "react";
import { Plus, ChevronRight, Loader2, BookOpen, Layers, FileText, X } from "lucide-react";

interface SessionNote { id: string; name: string; content: string | null; phase: string | null; keyTopics: string[] }
interface Module { id: string; name: string; order: number; sessions: SessionNote[] }
interface Course { id: string; name: string; description: string | null; modules: Module[] }

const Inp = ({ label, value, onChange, placeholder, required }: any) => (
  <div>
    <label className="block text-[11px] font-bold text-slate-400 tracking-widest uppercase mb-1.5">{label}{required && " *"}</label>
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full bg-slate-900/50 border border-white/10 rounded-lg py-2.5 px-4 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-brand-orange/50 transition-colors" required={required} />
  </div>
);

export default function CoursesPage() {
  const [courses, setCourses]         = useState<Course[]>([]);
  const [loading, setLoading]         = useState(true);
  const [expandedCourse, setExpanded] = useState<string | null>(null);
  const [expandedModule, setExpandedMod] = useState<string | null>(null);

  // Forms
  const [showCourseForm, setShowCourseForm]   = useState(false);
  const [showModForm, setShowModForm]         = useState<string | null>(null); // courseId
  const [showNoteForm, setShowNoteForm]       = useState<string | null>(null); // moduleId
  const [saving, setSaving]                   = useState(false);
  const [error, setError]                     = useState("");

  // Course form
  const [cName, setCName] = useState("");
  const [cDesc, setCDesc] = useState("");

  // Module form
  const [mName, setMName] = useState("");

  // Session note form
  const [snName, setSnName]         = useState("");
  const [snContent, setSnContent]   = useState("");


  const load = () =>
    fetch("/api/courses").then(r => r.json()).then(setCourses).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const createCourse = async (e: React.FormEvent) => {
    e.preventDefault(); if (!cName) return;
    setSaving(true);
    const res = await fetch("/api/courses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: cName, description: cDesc }) });
    if (res.ok) { setCName(""); setCDesc(""); setShowCourseForm(false); load(); }
    else { const d = await res.json(); setError(d.error || "Failed"); }
    setSaving(false);
  };

  const createModule = async (e: React.FormEvent, courseId: string) => {
    e.preventDefault(); if (!mName) return;
    setSaving(true);
    const res = await fetch(`/api/courses/${courseId}/modules`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: mName }) });
    if (res.ok) { setMName(""); setShowModForm(null); load(); }
    else { const d = await res.json(); setError(d.error || "Failed"); }
    setSaving(false);
  };

  const createNote = async (e: React.FormEvent, moduleId: string) => {
    e.preventDefault(); if (!snName) return;
    setSaving(true);
    const res = await fetch(`/api/modules/${moduleId}/sessions`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: snName, content: snContent })
    });
    if (res.ok) { setSnName(""); setSnContent(""); setShowNoteForm(null); load(); }
    else { 
      const d = await res.json(); 
      setError(d.error || "Failed to save session note"); 
    }
    setSaving(false);
  };


  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-outfit)" }}>Courses & Sessions</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage curriculum structure and session notes</p>
        </div>
        <button onClick={() => setShowCourseForm(true)} className="btn-primary flex items-center gap-2 text-xs font-bold tracking-widest uppercase py-2.5 px-5">
          <Plus className="w-4 h-4" /> Add Course
        </button>
      </div>

      {error && <div className="p-3 bg-brand-danger/10 border border-brand-danger/20 rounded-lg text-brand-danger text-sm">{error}</div>}

      {/* Add Course Modal */}
      {showCourseForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-sm p-8 relative">
            <button onClick={() => setShowCourseForm(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
            <h2 className="text-base font-bold text-white mb-5" style={{ fontFamily: "var(--font-outfit)" }}>New Course</h2>
            <form onSubmit={createCourse} className="space-y-4">
              <Inp label="Course Name" value={cName} onChange={setCName} placeholder="e.g. Digital Marketing" required />
              <Inp label="Description" value={cDesc} onChange={setCDesc} placeholder="Optional description..." />
              <button type="submit" disabled={saving} className="w-full btn-primary py-2.5 text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Create Course"}
              </button>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-brand-orange animate-spin" /></div>
      ) : courses.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <BookOpen className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <p className="text-slate-500 text-sm">No courses yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {courses.map(course => (
            <div key={course.id} className="glass-card overflow-hidden">
              {/* Course Header */}
              <button
                onClick={() => setExpanded(expandedCourse === course.id ? null : course.id)}
                className="w-full flex items-center justify-between px-6 py-5 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-brand-orange" />
                  <div className="text-left">
                    <p className="text-sm font-bold text-white uppercase">{course.name}</p>
                    {course.description && <p className="text-xs text-slate-500 mt-0.5">{course.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-bold text-slate-600">{course.modules.length} modules</span>
                  <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform ${expandedCourse === course.id ? "rotate-90" : ""}`} />
                </div>
              </button>

              {/* Modules */}
              {expandedCourse === course.id && (
                <div className="border-t border-white/5">
                  {course.modules.map(mod => (
                    <div key={mod.id} className="border-b border-white/5 last:border-0">
                      <button
                        onClick={() => setExpandedMod(expandedModule === mod.id ? null : mod.id)}
                        className="w-full flex items-center justify-between px-8 py-4 hover:bg-white/[0.01] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Layers className="w-4 h-4 text-slate-500" />
                          <span className="text-sm font-bold text-slate-300 uppercase">{mod.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-[10px] font-bold text-slate-600">{mod.sessions.length} sessions</span>
                          <ChevronRight className={`w-3.5 h-3.5 text-slate-600 transition-transform ${expandedModule === mod.id ? "rotate-90" : ""}`} />
                        </div>
                      </button>

                      {/* Session Notes */}
                      {expandedModule === mod.id && (
                        <div className="bg-slate-900/30 px-10 py-4 space-y-3">
                          {mod.sessions.map(sn => (
                            <div key={sn.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/40 border border-white/5">
                              <FileText className="w-4 h-4 text-slate-600 mt-0.5 shrink-0" />
                              <div>
                                <p className="text-xs font-bold text-white">{sn.name}</p>
                                {sn.content && <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{sn.content}</p>}
                                {sn.phase && <p className="text-[9px] text-slate-500 mt-1 uppercase tracking-wider font-bold">{sn.phase}</p>}
                                {sn.keyTopics.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mt-2">
                                    {sn.keyTopics.map(t => (
                                      <span key={t} className="text-[8px] px-2 py-0.5 rounded-md bg-slate-700/50 text-slate-400 border border-white/5 uppercase tracking-tighter">{t}</span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}

                          {/* Add Session Note inline form */}
                          {showNoteForm === mod.id ? (
                            <form onSubmit={e => createNote(e, mod.id)} className="p-4 rounded-xl border border-brand-orange/20 bg-brand-orange/5 space-y-3">
                              <Inp label="Session Name" value={snName} onChange={setSnName} placeholder="e.g. Introduction to Programmatic Ads" required />
                              <div>
                                <label className="block text-[11px] font-bold text-slate-400 tracking-widest uppercase mb-1.5">Session Notes / Instructions</label>
                                <textarea 
                                  value={snContent} 
                                  onChange={e => setSnContent(e.target.value)} 
                                  placeholder="What should be covered? Any explicit checks?"
                                  rows={4}
                                  className="w-full bg-slate-900/50 border border-white/10 rounded-lg py-2.5 px-4 text-white text-sm placeholder-slate-700 focus:outline-none focus:border-brand-orange/50 transition-colors resize-none" 
                                />
                              </div>
                              <div className="flex gap-2">
                                <button type="submit" disabled={saving} className="btn-primary px-4 py-2 text-[11px] font-bold tracking-widest uppercase flex items-center gap-2 disabled:opacity-50">
                                  {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
                                </button>
                                <button type="button" onClick={() => setShowNoteForm(null)} className="px-4 py-2 rounded-lg border border-white/10 text-[11px] font-bold text-slate-400 hover:text-white transition-colors">Cancel</button>
                              </div>
                            </form>
                          ) : (
                            <button
                              onClick={() => setShowNoteForm(mod.id)}
                              className="flex items-center gap-2 text-[11px] font-bold text-slate-500 hover:text-brand-orange transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" /> Add Session Note
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add Module */}
                  {showModForm === course.id ? (
                    <form onSubmit={e => createModule(e, course.id)} className="px-8 py-4 flex items-center gap-3 bg-brand-orange/5 border-t border-brand-orange/10">
                      <input value={mName} onChange={e => setMName(e.target.value)} placeholder="Module name..."
                        className="flex-1 bg-slate-900/50 border border-white/10 rounded-lg py-2 px-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-brand-orange/50" required />
                      <button type="submit" disabled={saving} className="btn-primary px-4 py-2 text-[11px] font-bold tracking-widest uppercase flex items-center gap-1 disabled:opacity-50">
                        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Add"}
                      </button>
                      <button type="button" onClick={() => setShowModForm(null)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
                    </form>
                  ) : (
                    <button
                      onClick={() => setShowModForm(course.id)}
                      className="flex items-center gap-2 px-8 py-3 w-full text-[11px] font-bold text-slate-500 hover:text-brand-orange transition-colors border-t border-white/5"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Module
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
