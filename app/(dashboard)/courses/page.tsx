"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  ChevronRight, 
  Loader2, 
  BookOpen, 
  Layers, 
  FileText, 
  X, 
  Edit2, 
  Trash2, 
  Save, 
  MoreHorizontal 
} from "lucide-react";

interface SessionNote { 
  id: string; 
  name: string; 
  content: string | null; 
  phase: string | null; 
  keyTopics: string[];
}

interface Module { 
  id: string; 
  name: string; 
  order: number; 
  sessions: SessionNote[];
}

interface Course { 
  id: string; 
  name: string; 
  description: string | null; 
  modules: Module[];
}

const Inp = ({ label, value, onChange, placeholder, required }: any) => (
  <div>
    <label className="block text-[11px] font-bold text-[var(--muted-foreground)] tracking-widest mb-1.5">{label}{required && " *"}</label>
    <input 
      value={value} 
      onChange={e => onChange(e.target.value)} 
      placeholder={placeholder}
      className="liquid-input shadow-inner" 
      required={required} 
    />
  </div>
);

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCourse, setExpanded] = useState<string | null>(null);
  const [expandedModule, setExpandedMod] = useState<string | null>(null);

  // Modals & States
  const [showCourseForm, setShowCourseForm] = useState<any>(null); // null or { mode: 'add' } or { mode: 'edit', id }
  const [showModForm, setShowModForm] = useState<any>(null); // null or { mode: 'add', courseId } or { mode: 'edit', id }
  const [showNoteForm, setShowNoteForm] = useState<any>(null); // null or { mode: 'add', moduleId } or { mode: 'edit', id }
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Form Fields
  const [fName, setFName] = useState("");
  const [fDesc, setFDesc] = useState("");
  const [fContent, setFContent] = useState("");

  const load = () =>
    fetch("/api/courses").then(r => r.json()).then(setCourses).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  // --- Handlers ---

  const handleCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!fName) return;
    setSaving(true);
    const method = showCourseForm.mode === "add" ? "POST" : "PATCH";
    const url = showCourseForm.mode === "add" ? "/api/courses" : `/api/courses/${showCourseForm.id}`;
    
    const res = await fetch(url, { 
      method, 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify({ name: fName, description: fDesc }) 
    });
    
    if (res.ok) { 
      setShowCourseForm(null); 
      resetForm();
      load(); 
    } else { 
      const d = await res.json(); setError(d.error || "Failed"); 
    }
    setSaving(false);
  };

  const handleModuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!fName) return;
    setSaving(true);
    const method = showModForm.mode === "add" ? "POST" : "PATCH";
    const url = showModForm.mode === "add" 
      ? `/api/courses/${showModForm.courseId}/modules` 
      : `/api/modules/${showModForm.id}`;
    
    const res = await fetch(url, { 
      method, 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify({ name: fName }) 
    });
    
    if (res.ok) { 
      resetForm();
      setShowModForm(null); 
      load(); 
    } else { 
      const d = await res.json(); setError(d.error || "Failed"); 
    }
    setSaving(false);
  };

  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!fName) return;
    setSaving(true);
    const method = showNoteForm.mode === "add" ? "POST" : "PATCH";
    const url = showNoteForm.mode === "add" 
      ? `/api/modules/${showNoteForm.moduleId}/sessions` 
      : `/api/session-notes/${showNoteForm.id}`;
    
    const res = await fetch(url, {
      method, 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: fName, content: fContent })
    });
    
    if (res.ok) { 
      setShowNoteForm(null); 
      resetForm();
      load(); 
    } else { 
      const d = await res.json(); setError(d.error || "Failed"); 
    }
    setSaving(false);
  };

  const resetForm = () => {
    setFName(""); setFDesc(""); setFContent(""); setError("");
  };

  const softDelete = async (type: string, id: string) => {
    if (!confirm(`Move this ${type} to Recycle Bin?`)) return;
    const url = type === 'course' ? `/api/courses/${id}` : type === 'module' ? `/api/modules/${id}` : `/api/session-notes/${id}`;
    const res = await fetch(url, { method: "DELETE" });
    if (res.ok) load();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex items-end justify-between px-2">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)] tracking-tight">Curriculum Manager</h1>
          <p className="text-sm text-[var(--muted)] mt-1 font-medium">Structure courses and define topic-wise session guidelines</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowCourseForm({ mode: 'add' }); }} 
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add New Course
        </button>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-4 bg-brand-danger/10 border border-brand-danger/20 rounded-2xl text-brand-danger text-sm font-medium text-center">
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCourseForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCourseForm(null)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card w-full max-w-sm p-8 relative shadow-2xl overflow-hidden">
              <button onClick={() => setShowCourseForm(null)} className="absolute top-4 right-4 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"><X className="w-5 h-5" /></button>
              <h2 className="text-xl font-bold text-[var(--foreground)] mb-6">
                {showCourseForm.mode === "add" ? "Create New Course" : "Edit Course"}
              </h2>
              <form onSubmit={handleCourseSubmit} className="space-y-6">
                <Inp label="Course Name" value={fName} onChange={setFName} placeholder="e.g. Performance Marketing" required />
                <Inp label="Description" value={fDesc} onChange={setFDesc} placeholder="Optional curriculum overview..." />
                <button type="submit" disabled={saving} className="w-full btn-primary py-4 mt-2 shadow-xl shadow-brand-orange/10">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : showCourseForm.mode === "add" ? "Build Course" : "Update Details"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-brand-orange animate-spin" /></div>
      ) : courses.length === 0 ? (
        <div className="glass-card py-20 text-center border-dashed border-[var(--card-border)] bg-transparent">
          <BookOpen className="w-12 h-12 text-[var(--muted-foreground)] opacity-20 mx-auto mb-4" />
          <p className="text-[var(--muted)] font-medium">No courses recorded in the umbrella.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {courses.map(course => (
            <div key={course.id} className="glass-card overflow-hidden shadow-xl border border-[var(--card-border)]">
              <div className="flex items-center w-full group">
                <button
                  onClick={() => setExpanded(expandedCourse === course.id ? null : course.id)}
                  className="flex-1 flex items-center justify-between px-8 py-6 text-left hover:bg-[var(--inner-bg)] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center border border-brand-orange/20 shadow-sm">
                      <BookOpen className="w-5 h-5 text-brand-orange" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <p className="text-base font-bold text-[var(--foreground)] tracking-tight">{course.name}</p>
                        <Link 
                          href={`/courses/${course.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="px-3 py-1 rounded-full bg-brand-orange/10 border border-brand-orange/20 text-[9px] font-bold text-brand-orange hover:bg-brand-orange/20 transition-all"
                        >
                          View Curriculum Folder
                        </Link>
                      </div>
                      {course.description && <p className="text-xs text-[var(--muted)] mt-1 font-medium">{course.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-[10px] font-bold text-[var(--muted)] tracking-widest">{course.modules.length} Modules</span>
                    <ChevronRight className={`w-5 h-5 text-[var(--muted)] transition-transform duration-300 ${expandedCourse === course.id ? "rotate-90 text-brand-orange" : ""}`} />
                  </div>
                </button>
                <div className="flex items-center gap-2 pr-8 border-l border-[var(--card-border)] pl-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => { setFName(course.name); setFDesc(course.description || ""); setShowCourseForm({ mode: 'edit', id: course.id }); }}
                    className="p-2 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--inner-bg)] transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => softDelete('course', course.id)} className="p-2 rounded-lg text-[var(--muted)] hover:text-brand-danger hover:bg-brand-danger/10 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {expandedCourse === course.id && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-[var(--card-border)] bg-[var(--inner-bg)]/30 backdrop-blur-sm"
                  >
                    {course.modules.map(mod => (
                      <div key={mod.id} className="border-b border-[var(--card-border)] last:border-0">
                        <div className="flex items-center group/mod">
                          <button
                            onClick={() => setExpandedMod(expandedModule === mod.id ? null : mod.id)}
                            className="flex-1 flex items-center justify-between px-10 py-5 hover:bg-[var(--inner-bg)] transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <Layers className="w-5 h-5 text-[var(--muted)]" />
                              <span className="text-sm font-bold text-[var(--foreground)]">{mod.name}</span>
                              <Link 
                                href={`/modules/${mod.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="ml-2 px-3 py-1 rounded-full bg-brand-orange/10 border border-brand-orange/20 text-[9px] font-bold text-brand-orange hover:bg-brand-orange/20 transition-all"
                              >
                                View Intelligence Folder
                              </Link>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-[10px] font-bold text-[var(--muted)] tracking-tight">{mod.sessions.length} Session Definitions</span>
                              <ChevronRight className={`w-4 h-4 text-[var(--muted)] transition-transform ${expandedModule === mod.id ? "rotate-90 text-brand-orange" : ""}`} />
                            </div>
                          </button>
                          <div className="flex items-center gap-2 pr-10 opacity-0 group-hover/mod:opacity-100 transition-opacity">
                            <button 
                              onClick={() => { setFName(mod.name); setShowModForm({ mode: 'edit', id: mod.id }); }}
                              className="p-2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => softDelete('module', mod.id)} className="p-2 text-[var(--muted)] hover:text-brand-danger transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <AnimatePresence>
                          {expandedModule === mod.id && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="bg-black/5 dark:bg-white/5 px-12 py-6 space-y-4"
                            >
                              <div className="text-[10px] font-bold text-[var(--muted)] tracking-widest flex items-center gap-2 mb-2 translate-x-[-2px]">
                                <MoreHorizontal className="w-4 h-4 opacity-40" /> SESSION DEFINITIONS
                              </div>
                              <div className="grid grid-cols-1 gap-3">
                                {mod.sessions.map(sn => (
                                  <div key={sn.id} className="group/sn flex items-start justify-between p-5 rounded-2xl bg-[var(--background)] border border-[var(--card-border)] hover:border-brand-orange/30 transition-all shadow-sm">
                                    <div className="flex items-start gap-4">
                                      <div className="w-10 h-10 rounded-xl bg-brand-orange/5 border border-brand-orange/10 flex items-center justify-center shrink-0">
                                        <FileText className="w-5 h-5 text-brand-orange" />
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-3">
                                          <p className="text-sm font-bold text-[var(--foreground)] tracking-tight">{sn.name}</p>
                                          <Link 
                                            href={`/session-notes/${sn.id}`}
                                            className="px-2 py-0.5 rounded-md bg-brand-orange/5 border border-brand-orange/10 text-[8px] font-bold text-brand-orange/60 hover:text-brand-orange hover:bg-brand-orange/10 transition-all uppercase tracking-tighter"
                                          >
                                            View Session Folder
                                          </Link>
                                        </div>
                                        {sn.content && <p className="text-[11px] text-[var(--muted)] mt-1.5 max-w-2xl font-medium leading-relaxed italic line-clamp-2">"{sn.content}"</p>}
                                      </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover/sn:opacity-100 transition-opacity">
                                      <button 
                                        onClick={() => { setFName(sn.name); setFContent(sn.content || ""); setShowNoteForm({ mode: 'edit', id: sn.id }); }}
                                        className="p-2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                      <button onClick={() => softDelete('sessionNote', sn.id)} className="p-2 text-[var(--muted)] hover:text-brand-danger transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <button
                                onClick={() => { resetForm(); setShowNoteForm({ mode: 'add', moduleId: mod.id }); }}
                                className="flex items-center gap-2 text-[10px] font-bold text-brand-orange hover:gap-3 transition-all p-2 pt-2"
                              >
                                <Plus className="w-4 h-4" /> ADD COURSE SESSION
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}

                    <button
                      onClick={() => { resetForm(); setShowModForm({ mode: 'add', courseId: course.id }); }}
                      className="flex items-center gap-2 px-10 py-5 w-full text-[10px] font-bold text-[var(--muted)] hover:text-brand-orange transition-all border-t border-[var(--card-border)]"
                    >
                      <Plus className="w-4 h-4" /> ADD MODULE TO COURSE
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}

      {/* Forms Integration below... */}
      <AnimatePresence>
        {showModForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModForm(null)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card w-full max-w-sm p-8 relative shadow-2xl overflow-hidden">
              <button onClick={() => setShowModForm(null)} className="absolute top-4 right-4 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"><X className="w-5 h-5" /></button>
              <h2 className="text-xl font-bold text-[var(--foreground)] mb-6">{showModForm.mode === "add" ? "New Module" : "Edit Module"}</h2>
              <form onSubmit={handleModuleSubmit} className="space-y-6">
                <Inp label="Module Name" value={fName} onChange={setFName} placeholder="e.g. Ad Fundamentals" required />
                <button type="submit" disabled={saving} className="w-full btn-primary py-4 mt-2 shadow-xl shadow-brand-orange/10">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Keep Module"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showNoteForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowNoteForm(null)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card w-full max-w-lg p-8 relative shadow-2xl overflow-hidden">
              <button onClick={() => setShowNoteForm(null)} className="absolute top-4 right-4 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"><X className="w-5 h-5" /></button>
              <h2 className="text-xl font-bold text-[var(--foreground)] mb-6">{showNoteForm.mode === "add" ? "Insert Course Session" : "Amend Session Details"}</h2>
              <form onSubmit={handleNoteSubmit} className="space-y-6">
                <Inp label="Session Title" value={fName} onChange={setFName} placeholder="e.g. Campaign Structure" required />
                <div>
                  <label className="block text-[11px] font-bold text-[var(--muted-foreground)] tracking-widest mb-1.5">Session Content / Guidelines</label>
                  <textarea 
                    value={fContent} 
                    onChange={e => setFContent(e.target.value)} 
                    placeholder="Explicit instructions for the analyst..."
                    rows={6}
                    className="liquid-input shadow-inner resize-none py-4" 
                  />
                </div>
                <button type="submit" disabled={saving} className="w-full btn-primary py-4 shadow-xl shadow-brand-orange/10 flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" /> {saving ? "Updating Umbrella..." : "Save Session Structure"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
