"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Plus,
  X,
  Loader2,
  Layers,
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle,
  AlertTriangle,
  Play,
  Sparkles,
  Trash2,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { RawBatchRow, ResolvedBatchRow } from "@/app/api/batches/bulk/route";

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
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [flash, setFlash] = useState("");

  // Single Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [courseId, setCourseId] = useState("");

  // Bulk Upload State
  const [bulkCsvText, setBulkCsvText] = useState("");
  const [bulkPreview, setBulkPreview] = useState<ResolvedBatchRow[]>([]);
  const [loadingBulkPreview, setLoadingBulkPreview] = useState(false);
  const [submittingBulk, setSubmittingBulk] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/batches").then((r) => r.json()),
      fetch("/api/courses").then((r) => r.json()),
    ])
      .then(([b, c]) => {
        setBatches(Array.isArray(b) ? b : []);
        setCourses(Array.isArray(c) ? c : []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmitSingle = async (e: React.FormEvent) => {
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
        setFlash("Batch created successfully!");
        setTimeout(() => setFlash(""), 4000);
        load();
      } else {
        const d = await res.json();
        setError(d.error || "Failed to create batch.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, batchName: string) => {
    if (!confirm(`Are you sure you want to delete batch "${batchName}"?`)) return;
    try {
      const res = await fetch(`/api/batches/${id}`, { method: "DELETE" });
      if (res.ok) {
        setFlash(`Deleted ${batchName}`);
        setTimeout(() => setFlash(""), 4000);
        load();
      }
    } catch (err) {
      console.error("Failed to delete batch", err);
    }
  };

  // Download Live CSV Template
  const handleDownloadTemplate = () => {
    window.open("/api/batches/template", "_blank");
  };

  // Handle File Dropzone Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      setBulkCsvText(text);
      processBulkPreview(text);
    };
    reader.readAsText(file);
  };

  // Process Bulk CSV Preview
  const processBulkPreview = async (csvText: string) => {
    setError("");
    const lines = csvText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"));

    if (lines.length === 0) {
      setBulkPreview([]);
      return;
    }

    const firstLower = lines[0].toLowerCase();
    const hasHeader = firstLower.includes("batch") || firstLower.includes("course");
    const dataLines = hasHeader ? lines.slice(1) : lines;

    const rawRows: RawBatchRow[] = dataLines.map((line) => {
      const cols = line.match(/(?:[^\s,",]+|"(?:\\.|[^"])*")+/g) || line.split(",");
      const cleanCols = cols.map((c) => c.replace(/^"|"$/g, "").trim());

      return {
        name: cleanCols[0] || "",
        course: cleanCols[1] || "",
        description: cleanCols[2] || "",
      };
    });

    setLoadingBulkPreview(true);
    try {
      const res = await fetch("/api/batches/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "preview", rows: rawRows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to preview batches.");
      setBulkPreview(data.preview || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingBulkPreview(false);
    }
  };

  // Submit Bulk Batches Creation
  const handleSubmitBulk = async () => {
    const validRows = bulkPreview.filter((r) => r.isValid);
    if (validRows.length === 0) return;

    setSubmittingBulk(true);
    try {
      const res = await fetch("/api/batches/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", rows: validRows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to bulk import batches.");

      setFlash(`Successfully created/updated ${data.count} learning cohorts!`);
      setTimeout(() => setFlash(""), 5000);
      setShowBulkModal(false);
      setBulkCsvText("");
      setBulkPreview([]);
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmittingBulk(false);
    }
  };

  const validCount = bulkPreview.filter((r) => r.isValid).length;
  const invalidCount = bulkPreview.filter((r) => !r.isValid).length;

  // Bulk Select & Delete State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const toggleSelectAll = () => {
    if (selectedIds.length === batches.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(batches.map((b) => b.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const toDeleteIds = [...selectedIds];
    if (!confirm(`Delete ${toDeleteIds.length} selected cohort(s)?`)) return;

    // OPTIMISTIC UI: Instantly remove all selected items from state
    const previousBatches = [...batches];
    setBatches((prev) => prev.filter((b) => !toDeleteIds.includes(b.id)));
    setSelectedIds([]);
    setFlash(`Successfully deleted ${toDeleteIds.length} cohort(s).`);
    setTimeout(() => setFlash(""), 4000);

    setBulkDeleting(true);
    try {
      const res = await fetch("/api/trash/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "batch", ids: toDeleteIds }),
      });
      if (!res.ok) {
        setBatches(previousBatches);
        setSelectedIds(toDeleteIds);
        const d = await res.json();
        alert(d.error || "Failed to delete selected cohorts.");
      }
    } catch (err) {
      setBatches(previousBatches);
      setSelectedIds(toDeleteIds);
      alert("An unexpected error occurred during bulk delete.");
    } finally {
      setBulkDeleting(false);
    }
  };

  const allSelected = batches.length > 0 && selectedIds.length === batches.length;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 px-4 sm:px-6 md:px-8 py-6 animate-in fade-in duration-300">
      
      {/* ── HEADER & ACTIONS ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--foreground)] tracking-tight leading-none">
            Batches &amp; Cohorts
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted)] font-medium mt-1">
            Manage student learning batches, assign course structures, and monitor session evaluations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowBulkModal(true); setError(""); }}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold border border-slate-300 flex items-center gap-1.5 transition-all shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#E8A020]" /> Bulk CSV Upload
          </button>
          
          <button
            onClick={() => { setShowForm(true); setError(""); }}
            className="btn-primary py-2 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-[#E8A020]/20"
          >
            <Plus className="w-4 h-4" /> Add Batch
          </button>
        </div>
      </div>

      {/* FLASH MESSAGE */}
      {flash && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-extrabold flex items-center gap-2 shadow-xs">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{flash}</span>
        </div>
      )}

      {/* ── BATCHES TOOLBAR & GRID ── */}
      {batches.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border border-[var(--border)] rounded-xl text-xs font-bold text-[var(--muted)]">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded border-slate-300 text-[#E8A020] focus:ring-[#E8A020] cursor-pointer"
            />
            <span>{allSelected ? "Deselect All" : "Select All Cohorts"}</span>
          </label>
          {selectedIds.length > 0 && (
            <span className="text-[11px] font-extrabold text-[#E8A020]">
              {selectedIds.length} of {batches.length} selected
            </span>
          )}
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center space-y-2">
          <Loader2 className="w-8 h-8 animate-spin text-[#E8A020] mx-auto" />
          <p className="text-xs font-bold text-[var(--muted)]">Loading cohorts...</p>
        </div>
      ) : batches.length === 0 ? (
        <div className="py-16 text-center space-y-2 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
          <Layers className="w-10 h-10 mx-auto text-slate-300" />
          <p className="text-sm font-extrabold text-slate-700">No cohorts found</p>
          <p className="text-xs text-slate-500 font-medium">Create a new batch or upload a CSV to get started.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {batches.map((b) => {
            const isChecked = selectedIds.includes(b.id);
            return (
              <div
                key={b.id}
                className={cn(
                  "glass-card px-5 py-3.5 rounded-2xl border border-[var(--border)] bg-white shadow-2xs hover:border-[#E8A020]/50 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 relative",
                  isChecked ? "border-[#E8A020] bg-amber-50/40" : ""
                )}
              >
                {/* Left Section: Checkbox, Icon, Name & Description */}
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleSelectOne(b.id)}
                    className="w-4 h-4 rounded border-slate-300 text-[#E8A020] focus:ring-[#E8A020] cursor-pointer shrink-0"
                  />
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center font-black text-xs text-[#E8A020] shrink-0 shadow-2xs">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-black text-[var(--foreground)] leading-tight truncate">{b.name}</h3>
                      {b.course && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-extrabold border border-slate-200 shrink-0">
                          {b.course.name}
                        </span>
                      )}
                    </div>
                    {b.description && (
                      <p className="text-xs text-[var(--muted)] font-medium truncate mt-0.5 max-w-xl">
                        {b.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Section: Session Count & Action Buttons */}
                <div className="flex items-center justify-between md:justify-end gap-5 border-t md:border-t-0 border-slate-100 pt-2.5 md:pt-0 shrink-0">
                  <span className="text-xs font-bold text-[var(--muted)] bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80">
                    <strong className="text-slate-900 font-black">{b._count?.sessions ?? 0}</strong> Sessions
                  </span>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/batches/${b.id}`}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-[#E8A020] text-xs font-black flex items-center gap-1 transition-colors border border-amber-500/20"
                    >
                      View Cohort <ChevronRight className="w-3.5 h-3.5" />
                    </Link>

                    <button
                      onClick={() => handleDelete(b.id, b.name)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors border border-transparent hover:border-rose-200"
                      title="Delete Batch"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FLOATING ACTION BAR FOR BULK DELETION */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-4 animate-in slide-in-from-bottom duration-200">
          <span className="text-xs font-bold">
            <span className="text-[#E8A020]">{selectedIds.length}</span> cohort(s) selected
          </span>

          <div className="h-4 w-px bg-slate-700" />

          <button
            onClick={handleBulkDelete}
            disabled={bulkDeleting}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-extrabold rounded-xl flex items-center gap-2 transition-all shadow-md cursor-pointer"
          >
            {bulkDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            <span>Delete Selected Batches</span>
          </button>

          <button
            onClick={() => setSelectedIds([])}
            className="text-[11px] font-bold text-slate-400 hover:text-white transition-colors ml-1"
          >
            Cancel
          </button>
        </div>
      )}

      {/* ── MODAL 1: SINGLE BATCH CREATION ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 rounded-2xl bg-white space-y-4 shadow-xl border border-[var(--border)]">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h2 className="text-base font-extrabold text-[var(--foreground)]">Create New Learning Cohort</h2>
              <button onClick={() => setShowForm(false)} className="p-1 rounded-lg text-[var(--muted)] hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmitSingle} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[var(--muted)] mb-1 uppercase text-[10px]">Batch / Cohort Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. MLP 46 FT"
                  className="w-full liquid-input font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--muted)] mb-1 uppercase text-[10px]">Linked Course Curriculum</label>
                <select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="w-full liquid-input font-medium"
                >
                  <option value="">Select course...</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[var(--muted)] mb-1 uppercase text-[10px]">Description / Schedule Note</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Full time weekday morning batch"
                  className="w-full liquid-input"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary px-5 py-2 rounded-xl font-bold uppercase"
                >
                  {saving ? "Saving..." : "Create Cohort"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: BULK CSV BATCH UPLOAD ── */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="glass-card max-w-2xl w-full p-6 rounded-2xl bg-white space-y-4 shadow-xl border border-[var(--border)] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[#E8A020]" />
                <h2 className="text-base font-extrabold text-[var(--foreground)]">
                  Bulk CSV Import Batches &amp; Cohorts
                </h2>
              </div>
              <button onClick={() => setShowBulkModal(false)} className="p-1 rounded-lg text-[var(--muted)] hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold">
                {error}
              </div>
            )}

            {/* LIVE AVAILABLE COURSES CHEAT SHEET */}
            {courses.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
                <span className="text-[10px] font-extrabold text-amber-950 uppercase tracking-wider block">
                  Available Linked Courses In System:
                </span>
                <div className="flex flex-wrap gap-1">
                  {courses.map((c) => (
                    <span key={c.id} className="px-2 py-0.5 rounded bg-white text-amber-950 font-bold text-[10px] border border-amber-300">
                      {c.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between bg-slate-100 p-3 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800">Format: Batch Name, Course Name, Description</span>
                <button
                  onClick={handleDownloadTemplate}
                  className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-extrabold text-[10px] flex items-center gap-1"
                >
                  <Download className="w-3 h-3" /> Template
                </button>
              </div>

              {/* Upload Dropzone & Text Area */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="border-2 border-dashed border-[var(--border)] rounded-xl p-4 text-center flex flex-col items-center justify-center space-y-2 bg-slate-50 relative">
                  <Upload className="w-6 h-6 text-[#E8A020]" />
                  <span className="text-[11px] font-bold text-slate-700">Upload CSV File</span>
                  <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>

                <textarea
                  rows={3}
                  value={bulkCsvText}
                  onChange={(e) => {
                    setBulkCsvText(e.target.value);
                    processBulkPreview(e.target.value);
                  }}
                  placeholder="MLP 46 FT,Marketing Launchpad Program,Full Time Cohort&#10;MMP Oct 2026,Marketing Strategy,Part Time Cohort"
                  className="w-full liquid-input font-mono p-3 text-xs"
                />
              </div>

              {/* Bulk Preview Table with Granular Error Reporting */}
              {bulkPreview.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold uppercase text-[10px] text-[var(--muted)]">
                      Validation Preview ({validCount} Valid | {invalidCount} Invalid)
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-[var(--border)] max-h-48 overflow-y-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-100 border-b border-[var(--border)] font-bold text-[10px] uppercase">
                        <tr>
                          <th className="py-2 px-3">Batch Name</th>
                          <th className="py-2 px-3">Course Link</th>
                          <th className="py-2 px-3">Validation Status</th>
                          <th className="py-2 px-3">Error Breakdown</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)] font-medium">
                        {bulkPreview.map((row, idx) => (
                          <tr key={idx} className={row.isValid ? "hover:bg-slate-50" : "bg-rose-50/60"}>
                            <td className="py-2 px-3 font-bold text-[var(--foreground)]">{row.name}</td>
                            <td className="py-2 px-3 font-bold text-amber-700">{row.courseName}</td>
                            <td className="py-2 px-3">
                              {row.isValid ? (
                                <span className="text-emerald-700 font-extrabold">✓ Ready</span>
                              ) : (
                                <span className="text-rose-700 font-extrabold">⚠ Errored</span>
                              )}
                            </td>
                            <td className="py-2 px-3">
                              {row.isValid ? (
                                <span className="text-[10px] text-emerald-700">✓ Linked</span>
                              ) : (
                                <span className="text-[10px] text-rose-700 font-black">❌ {row.validationError}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="pt-3 flex justify-end gap-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitBulk}
                  disabled={submittingBulk || validCount === 0}
                  className="btn-primary px-5 py-2 rounded-xl font-bold uppercase flex items-center gap-1.5"
                >
                  {submittingBulk ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>Import {validCount} Cohorts</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
