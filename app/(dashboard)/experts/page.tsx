"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Plus as PlusIcon,
  X as XIcon,
  Loader2 as Loader2Icon,
  Edit2 as Edit2Icon,
  Trash2 as Trash2Icon,
  FileSpreadsheet as FileSpreadsheetIcon,
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  ShieldCheck as ShieldCheckIcon,
  ShieldAlert as ShieldAlertIcon,
  UserCheck as UserCheckIcon,
  Users as UsersIcon,
  Sparkles as SparklesIcon,
  BookOpen as BookOpenIcon,
  Check as CheckIcon,
  Lock as LockIcon,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { RawExpertRow, ResolvedExpertRow } from "@/app/api/experts/bulk/route";

interface Expert {
  id: string;
  userId?: string;
  name: string;
  email: string;
  tags: string[];
  bio: string | null;
  user?: { role: "ADMIN" | "TEAM" | "EXPERT" };
  sessions: { id: string }[];
  createdAt: string;
}

export default function ExpertsPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || "ADMIN";
  const isExpertUser = userRole === "EXPERT";

  const [experts, setExperts] = useState<Expert[]>([]);
  const [availableModules, setAvailableModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [flash, setFlash] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Single Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "TEAM" | "EXPERT">("EXPERT");
  const [bio, setBio] = useState("");
  const [selectedModules, setSelectedModules] = useState<string[]>([]);

  // Bulk Upload State
  const [bulkCsvText, setBulkCsvText] = useState("");
  const [bulkPreview, setBulkPreview] = useState<ResolvedExpertRow[]>([]);
  const [submittingBulk, setSubmittingBulk] = useState(false);

  const load = () => {
    if (isExpertUser) return;
    Promise.all([
      fetch("/api/experts").then((r) => r.json()),
      fetch("/api/modules").then((r) => r.json()),
    ])
      .then(([eData, mData]) => {
        if (Array.isArray(eData)) setExperts(eData);
        if (mData?.uniqueModuleNames) setAvailableModules(mData.uniqueModuleNames);
      })
      .catch((err) => console.error("Failed to load experts/modules:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [userRole]);

  // PAGE GUARD: EXPERTS CANNOT VIEW USER DIRECTORY
  if (isExpertUser) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-sm">
          <ShieldAlertIcon className="w-8 h-8" />
        </div>
        <div className="max-w-md space-y-2">
          <h2 className="text-xl font-black text-[var(--foreground)] tracking-tight">Access Restricted</h2>
          <p className="text-xs text-[var(--muted)] font-medium leading-relaxed">
            The User &amp; Access Directory is reserved for Admins and Team members. Expert accounts cannot view system user profiles.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="btn-primary py-2.5 px-6 rounded-xl text-xs font-black uppercase tracking-wider inline-flex items-center gap-2 mt-2 shadow-md shadow-[#E8A020]/20"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const toggleModule = (modName: string) => {
    if (selectedModules.includes(modName)) {
      setSelectedModules(selectedModules.filter((m) => m !== modName));
    } else {
      setSelectedModules([...selectedModules, modName]);
    }
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setRole("EXPERT");
    setBio("");
    setSelectedModules([]);
    setError("");
    setEditingId(null);
  };

  const startEdit = (ex: Expert) => {
    setName(ex.name);
    setEmail(ex.email);
    setRole(ex.user?.role || "EXPERT");
    setBio(ex.bio || "");
    setSelectedModules(ex.tags || []);
    setEditingId(ex.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Move ${name} to the Recycle Bin? (Access archived for 7 days)`)) return;

    try {
      const res = await fetch(`/api/experts/${id}`, { method: "DELETE" });
      if (res.ok) {
        setFlash(`${name} moved to Recycle Bin.`);
        load();
        setTimeout(() => setFlash(""), 5000);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete user.");
      }
    } catch (err) {
      alert("An error occurred while deleting.");
    }
  };

  const handleSubmitSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const url = editingId ? `/api/experts/${editingId}` : "/api/experts";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, role, tags: selectedModules, bio }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save user.");

      setFlash(editingId ? `Updated ${name}` : `Added ${name} as ${role}!`);
      setTimeout(() => setFlash(""), 5000);
      setShowForm(false);
      resetForm();
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Download Expert CSV Template
  const handleDownloadTemplate = () => {
    window.open("/api/experts/template", "_blank");
  };

  // Process Bulk CSV Preview
  const processBulkPreview = async (csvText: string) => {
    setError("");
    const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
    if (lines.length === 0) {
      setBulkPreview([]);
      return;
    }

    const firstLower = lines[0].toLowerCase();
    const hasHeader = firstLower.includes("email") || firstLower.includes("name") || firstLower.includes("role");
    const dataLines = hasHeader ? lines.slice(1) : lines;

    const rawRows: RawExpertRow[] = dataLines.map((line) => {
      const cols = line.match(/(?:[^\s,",]+|"(?:\\.|[^"])*")+/g) || line.split(",");
      const cleanCols = cols.map((c) => c.replace(/^"|"$/g, "").trim());

      return {
        name: cleanCols[0] || "",
        email: cleanCols[1] || "",
        role: (cleanCols[2] || "EXPERT").toUpperCase() as any,
        assignedModules: cleanCols[3] || "",
        tags: cleanCols[3] || "",
        bio: cleanCols[4] || "",
      };
    });

    try {
      const res = await fetch("/api/experts/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "preview", rows: rawRows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to preview users.");
      setBulkPreview(data.preview || []);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Submit Bulk Experts Creation
  const handleSubmitBulk = async () => {
    const validRows = bulkPreview.filter((r) => r.isValid);
    if (validRows.length === 0) return;

    setSubmittingBulk(true);
    try {
      const res = await fetch("/api/experts/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", rows: validRows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to bulk import users.");

      setFlash(`Successfully added ${data.count} user accounts!`);
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

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 px-4 sm:px-6 md:px-8 py-6 animate-in fade-in duration-300">
      
      {/* ── HEADER & ACTIONS ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--foreground)] tracking-tight leading-none">
            User &amp; Access Control Directory
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted)] font-medium mt-1">
            3-Tier Granular Access: <span className="font-bold text-purple-600">Admin</span> (Full System), <span className="font-bold text-blue-600">Team</span> (Analyses &amp; Prep), <span className="font-bold text-emerald-600">Expert</span> (Own Assigned Audits).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowBulkModal(true); setError(""); }}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold border border-slate-300 flex items-center gap-1.5 transition-all shadow-xs"
          >
            <FileSpreadsheetIcon className="w-4 h-4 text-[#E8A020]" /> Bulk CSV Upload
          </button>
          
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="btn-primary py-2 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-[#E8A020]/20"
          >
            <PlusIcon className="w-4 h-4" /> Add User Account
          </button>
        </div>
      </div>

      {/* FLASH MESSAGE */}
      {flash && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-extrabold flex items-center gap-2 shadow-xs">
          <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{flash}</span>
        </div>
      )}

      {/* ── USER ROSTER GRID ── */}
      {loading ? (
        <div className="py-20 text-center space-y-2">
          <Loader2Icon className="w-8 h-8 animate-spin text-[#E8A020] mx-auto" />
          <p className="text-xs font-bold text-[var(--muted)]">Loading user directory...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {experts.map((ex) => {
            const role = ex.user?.role || "EXPERT";
            const isAdmin = role === "ADMIN";
            const isTeam = role === "TEAM";

            return (
              <div key={ex.id} className="glass-card p-5 rounded-2xl border border-[var(--border)] bg-white space-y-3 shadow-xs hover:border-[#E8A020]/40 transition-all flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2 min-w-0 w-full">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-sm text-[var(--foreground)] uppercase shrink-0">
                        {ex.name[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-black text-[var(--foreground)] leading-tight truncate">{ex.name}</h3>
                        <p className="text-[11px] text-[var(--muted)] font-medium truncate">{ex.email}</p>
                      </div>
                    </div>

                    {/* 3-TIER ROLE BADGE */}
                    <div className="shrink-0">
                      {isAdmin ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-300 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                          <ShieldCheckIcon className="w-3 h-3 text-purple-700" /> Admin
                        </span>
                      ) : isTeam ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                          <UsersIcon className="w-3 h-3 text-blue-700" /> Team
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                          <UserCheckIcon className="w-3 h-3 text-emerald-700" /> Expert
                        </span>
                      )}
                    </div>
                  </div>

                  {ex.bio && (
                    <p className="text-xs text-[var(--foreground)] font-medium leading-snug line-clamp-2 italic">
                      "{ex.bio}"
                    </p>
                  )}

                  {/* Assigned Modules */}
                  {ex.tags && ex.tags.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-[var(--muted)] block">
                        Assigned Modules:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {ex.tags.map((modName, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-900 border border-amber-300/60 text-[9px] font-extrabold flex items-center gap-1">
                            <BookOpenIcon className="w-2.5 h-2.5 text-[#E8A020]" /> {modName}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-2 border-t border-[var(--border)] text-xs">
                  <span className="text-[10px] font-bold text-[var(--muted)]">
                    {ex.sessions?.length ?? 0} Sessions Evaluated
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEdit(ex)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                      title="Edit User"
                    >
                      <Edit2Icon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(ex.id, ex.name)}
                      className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                      title="Archive User"
                    >
                      <Trash2Icon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODAL 1: SINGLE USER ADD/EDIT FORM WITH 3-TIER ROLE SELECT ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="glass-card max-w-lg w-full p-6 rounded-2xl bg-white space-y-4 shadow-xl border border-[var(--border)] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h2 className="text-base font-extrabold text-[var(--foreground)]">
                {editingId ? "Edit User Account" : "Add New User Account"}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-1 rounded-lg text-[var(--muted)] hover:bg-slate-100">
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmitSingle} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[var(--muted)] mb-1 uppercase text-[10px]">Full Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full liquid-input"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--muted)] mb-1 uppercase text-[10px]">Email Address *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full liquid-input"
                  required
                />
              </div>

              {/* 3-TIER ROLE SELECTOR */}
              <div>
                <label className="block font-bold text-[var(--muted)] mb-1 uppercase text-[10px]">Access Level (Role) *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full liquid-input font-bold"
                >
                  <option value="EXPERT">Expert Level — View Own Assigned Sessions &amp; Prep Portal</option>
                  <option value="TEAM">Team Level — Run Audits &amp; View Prep (Cannot edit users or sheet URLs)</option>
                  <option value="ADMIN">Admin Level — Full System Access, Edit Users &amp; Sheet Settings</option>
                </select>
              </div>

              {/* MULTI-SELECT ASSIGNED MODULES PICKER */}
              <div>
                <label className="block font-bold text-[var(--muted)] mb-1 uppercase text-[10px]">
                  Assigned Modules (Select Multiple)
                </label>
                <div className="p-3 rounded-xl border border-[var(--border)] bg-slate-50 space-y-2 max-h-40 overflow-y-auto">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {availableModules.map((modName) => {
                      const isSelected = selectedModules.includes(modName);
                      return (
                        <button
                          key={modName}
                          type="button"
                          onClick={() => toggleModule(modName)}
                          className={cn(
                            "px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold flex items-center justify-between transition-all border text-left",
                            isSelected
                              ? "bg-[#E8A020] text-white border-[#E8A020] shadow-2xs"
                              : "bg-white text-[var(--foreground)] border-slate-200 hover:border-slate-300"
                          )}
                        >
                          <span className="truncate">{modName}</span>
                          {isSelected && <CheckIcon className="w-3 h-3 text-white shrink-0 ml-1" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[var(--muted)] mb-1 uppercase text-[10px]">Bio / Profile Note</label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full liquid-input"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary px-5 py-2 rounded-xl font-bold uppercase"
                >
                  {saving ? "Saving..." : editingId ? "Update Account" : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: BULK CSV USER IMPORT ── */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="glass-card max-w-2xl w-full p-6 rounded-2xl bg-white space-y-4 shadow-xl border border-[var(--border)] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheetIcon className="w-5 h-5 text-[#E8A020]" />
                <h2 className="text-base font-extrabold text-[var(--foreground)]">
                  Bulk CSV Import Users (ADMIN, TEAM, EXPERT)
                </h2>
              </div>
              <button onClick={() => setShowBulkModal(false)} className="p-1 rounded-lg text-[var(--muted)] hover:bg-slate-100">
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold">
                {error}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between bg-amber-50 border border-amber-200 p-3 rounded-xl">
                <span className="text-amber-950 font-bold">Format: Name, Email, Role (ADMIN/TEAM/EXPERT), Assigned Modules, Bio</span>
                <button
                  onClick={handleDownloadTemplate}
                  className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-extrabold text-[10px] flex items-center gap-1"
                >
                  <DownloadIcon className="w-3 h-3" /> Template
                </button>
              </div>

              <div>
                <label className="block font-bold text-[var(--muted)] mb-1 uppercase text-[10px]">
                  Paste CSV Lines or Drop CSV File
                </label>
                <textarea
                  rows={4}
                  value={bulkCsvText}
                  onChange={(e) => {
                    setBulkCsvText(e.target.value);
                    processBulkPreview(e.target.value);
                  }}
                  placeholder="Vikram Sharma,vikram@kraftshala.com,ADMIN,Brand; Search; Programmatic,Head of Academics&#10;AgamPreet Kaur,agam@kraftshala.com,TEAM,Ecommerce; Content; Meta,Operations Lead"
                  className="w-full liquid-input font-mono p-3 text-xs"
                />
              </div>

              {/* Bulk Preview Table */}
              {bulkPreview.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="font-extrabold uppercase text-[10px] text-[var(--muted)] block">
                    Parsed Rows ({bulkPreview.filter((r) => r.isValid).length} Valid)
                  </span>
                  <div className="overflow-x-auto rounded-xl border border-[var(--border)] max-h-48 overflow-y-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-100 border-b border-[var(--border)] font-bold text-[10px] uppercase">
                        <tr>
                          <th className="py-2 px-3">Name</th>
                          <th className="py-2 px-3">Email</th>
                          <th className="py-2 px-3">Designated Role</th>
                          <th className="py-2 px-3">Assigned Modules</th>
                          <th className="py-2 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)] font-medium">
                        {bulkPreview.map((row, idx) => (
                          <tr key={idx}>
                            <td className="py-2 px-3 font-bold">{row.name}</td>
                            <td className="py-2 px-3">{row.email}</td>
                            <td className="py-2 px-3 font-bold text-purple-700">{row.parsedRole}</td>
                            <td className="py-2 px-3 font-bold text-amber-700">{row.parsedModules.join(", ") || "None"}</td>
                            <td className="py-2 px-3">
                              {row.isValid ? (
                                <span className="text-emerald-600 font-extrabold">✓ Ready</span>
                              ) : (
                                <span className="text-rose-600 font-extrabold">⚠ {row.validationError}</span>
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
                  disabled={submittingBulk || bulkPreview.filter((r) => r.isValid).length === 0}
                  className="btn-primary px-5 py-2 rounded-xl font-bold uppercase flex items-center gap-1.5"
                >
                  {submittingBulk ? <Loader2Icon className="w-4 h-4 animate-spin" /> : <SparklesIcon className="w-4 h-4" />}
                  <span>Import {bulkPreview.filter((r) => r.isValid).length} Accounts</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
