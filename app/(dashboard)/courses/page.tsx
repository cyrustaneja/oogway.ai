"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ChevronRight, Loader2, BookOpen, Layers, FileText, X, Edit2, Trash2, RefreshCw, Link2, Clock, CheckCircle2, AlertCircle, CheckCheck, Sparkles, FileSpreadsheet } from "lucide-react";
import { SessionItem } from "@/components/courses/SessionItem";

interface SyncResult {
  modulesCreated: number;
  modulesUpdated: number;
  sessionsAdded: number;
  sessionsUpdated: number;
  sessionsSkipped: number;
  errors: string[];
}

const Inp = ({ label, value, onChange, placeholder, required, type = "text" }: any) => (
  <div>
    <label className="block text-[11px] font-bold text-[var(--muted-foreground)] tracking-widest mb-1.5 uppercase">
      {label}{required && " *"}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="liquid-input shadow-sm"
      required={required}
    />
  </div>
);

export default function CoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCourse, setExpanded] = useState<string | null>(null);
  const [expandedModule, setExpandedMod] = useState<string | null>(null);

  const [showCourseForm, setShowCourseForm] = useState<any>(null);
  const [showSheetForm, setShowSheetForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [syncingCourse, setSyncingCourse] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<{ courseId: string; result: SyncResult } | null>(null);

  const [fName, setFName] = useState("");
  const [fDesc, setFDesc] = useState("");
  const [fSheetUrl, setFSheetUrl] = useState("");
  const [fSheetTab, setFSheetTab] = useState("Sheet1");

  const load = useCallback(() =>
    fetch("/api/courses")
      .then((r) => r.json())
      .then(setCourses)
      .finally(() => setLoading(false)),
  []);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setFName(""); setFDesc(""); setError("");
    setFSheetUrl(""); setFSheetTab("Sheet1");
  };

  const handleCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!fName) return;
    setSaving(true);
    const method = showCourseForm.mode === "add" ? "POST" : "PATCH";
    const url = showCourseForm.mode === "add" ? "/api/courses" : `/api/courses/${showCourseForm.id}`;
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: fName, description: fDesc }),
    });
    if (res.ok) { setShowCourseForm(null); resetForm(); load(); }
    else { const d = await res.json(); setError(d.error || "Failed"); }
    setSaving(false);
  };

  const softDelete = async (type: string, id: string) => {
    if (!confirm(`Move this ${type} to Recycle Bin?`)) return;
    const url = type === "course" ? `/api/courses/${id}` : `/api/modules/${id}`;
    const res = await fetch(url, { method: "DELETE" });
    if (res.ok) load();
  };

  const handleSheetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/courses/${showSheetForm.courseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sheetUrl: fSheetUrl.trim() || null,
        sheetTabName: fSheetTab.trim() || "Sheet1",
      }),
    });
    if (res.ok) { setShowSheetForm(null); resetForm(); load(); } 
    else { const d = await res.json(); setError(d.error || "Failed to save sheet URL"); }
    setSaving(false);
  };

  const handleSync = async (courseId: string) => {
    setSyncingCourse(courseId);
    setSyncResult(null);
    try {
      const res = await fetch(`/api/courses/${courseId}/sync-sheet`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSyncResult({ courseId, result: data });
        load();
      } else {
        setSyncResult({ courseId, result: { ...data, errors: [data.error || "Sync failed"], modulesCreated: 0, modulesUpdated: 0, sessionsAdded: 0, sessionsUpdated: 0, sessionsSkipped: 0 } });
      }
    } catch {
      setSyncResult({ courseId, result: { errors: ["Network error — sync failed"], modulesCreated: 0, modulesUpdated: 0, sessionsAdded: 0, sessionsUpdated: 0, sessionsSkipped: 0 } });
    } finally {
      setSyncingCourse(null);
    }
  };

  const formatSyncedAt = (dt: string | null) => {
    if (!dt) return null;
    return new Date(dt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: true });
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 space-y-6 sm:space-y-8 py-6 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] tracking-tight">Curriculum Manager</h1>
          <p className="text-xs sm:text-sm text-[var(--muted)] mt-1 font-medium">
            Connect Google Sheets to courses — modules and sessions sync automatically
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowCourseForm({ mode: "add" }); }}
          className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add New Course
        </button>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-4 bg-[var(--chip-red-bg)] border border-[var(--chip-red-border)] rounded-2xl text-[var(--chip-red-text)] text-sm font-medium text-center shadow-sm">
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {syncResult && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="glass-card p-5 border border-[var(--chip-green-border)] bg-[var(--chip-green-bg)] rounded-2xl shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                {syncResult.result.errors.length === 0 ? (
                  <CheckCheck className="w-5 h-5 text-[var(--chip-green-text)] mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-[var(--chip-amber-text)] mt-0.5 shrink-0" />
                )}
                <div className="space-y-1">
                  <p className="text-sm font-bold text-[var(--foreground)]">Sync Complete</p>
                  <div className="flex flex-wrap gap-2 sm:gap-3 text-xs font-medium text-[var(--muted)]">
                    <span className="text-[var(--chip-green-text)] font-bold">+{syncResult.result.modulesCreated} modules</span>
                    <span>·</span>
                    <span className="text-[var(--chip-blue-text)] font-bold">+{syncResult.result.sessionsAdded} sessions</span>
                    <span>·</span>
                    <span>{syncResult.result.sessionsUpdated} updated</span>
                    {syncResult.result.sessionsSkipped > 0 && <><span>·</span><span className="text-[var(--chip-amber-text)]">{syncResult.result.sessionsSkipped} skipped</span></>}
                  </div>
                  {syncResult.result.errors.length > 0 && (
                    <ul className="mt-2 space-y-0.5">
                      {syncResult.result.errors.map((e, i) => (
                        <li key={i} className="text-[11px] text-[var(--chip-amber-text)] font-medium">⚠ {e}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <button onClick={() => setSyncResult(null)} className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Courses List */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-[var(--foreground)] animate-spin" /></div>
      ) : courses.length === 0 ? (
        <div className="glass-card py-16 sm:py-24 text-center border-dashed border-[var(--card-border)] bg-transparent">
          <BookOpen className="w-10 h-10 text-[var(--muted-foreground)] opacity-30 mx-auto mb-4" />
          <p className="text-sm sm:text-base text-[var(--muted)] font-medium">No courses yet. Add one to get started.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {courses.map((course) => (
            <div key={course.id} className="glass-card overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              {/* Course Header */}
              <div className="flex flex-col sm:flex-row sm:items-center w-full group">
                <button
                  onClick={() => setExpanded(expandedCourse === course.id ? null : course.id)}
                  className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between px-5 sm:px-8 py-5 sm:py-6 text-left hover:bg-[var(--layer-2)] transition-colors gap-4"
                >
                  <div className="flex items-start sm:items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[var(--layer-2)] flex items-center justify-center border border-[var(--border)] shadow-sm shrink-0">
                      <BookOpen className="w-5 h-5 text-[var(--foreground)]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                        <p className="text-[15px] sm:text-base font-semibold text-[var(--foreground)] tracking-tight">{course.name}</p>
                        <Link
                          href={`/courses/${course.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="px-3 py-1 rounded-full bg-[var(--layer-2)] border border-[var(--border)] text-[9px] font-bold text-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--layer-1)] transition-all"
                        >
                          View Curriculum
                        </Link>
                        {course.sheetUrl ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-[var(--chip-green-bg)] border border-[var(--chip-green-border)] text-[9px] font-bold text-[var(--chip-green-text)] flex items-center gap-1">
                            <Link2 className="w-2.5 h-2.5" /> Connected
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-[var(--chip-amber-bg)] border border-[var(--chip-amber-border)] text-[9px] font-bold text-[var(--chip-amber-text)] flex items-center gap-1">
                            <Link2 className="w-2.5 h-2.5" /> No Sheet
                          </span>
                        )}
                      </div>
                      {course.description && (
                        <p className="text-xs text-[var(--muted)] mt-1 font-medium">{course.description}</p>
                      )}
                      {course.lastSyncedAt && (
                        <p className="text-[10px] text-[var(--muted)] mt-1 font-medium flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" /> Last synced {formatSyncedAt(course.lastSyncedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 self-end sm:self-auto">
                    <span className="text-[10px] font-bold text-[var(--muted)] tracking-widest">{course.modules.length} Modules</span>
                    <ChevronRight className={`w-5 h-5 text-[var(--muted)] transition-transform duration-300 ${expandedCourse === course.id ? "rotate-90 text-[var(--foreground)]" : ""}`} />
                  </div>
                </button>

                {/* Course Actions - Visible on hover desktop, always visible on mobile */}
                <div className="flex items-center gap-1 sm:gap-2 px-5 sm:px-0 pb-4 sm:pb-0 sm:pr-8 sm:border-l sm:border-[var(--border)] sm:pl-6 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button
                    title={course.sheetUrl ? "Edit Google Sheet" : "Attach Google Sheet"}
                    onClick={() => {
                      resetForm();
                      setFSheetUrl(course.sheetUrl || "");
                      setFSheetTab(course.sheetTabName || "Sheet1");
                      setShowSheetForm({ courseId: course.id, courseName: course.name });
                    }}
                    className="p-2 sm:p-2.5 rounded-lg text-[var(--muted)] hover:text-[var(--chip-green-text)] hover:bg-[var(--chip-green-bg)] transition-all bg-[var(--layer-2)] sm:bg-transparent"
                  >
                    <Link2 className="w-4 h-4" />
                  </button>

                  {course.sheetUrl && (
                    <button
                      title="Sync from Google Sheet"
                      onClick={() => handleSync(course.id)}
                      disabled={syncingCourse === course.id}
                      className="p-2 sm:p-2.5 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--layer-2)] transition-all disabled:opacity-50 bg-[var(--layer-2)] sm:bg-transparent"
                    >
                      <RefreshCw className={`w-4 h-4 ${syncingCourse === course.id ? "animate-spin" : ""}`} />
                    </button>
                  )}

                  <button
                    onClick={() => { setFName(course.name); setFDesc(course.description || ""); setShowCourseForm({ mode: "edit", id: course.id }); }}
                    className="p-2 sm:p-2.5 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--layer-2)] transition-all bg-[var(--layer-2)] sm:bg-transparent"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button onClick={() => softDelete("course", course.id)} className="p-2 sm:p-2.5 rounded-lg text-[var(--muted)] hover:text-[var(--chip-red-text)] hover:bg-[var(--chip-red-bg)] transition-all bg-[var(--layer-2)] sm:bg-transparent">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Expanded: Modules */}
              <AnimatePresence>
                {expandedCourse === course.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-[var(--border)] bg-[var(--layer-2)]"
                  >
                    {!course.sheetUrl && (
                      <div className="px-5 sm:px-10 py-5 sm:py-6 flex flex-col sm:flex-row sm:items-center gap-4 border-b border-[var(--border)]">
                        <div className="w-8 h-8 rounded-lg bg-[var(--chip-amber-bg)] flex items-center justify-center shrink-0">
                          <Link2 className="w-4 h-4 text-[var(--chip-amber-text)]" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-[var(--foreground)]">No Google Sheet attached</p>
                          <p className="text-xs text-[var(--muted)] font-medium mt-0.5">Attach a Google Sheet to automatically sync modules and sessions.</p>
                        </div>
                        <button
                          onClick={() => {
                            resetForm();
                            setFSheetUrl("");
                            setFSheetTab("Sheet1");
                            setShowSheetForm({ courseId: course.id, courseName: course.name });
                          }}
                          className="btn-primary py-2 px-4 text-xs w-full sm:w-auto flex items-center justify-center gap-2"
                        >
                          <Link2 className="w-3.5 h-3.5" /> Attach Sheet
                        </button>
                      </div>
                    )}

                    {syncingCourse === course.id && (
                      <div className="px-5 sm:px-10 py-4 flex items-center gap-3 border-b border-[var(--border)] bg-[var(--layer-1)]">
                        <Loader2 className="w-4 h-4 animate-spin text-[var(--foreground)] shrink-0" />
                        <p className="text-xs font-bold text-[var(--foreground)] tracking-tight">Syncing from Google Sheet… this may take a moment</p>
                      </div>
                    )}

                    {course.modules.length === 0 && course.sheetUrl ? (
                      <div className="px-5 sm:px-10 py-10 text-center space-y-3">
                        <Sparkles className="w-8 h-8 text-[var(--muted)] mx-auto" />
                        <p className="text-sm font-semibold text-[var(--foreground)]">Sheet attached — ready to sync</p>
                        <p className="text-xs text-[var(--muted)]">Click the sync button to import modules and sessions.</p>
                        <button
                          onClick={() => handleSync(course.id)}
                          disabled={syncingCourse === course.id}
                          className="btn-primary py-2 px-5 text-xs mx-auto flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${syncingCourse === course.id ? "animate-spin" : ""}`} />
                          Sync Now
                        </button>
                      </div>
                    ) : (
                      course.modules.map((mod: any) => (
                        <div key={mod.id} className="border-b border-[var(--border)] last:border-0 bg-white">
                          <div className="flex flex-col sm:flex-row sm:items-center group/mod">
                            <button
                              onClick={() => setExpandedMod(expandedModule === mod.id ? null : mod.id)}
                              className="flex-1 flex items-center justify-between px-5 sm:px-10 py-5 hover:bg-[var(--layer-2)] transition-colors gap-4"
                            >
                              <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                                <Layers className="w-5 h-5 text-[var(--muted)] hidden sm:block" />
                                <div className="flex-1 text-left">
                                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                                    <span className="text-sm font-semibold text-[var(--foreground)]">{mod.name}</span>
                                    {mod.sheetModuleId && (
                                      <span className="px-2 py-0.5 rounded-md bg-[var(--layer-2)] border border-[var(--border)] text-[9px] font-bold text-[var(--muted)] font-mono">
                                        {mod.sheetModuleId}
                                      </span>
                                    )}
                                    <Link
                                      href={`/modules/${mod.id}`}
                                      onClick={(e) => e.stopPropagation()}
                                      className="px-3 py-0.5 rounded-full bg-[var(--layer-2)] border border-[var(--border)] text-[9px] font-bold text-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--layer-1)] transition-all"
                                    >
                                      Intelligence Folder
                                    </Link>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 sm:gap-4">
                                <span className="text-[10px] font-bold text-[var(--muted)] shrink-0">{mod.sessions.length} Sessions</span>
                                <ChevronRight className={`w-4 h-4 text-[var(--muted)] transition-transform ${expandedModule === mod.id ? "rotate-90 text-[var(--foreground)]" : ""}`} />
                              </div>
                            </button>
                            <div className="flex items-center px-5 sm:px-0 pb-4 sm:pb-0 sm:pr-10 opacity-100 sm:opacity-0 sm:group-hover/mod:opacity-100 transition-opacity justify-end">
                              <button onClick={() => softDelete("module", mod.id)} className="p-2 bg-[var(--layer-2)] sm:bg-transparent rounded-lg text-[var(--muted)] hover:text-[var(--chip-red-text)] transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <AnimatePresence>
                            {expandedModule === mod.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="bg-[var(--layer-2)] px-4 sm:px-12 py-6 space-y-4 shadow-inner"
                              >
                                <div className="text-[10px] font-bold text-[var(--muted)] tracking-widest flex items-center gap-2 mb-2 uppercase">
                                  <FileText className="w-3.5 h-3.5 opacity-60" /> SESSION PLAN
                                  <span className="ml-auto text-[var(--muted)] font-mono">{mod.sessions.length} sessions</span>
                                </div>
                                {mod.sessions
                                  .sort((a: any, b: any) => (a.weekOrder ?? 999) - (b.weekOrder ?? 999))
                                  .map((sn: any) => (
                                    <SessionItem key={sn.id} sn={sn} />
                                  ))}
                                {mod.sessions.length === 0 && (
                                  <div className="text-center py-6 text-xs text-[var(--muted)] font-medium">
                                    No sessions synced yet for this module.
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showCourseForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCourseForm(null)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card w-full max-w-sm p-6 sm:p-8 relative shadow-2xl">
              <button onClick={() => setShowCourseForm(null)} className="absolute top-4 right-4 text-[var(--muted)] hover:text-[var(--foreground)]"><X className="w-5 h-5" /></button>
              <h2 className="text-xl font-bold text-[var(--foreground)] mb-6 tracking-tight">
                {showCourseForm.mode === "add" ? "Create Course" : "Edit Course"}
              </h2>
              <form onSubmit={handleCourseSubmit} className="space-y-6">
                <Inp label="Course Name" value={fName} onChange={setFName} placeholder="e.g. Performance Marketing" required />
                <Inp label="Description" value={fDesc} onChange={setFDesc} placeholder="Optional overview..." />
                {error && <p className="text-[var(--chip-red-text)] text-xs font-medium">{error}</p>}
                <button type="submit" disabled={saving} className="w-full btn-primary py-3.5 flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : showCourseForm.mode === "add" ? "Create" : "Update"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSheetForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSheetForm(null)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card w-full max-w-md p-6 sm:p-8 relative shadow-2xl">
              <button onClick={() => setShowSheetForm(null)} className="absolute top-4 right-4 text-[var(--muted)] hover:text-[var(--foreground)]"><X className="w-5 h-5" /></button>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[var(--chip-green-bg)] flex items-center justify-center border border-[var(--chip-green-border)]">
                  <FileSpreadsheet className="w-5 h-5 text-[var(--chip-green-text)]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--foreground)] tracking-tight">Attach Google Sheet</h2>
                  <p className="text-xs text-[var(--muted)] font-medium mt-0.5">{showSheetForm.courseName}</p>
                </div>
              </div>
              <form onSubmit={handleSheetSubmit} className="space-y-5">
                <div>
                  <label className="block text-[11px] font-bold text-[var(--muted-foreground)] tracking-widest mb-1.5 uppercase">Google Sheet URL</label>
                  <input type="url" value={fSheetUrl} onChange={(e) => setFSheetUrl(e.target.value)} placeholder="https://docs.google..." className="liquid-input shadow-sm" />
                  <p className="text-[10px] text-[var(--muted)] mt-1.5 font-medium">Must be publicly accessible.</p>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[var(--muted-foreground)] tracking-widest mb-1.5 uppercase">Tab Name</label>
                  <input type="text" value={fSheetTab} onChange={(e) => setFSheetTab(e.target.value)} placeholder="Sheet1" className="liquid-input shadow-sm" />
                  <p className="text-[10px] text-[var(--muted)] mt-1.5 font-medium">Exact tab name to sync (default: Sheet1)</p>
                </div>
                {error && <p className="text-[var(--chip-red-text)] text-xs font-medium">{error}</p>}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  {fSheetUrl && (
                    <button type="button" onClick={() => setFSheetUrl("")} className="btn-secondary sm:w-auto w-full py-3 px-4 text-xs !text-[var(--chip-red-text)] !border-[var(--chip-red-border)] hover:!bg-[var(--chip-red-bg)]">
                      Remove Sheet
                    </button>
                  )}
                  <button type="submit" disabled={saving} className="flex-1 btn-primary py-3 flex items-center justify-center gap-2">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> Save & Attach</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
