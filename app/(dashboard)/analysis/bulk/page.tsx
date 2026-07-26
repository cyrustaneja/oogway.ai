"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  ListOrdered,
  FileText,
  Play,
  Layers,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { RawBulkRow, ResolvedBulkRow } from "@/lib/server/bulk-session-parser";

export default function BulkAnalysisPage() {
  const router = useRouter();

  const [rawInputText, setRawInputText] = useState("");
  const [availableModules, setAvailableModules] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<ResolvedBulkRow[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetch("/api/modules")
      .then((r) => r.json())
      .then((data) => {
        if (data?.uniqueModuleNames) setAvailableModules(data.uniqueModuleNames);
      })
      .catch(console.error);
  }, []);

  // Parse CSV text into array of RawBulkRow objects
  const parseCSVText = (text: string): RawBulkRow[] => {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"));

    if (lines.length === 0) return [];

    const firstLineLower = lines[0].toLowerCase();
    const hasHeader =
      firstLineLower.includes("expert") ||
      firstLineLower.includes("session") ||
      firstLineLower.includes("url");

    const dataLines = hasHeader ? lines.slice(1) : lines;

    return dataLines.map((line) => {
      const cols = line.match(/(?:[^\s,",]+|"(?:\\.|[^"])*")+/g) || line.split(",");
      const cleanCols = cols.map((c) => c.replace(/^"|"$/g, "").trim());

      return {
        expert: cleanCols[0] || "",
        batch: cleanCols[1] || "",
        session: cleanCols[2] || "",
        conductedDate: cleanCols[3] || "",
        videoUrl: cleanCols[4] || "",
        transcriptUrl: cleanCols[5] || "",
      };
    });
  };

  // Download CSV Template dynamically from live database / Google Sheets
  const handleDownloadTemplate = () => {
    window.open("/api/analysis/bulk/template", "_blank");
  };

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      setRawInputText(text);
      processPreview(text);
    };
    reader.readAsText(file);
  };

  // Run Preview Validation API
  const processPreview = async (csvText: string) => {
    setError("");
    const parsedRaw = parseCSVText(csvText);

    if (parsedRaw.length === 0) {
      setError("No valid data rows found in CSV.");
      setPreviewRows([]);
      return;
    }

    setLoadingPreview(true);

    try {
      const res = await fetch("/api/analysis/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "preview", rows: parsedRaw }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to parse preview.");

      setPreviewRows(data.preview || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingPreview(false);
    }
  };

  // Submit Bulk Sessions for Sequential Execution
  const handleSubmitBulk = async () => {
    const validRows = previewRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      setError("No valid rows available to process.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/analysis/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", rows: validRows }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create bulk sessions.");

      setSuccessMessage(`Successfully queued ${data.count} sessions for sequential execution!`);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const validCount = previewRows.filter((r) => r.isValid).length;
  const invalidCount = previewRows.filter((r) => !r.isValid).length;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 px-4 sm:px-6 py-6 animate-in fade-in duration-300">
      
      {/* ── HEADER & NAVIGATION TABS ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--layer-2)] transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-[var(--foreground)] tracking-tight">
              Bulk Session Import &amp; Queue
            </h1>
            <p className="text-xs text-[var(--muted)] font-medium mt-0.5">
              Upload CSV/Excel to analyze multiple sessions sequentially in order.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-[var(--layer-2)] p-1 rounded-xl border border-[var(--border)] shrink-0">
          <button
            onClick={() => router.push("/analysis/new")}
            className="px-3 py-1.5 rounded-lg text-xs font-extrabold text-[var(--muted)] hover:text-[var(--foreground)] transition-all"
          >
            Single Audit
          </button>
          <button className="px-3 py-1.5 rounded-lg text-xs font-extrabold bg-white text-[var(--foreground)] shadow-xs border border-[var(--border)]">
            Bulk Import
          </button>
        </div>
      </div>

      {/* ── ERROR & SUCCESS BANNER ── */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-extrabold flex items-center gap-2 shadow-xs">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs font-extrabold flex items-center gap-2 shadow-xs">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* ── AVAILABLE MODULES CHEAT SHEET ── */}
      {availableModules.length > 0 && (
        <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 space-y-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-950 flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-[#E8A020]" /> Available Curriculum Modules In System ({availableModules.length}):
          </span>
          <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
            {availableModules.map((m, idx) => (
              <span key={idx} className="px-2 py-0.5 rounded-md bg-white border border-amber-300 text-amber-950 font-bold text-[10px]">
                {m}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── STEP 1: FILE UPLOAD & CSV PASTE CARD ── */}
      <div className="glass-card p-6 rounded-2xl border border-[var(--border)] bg-white space-y-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="w-5 h-5 text-[#E8A020]" />
            <h2 className="text-sm font-extrabold text-[var(--foreground)] uppercase tracking-wider">
              Step 1: Upload or Paste CSV Data
            </h2>
          </div>

          <button
            onClick={handleDownloadTemplate}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold border border-slate-300 flex items-center gap-1.5 transition-all shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" /> Download CSV Template
          </button>
        </div>

        {/* Upload Dropzone & Text Area Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Dropzone */}
          <div className="border-2 border-dashed border-[var(--border)] rounded-2xl p-6 text-center flex flex-col items-center justify-center space-y-3 bg-[var(--layer-1)] hover:border-[#E8A020] transition-colors relative">
            <Upload className="w-8 h-8 text-[#E8A020] opacity-80" />
            <div>
              <p className="text-xs font-extrabold text-[var(--foreground)]">Upload .CSV or .XLSX file</p>
              <p className="text-[10px] text-[var(--muted)] mt-0.5">Drag and drop or click to browse</p>
            </div>
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>

          {/* Raw Text Area */}
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--muted)] block">
              Or Paste CSV Content Directly
            </label>
            <textarea
              rows={4}
              value={rawInputText}
              onChange={(e) => setRawInputText(e.target.value)}
              placeholder="Expert, Batch, Session, Conducted Date, Video URL, Transcript URL"
              className="w-full liquid-input text-xs font-mono p-3 leading-relaxed"
            />
            <button
              onClick={() => processPreview(rawInputText)}
              disabled={loadingPreview || !rawInputText.trim()}
              className="btn-primary py-2 px-4 text-xs font-extrabold rounded-xl w-full flex items-center justify-center gap-2"
            >
              {loadingPreview ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Parsing &amp; Matching Entities...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Parse &amp; Preview Rows</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── STEP 2: INTERACTIVE PREVIEW & RESOLUTION TABLE ── */}
      {previewRows.length > 0 && (
        <div className="glass-card p-6 rounded-2xl border border-[var(--border)] bg-white space-y-4 shadow-sm animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <ListOrdered className="w-5 h-5 text-[#E8A020]" />
              <h2 className="text-sm font-extrabold text-[var(--foreground)] uppercase tracking-wider">
                Step 2: Validation Results &amp; Queue Preview
              </h2>
            </div>

            {/* VALIDATION SUMMARY CARD */}
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-300 text-xs font-black flex items-center gap-1 shadow-2xs">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> {validCount} Successful
              </span>
              {invalidCount > 0 && (
                <span className="px-3 py-1 rounded-xl bg-rose-50 text-rose-900 border border-rose-300 text-xs font-black flex items-center gap-1 shadow-2xs">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> {invalidCount} Errored
                </span>
              )}
            </div>
          </div>

          {/* Sequential Execution Note Banner */}
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs font-medium flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#E8A020] shrink-0" />
            <span>
              <strong>Sequential Execution Policy:</strong> Valid sessions will be queued and analyzed <strong>strictly one by one in sequence</strong>.
            </span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--layer-2)] border-b border-[var(--border)] text-[10px] font-extrabold uppercase tracking-wider text-[var(--muted)]">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Validation Status</th>
                  <th className="py-2.5 px-3">Expert</th>
                  <th className="py-2.5 px-3">Batch</th>
                  <th className="py-2.5 px-3">Session Note</th>
                  <th className="py-2.5 px-3">Auto Module</th>
                  <th className="py-2.5 px-3">Error Breakdown</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] font-medium">
                {previewRows.map((row, idx) => (
                  <tr key={idx} className={row.isValid ? "hover:bg-slate-50" : "bg-rose-50/60"}>
                    <td className="py-2.5 px-3 font-mono font-bold text-[var(--muted)]">{idx + 1}</td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {row.isValid ? (
                        <span className="inline-flex items-center gap-1 text-emerald-800 font-black text-[10px] bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Ready
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-800 font-black text-[10px] bg-rose-100 px-2 py-0.5 rounded-md border border-rose-300">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Errored
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-[var(--foreground)]">{row.expertName}</td>
                    <td className="py-2.5 px-3 font-bold text-amber-700">{row.batchName}</td>
                    <td className="py-2.5 px-3 font-extrabold text-[var(--foreground)]">{row.sessionNoteName}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200 font-bold text-[10px]">
                        {row.moduleName}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      {row.isValid ? (
                        <span className="text-[10px] text-emerald-700 font-bold">✓ All entities resolved</span>
                      ) : (
                        <span className="text-[11px] text-rose-700 font-black leading-tight block">
                          ❌ {row.validationError}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action Footer */}
          <div className="pt-3 flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--muted)]">
              {invalidCount > 0 ? `${invalidCount} errored rows will be skipped automatically.` : "All rows passed validation!"}
            </span>

            <button
              onClick={handleSubmitBulk}
              disabled={submitting || validCount === 0}
              className="btn-primary py-3 px-8 text-xs font-black tracking-widest uppercase rounded-xl flex items-center gap-2 shadow-md shadow-[#E8A020]/20 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Queueing Sessions...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 text-white fill-white" />
                  <span>Import &amp; Queue {validCount} Valid Sessions</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
