"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileCheck, Plus, BookOpen, Layers, ExternalLink, Edit3, Trash2, CheckCircle2,
  AlertCircle, HelpCircle, ChevronRight, Scale, Search, Loader2, Sparkles, HelpCircle as QuestionIcon, Check, X, Code, MessageSquare, Zap
} from "lucide-react";
import Link from "next/link";

interface ScoreDescriptor {
  score: number;
  label: string;
  goodLooksLike?: string; // What student would say in normal terms
  badLooksLike?: string;
  exampleQuestion?: string;
}

interface RubricCriterionItem {
  criterion: string;
  scoreDescriptors: ScoreDescriptor[];
}

interface EvaluationConfigItem {
  id: string;
  moduleId: string;
  evaluationType: string;
  name: string;
  description?: string;
  sheetUrl?: string;
  scoreScale: number;
  rubric: RubricCriterionItem[];
  module: {
    id: string;
    name: string;
    course: {
      id: string;
      name: string;
    };
  };
}

export default function EvaluationCriteriaPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal State for New/Edit Config
  const [modalOpen, setModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<any | null>(null);

  // Form State
  const [courseId, setCourseId] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [evaluationType, setEvaluationType] = useState("VIVA");
  const [name, setName] = useState("Programmatic Viva Audit");
  const [description, setDescription] = useState("");
  const [sheetUrl, setSheetUrl] = useState("https://docs.google.com/spreadsheets/d/1EZVHViY-Ia3Z-Yv0dif5tcDXHA5-5CF1Ko73dQ7Bg64/export?format=csv");
  const [scoreScale, setScoreScale] = useState(4);
  const [advancedJsonMode, setAdvancedJsonMode] = useState(false);
  const [jsonText, setJsonText] = useState("");

  // Default Programmatic Rubric preset matching user's exact specification
  const PROGRAMMATIC_DSP_PRESET: RubricCriterionItem[] = [
    {
      criterion: "Q1: What is a DSP (Demand Side Platform)?",
      scoreDescriptors: [
        {
          score: 0,
          label: "No Answer",
          exampleQuestion: "What is a DSP?",
          goodLooksLike: "Did not answer, said nothing, or knows nothing beyond mugged up keywords."
        },
        {
          score: 1,
          label: "Said Something",
          exampleQuestion: "What is a DSP?",
          goodLooksLike: "Says 'some platform' or basic generic mention without details."
        },
        {
          score: 2,
          label: "Partial Answer (No Examples)",
          exampleQuestion: "What is a DSP?",
          goodLooksLike: "Says 'demand side platform used to buy'. Correct basic definition but lacks examples and DSP mechanics."
        },
        {
          score: 3,
          label: "Expected Answer (Minor Examples)",
          exampleQuestion: "What is a DSP and who uses it?",
          goodLooksLike: "Says 'demand side platform used by advertisers to run ads on different inventory'. Expected understanding with minor examples."
        },
        {
          score: 4,
          label: "Complete Understanding & Examples",
          exampleQuestion: "What is a DSP, give examples and real-world brand scenarios?",
          goodLooksLike: "Says 'demand side platform used by advertisers to run ads on different inventory, gives examples like DV360 and Amazon DSP. Explains real-world brand scenarios e.g. if Nike wants to buy inventory, they use an advertiser-side DSP'."
        }
      ]
    }
  ];

  // Visual Rubric Criteria State
  const [rubricList, setRubricList] = useState<RubricCriterionItem[]>(PROGRAMMATIC_DSP_PRESET);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchData = async () => {
    try {
      const res = await fetch("/api/courses");
      if (res.ok) {
        const data = await res.json();
        setCourses(data);
      }
    } catch (err) {
      console.error("Failed to fetch courses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Extract all configs with full course/module metadata
  const allConfigs: EvaluationConfigItem[] = [];
  courses.forEach((course) => {
    (course.modules || []).forEach((mod: any) => {
      (mod.evaluationConfigs || []).forEach((cfg: any) => {
        allConfigs.push({
          ...cfg,
          module: {
            id: mod.id,
            name: mod.name,
            course: {
              id: course.id,
              name: course.name,
            },
          },
        });
      });
    });
  });

  const filteredConfigs = allConfigs.filter((c) => {
    return (
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.module.name.toLowerCase().includes(search.toLowerCase()) ||
      c.module.course.name.toLowerCase().includes(search.toLowerCase())
    );
  });

  const generateDefaultDescriptors = (scale: number): ScoreDescriptor[] => {
    const defaultTemplates: Record<number, { label: string; goodLooksLike: string }> = {
      0: { label: "No Answer", goodLooksLike: "Did not answer or knows nothing." },
      1: { label: "Said Something", goodLooksLike: "Says something basic." },
      2: { label: "Partial Answer (No Examples)", goodLooksLike: "Correct basic definition but lacks examples." },
      3: { label: "Expected Answer", goodLooksLike: "Expected answer with basic understanding and minor examples." },
      4: { label: "Complete Mastery & Examples", goodLooksLike: "Complete depth of understanding with concrete tool and brand examples." },
    };

    const descriptors: ScoreDescriptor[] = [];
    for (let i = 0; i <= scale; i++) {
      const tmpl = defaultTemplates[i] || { label: `Level ${i}`, goodLooksLike: `Verbal criteria for ${i} marks` };
      descriptors.push({
        score: i,
        label: tmpl.label,
        exampleQuestion: "",
        goodLooksLike: tmpl.goodLooksLike,
        badLooksLike: "",
      });
    }
    return descriptors;
  };

  const openCreateModal = () => {
    setEditingConfig(null);
    const firstCourse = courses[0];
    const firstModule = firstCourse?.modules?.[0];

    setCourseId(firstCourse?.id || "");
    setModuleId(firstModule?.id || "");
    setEvaluationType("VIVA");
    setName("Programmatic Viva Audit");
    setDescription("Standard non-technical rubric for programmatic evaluation");
    setSheetUrl("https://docs.google.com/spreadsheets/d/1EZVHViY-Ia3Z-Yv0dif5tcDXHA5-5CF1Ko73dQ7Bg64/export?format=csv");
    setScoreScale(4);
    setAdvancedJsonMode(false);
    setRubricList(PROGRAMMATIC_DSP_PRESET);
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (cfg: EvaluationConfigItem) => {
    setEditingConfig(cfg);
    setCourseId(cfg.module.course.id);
    setModuleId(cfg.moduleId);
    setEvaluationType(cfg.evaluationType);
    setName(cfg.name);
    setDescription(cfg.description || "");
    setSheetUrl(cfg.sheetUrl || "");
    setScoreScale(cfg.scoreScale);
    setRubricList(cfg.rubric || []);
    setJsonText(JSON.stringify(cfg.rubric || [], null, 2));
    setAdvancedJsonMode(false);
    setFormError("");
    setModalOpen(true);
  };

  const loadProgrammaticPreset = () => {
    setRubricList(PROGRAMMATIC_DSP_PRESET);
    setName("Programmatic Viva Audit");
    setScoreScale(4);
  };

  const addCriterion = () => {
    setRubricList([
      ...rubricList,
      {
        criterion: `Criterion ${rubricList.length + 1}`,
        scoreDescriptors: generateDefaultDescriptors(scoreScale),
      },
    ]);
  };

  const removeCriterion = (index: number) => {
    if (rubricList.length === 1) return;
    setRubricList(rubricList.filter((_, i) => i !== index));
  };

  const updateCriterionName = (index: number, val: string) => {
    const next = [...rubricList];
    next[index].criterion = val;
    setRubricList(next);
  };

  const updateDescriptorField = (
    cIndex: number,
    dIndex: number,
    field: keyof ScoreDescriptor,
    val: string
  ) => {
    const next = [...rubricList];
    next[cIndex].scoreDescriptors[dIndex] = {
      ...next[cIndex].scoreDescriptors[dIndex],
      [field]: val,
    };
    setRubricList(next);
  };

  const handleScoreScaleChange = (newScale: number) => {
    setScoreScale(newScale);
    setRubricList((prev) =>
      prev.map((c) => {
        const existing = c.scoreDescriptors || [];
        const nextDescriptors: ScoreDescriptor[] = [];
        const defaultTmpls = generateDefaultDescriptors(newScale);
        for (let i = 0; i <= newScale; i++) {
          const match = existing.find((d) => d.score === i);
          if (match) {
            nextDescriptors.push(match);
          } else {
            nextDescriptors.push(defaultTmpls[i]);
          }
        }
        return { ...c, scoreDescriptors: nextDescriptors };
      })
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    if (!sheetUrl.trim()) {
      setFormError("Google Sheet CSV Link is MANDATORY. Please provide the published CSV export link for the module evaluation sheet.");
      setSubmitting(false);
      return;
    }

    let finalRubric = rubricList;
    if (advancedJsonMode) {
      try {
        finalRubric = JSON.parse(jsonText);
      } catch {
        setFormError("Invalid JSON format.");
        setSubmitting(false);
        return;
      }
    }

    try {
      const url = editingConfig
        ? `/api/modules/${moduleId}/evaluation-configs/${editingConfig.id}`
        : `/api/modules/${moduleId}/evaluation-configs`;

      const method = editingConfig ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evaluationType,
          name,
          description,
          sheetUrl,
          scoreScale: Number(scoreScale),
          rubric: finalRubric,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save evaluation config.");
      }

      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      setFormError(err.message || "Failed to save evaluation criteria.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (cfg: EvaluationConfigItem) => {
    if (!confirm(`Are you sure you want to delete "${cfg.name}"?`)) return;
    try {
      const res = await fetch(`/api/modules/${cfg.moduleId}/evaluation-configs/${cfg.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error("Failed to delete config:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-40">
        <Loader2 className="w-10 h-10 text-brand-orange animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-brand-orange/10 border border-brand-orange/20 text-brand-orange">
              <FileCheck className="w-5 h-5" />
            </span>
            <h1 className="text-3xl font-black text-[var(--foreground)] tracking-tight">Evaluation Criteria</h1>
          </div>
          <p className="text-xs text-[var(--muted)] font-medium">
            User-friendly visual rubric builder for marking schemes, verbal response contexts, and sample answers
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="btn-primary py-2.5 px-6 rounded-xl text-xs font-black uppercase tracking-wider inline-flex items-center gap-2 shadow-lg shadow-[#E8A020]/20"
        >
          <Plus className="w-4 h-4" /> Add Evaluation Criteria
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="glass-card p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[var(--muted)]" />
          <input
            type="text"
            placeholder="Search by rubric name, module, or course..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-[var(--layer-1)] border border-[var(--border)] focus:outline-none focus:border-brand-orange text-[var(--foreground)]"
          />
        </div>
      </div>

      {/* Grid of Evaluation Criteria */}
      {filteredConfigs.length === 0 ? (
        <div className="glass-card p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 border border-[var(--border)] flex items-center justify-center text-[var(--muted)] mx-auto">
            <FileCheck className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-lg font-bold text-[var(--foreground)]">No Evaluation Criteria Configured</h3>
            <p className="text-xs text-[var(--muted)]">
              Create an evaluation rubric for your modules using our visual rubric builder.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="btn-primary py-2 px-5 rounded-xl text-xs font-bold inline-flex items-center gap-2 mt-2"
          >
            <Plus className="w-4 h-4" /> Set Up First Rubric
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredConfigs.map((cfg) => (
            <motion.div
              key={cfg.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 flex flex-col justify-between space-y-5 hover:border-brand-orange/40 transition-all shadow-md bg-white"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-brand-orange/10 text-brand-orange border border-brand-orange/20">
                      {cfg.evaluationType}
                    </span>
                    <h3 className="text-lg font-bold text-[var(--foreground)] mt-2">{cfg.name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(cfg)}
                      className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      title="Edit Criteria"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(cfg)}
                      className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                      title="Delete Criteria"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--muted)] font-medium">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-brand-orange" />
                    {cfg.module.course.name}
                  </span>
                  <ChevronRight className="w-3 h-3 text-slate-300" />
                  <span className="flex items-center gap-1.5 font-bold text-[var(--foreground)]">
                    <Layers className="w-3.5 h-3.5 text-brand-orange" />
                    {cfg.module.name}
                  </span>
                </div>

                {cfg.description && (
                  <p className="text-xs text-[var(--muted-foreground)] italic leading-relaxed">
                    "{cfg.description}"
                  </p>
                )}

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-[var(--foreground)] flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-brand-orange" />
                    Max Score: {cfg.scoreScale} Marks
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-[var(--foreground)]">
                    {cfg.rubric?.length || 0} Rubric Criteria
                  </span>
                </div>

                {cfg.sheetUrl && (
                  <a
                    href={cfg.sheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-orange hover:underline pt-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> View Mandatory Google Sheet CSV
                  </a>
                )}
              </div>

              {/* Rubric Preview snippet */}
              {cfg.rubric?.length > 0 && (
                <div className="border-t border-[var(--border)] pt-4 space-y-2">
                  <p className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">
                    Rubric Criteria Breakdown
                  </p>
                  <div className="space-y-2">
                    {cfg.rubric.map((r: any, idx: number) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                        <p className="text-xs font-bold text-slate-900">{r.criterion}</p>
                        <div className="flex flex-wrap gap-1">
                          {(r.scoreDescriptors || []).map((d: any) => (
                            <span key={d.score} className="px-2 py-0.5 rounded text-[9px] font-bold bg-white border border-slate-300 text-slate-700">
                              {d.score}: {d.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Visual Non-Technical Rubric Creator Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card w-full max-w-4xl p-6 sm:p-8 space-y-6 bg-white dark:bg-slate-900 border border-[var(--border)] shadow-2xl max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-black text-[var(--foreground)] flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-brand-orange" />
                    {editingConfig ? "Edit Evaluation Criteria" : "Visual Rubric Creator"}
                  </h3>
                  <button
                    type="button"
                    onClick={loadProgrammaticPreset}
                    className="px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-violet-100 text-violet-800 border border-violet-300 hover:bg-violet-200 transition-colors flex items-center gap-1"
                  >
                    <Zap className="w-3 h-3" /> Load Programmatic Preset
                  </button>
                </div>
                <p className="text-xs text-[var(--muted)] mt-1">
                  Non-technical criteria builder — define verbal student responses for each mark level (0, 1, 2, 3, 4)
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
              >
                ✕ Close
              </button>
            </div>

            {formError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {formError}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-6">
              {/* Basic Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/80 p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-[11px] font-black text-[var(--muted)] uppercase tracking-wider mb-1">
                    1. Select Target Module
                  </label>
                  <select
                    value={moduleId}
                    onChange={(e) => setModuleId(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs rounded-xl bg-white border border-slate-300 text-[var(--foreground)] focus:outline-none focus:border-brand-orange font-medium"
                    required
                  >
                    {courses.flatMap((c) =>
                      (c.modules || []).map((m: any) => (
                        <option key={m.id} value={m.id}>
                          {c.name} → {m.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-[var(--muted)] uppercase tracking-wider mb-1">
                    2. Evaluation Scheme Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Programmatic Viva Audit"
                    className="w-full px-3 py-2.5 text-xs rounded-xl bg-white border border-slate-300 text-[var(--foreground)] focus:outline-none focus:border-brand-orange font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-[var(--muted)] uppercase tracking-wider mb-1">
                    3. Max Score Scale (Per Criterion)
                  </label>
                  <select
                    value={scoreScale}
                    onChange={(e) => handleScoreScaleChange(Number(e.target.value))}
                    className="w-full px-3 py-2.5 text-xs rounded-xl bg-white border border-slate-300 text-[var(--foreground)] focus:outline-none focus:border-brand-orange font-medium"
                  >
                    <option value={3}>0 – 3 Marks (4 Scale Levels)</option>
                    <option value={4}>0 – 4 Marks (5 Scale Levels - Standard)</option>
                    <option value={5}>0 – 5 Marks (6 Scale Levels)</option>
                    <option value={10}>0 – 10 Marks (11 Scale Levels)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-[var(--muted)] uppercase tracking-wider mb-1">
                    4. Evaluation Type
                  </label>
                  <input
                    type="text"
                    value={evaluationType}
                    onChange={(e) => setEvaluationType(e.target.value)}
                    placeholder="VIVA, INTERVIEW, ASSIGNMENT"
                    className="w-full px-3 py-2.5 text-xs rounded-xl bg-white border border-slate-300 text-[var(--foreground)] focus:outline-none focus:border-brand-orange font-medium"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-black text-brand-orange uppercase tracking-wider mb-1">
                    Google Sheet CSV Export Link * (MANDATORY for evaluation check)
                  </label>
                  <input
                    type="url"
                    value={sheetUrl}
                    onChange={(e) => setSheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/{ID}/export?format=csv"
                    className="w-full px-3 py-2.5 text-xs rounded-xl bg-white border border-slate-300 text-[var(--foreground)] focus:outline-none focus:border-brand-orange"
                    required
                  />
                  <p className="text-[10px] text-slate-500 font-medium mt-1">
                    ⚠️ <strong>Mandatory:</strong> Provide the published CSV export link. The AI will ALWAYS fetch this sheet to match student scores during evaluation runs.
                  </p>
                </div>
              </div>

              {/* Toggle Advanced JSON Mode */}
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                <h4 className="text-sm font-black text-[var(--foreground)] uppercase tracking-wider flex items-center gap-2">
                  <Scale className="w-4 h-4 text-brand-orange" />
                  Criteria & Verbal Response Descriptors ({rubricList.length} Criteria)
                </h4>

                <button
                  type="button"
                  onClick={() => {
                    if (!advancedJsonMode) setJsonText(JSON.stringify(rubricList, null, 2));
                    setAdvancedJsonMode(!advancedJsonMode);
                  }}
                  className="text-xs font-bold text-slate-600 hover:text-brand-orange flex items-center gap-1.5"
                >
                  <Code className="w-3.5 h-3.5" />
                  {advancedJsonMode ? "Switch to Visual Builder" : "Advanced JSON Mode"}
                </button>
              </div>

              {/* Advanced JSON View */}
              {advancedJsonMode ? (
                <div>
                  <textarea
                    rows={12}
                    value={jsonText}
                    onChange={(e) => setJsonText(e.target.value)}
                    className="w-full p-4 text-xs font-mono rounded-2xl bg-slate-900 text-emerald-400 border border-slate-800 focus:outline-none"
                  />
                </div>
              ) : (
                /* Visual Builder Mode */
                <div className="space-y-6">
                  {rubricList.map((c, cIndex) => (
                    <div
                      key={cIndex}
                      className="p-5 rounded-2xl border-2 border-slate-200 bg-white space-y-5 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1">
                          <label className="block text-[10px] font-black text-brand-orange uppercase tracking-wider mb-1">
                            Criterion #{cIndex + 1} Name / Title (e.g. Q1: What is a DSP?)
                          </label>
                          <input
                            type="text"
                            value={c.criterion}
                            onChange={(e) => updateCriterionName(cIndex, e.target.value)}
                            placeholder="e.g. Q1: What is a DSP?"
                            className="w-full px-3 py-2 text-sm font-bold rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-brand-orange"
                            required
                          />
                        </div>
                        {rubricList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeCriterion(cIndex)}
                            className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors mt-4"
                            title="Remove Criterion"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Score Level Cards (0 to ScoreScale) */}
                      <div className="space-y-4 pt-2">
                        <p className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <MessageSquare className="w-4 h-4 text-brand-orange" />
                          What Students Say For Each Mark (Scores 0 to {scoreScale})
                        </p>

                        <div className="grid grid-cols-1 gap-4">
                          {c.scoreDescriptors.map((d, dIndex) => (
                            <div
                              key={d.score}
                              className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <span className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                                    {d.score}
                                  </span>
                                  <input
                                    type="text"
                                    value={d.label}
                                    onChange={(e) =>
                                      updateDescriptorField(cIndex, dIndex, "label", e.target.value)
                                    }
                                    placeholder="e.g. Partial Answer (No Examples) / Complete Mastery"
                                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-white border border-slate-300 w-64"
                                  />
                                </div>

                                <div className="flex-1 min-w-0">
                                  <input
                                    type="text"
                                    value={d.exampleQuestion || ""}
                                    onChange={(e) =>
                                      updateDescriptorField(cIndex, dIndex, "exampleQuestion", e.target.value)
                                    }
                                    placeholder="Question Asked (e.g. What is a DSP?)"
                                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-white border border-slate-200 text-slate-600 italic"
                                  />
                                </div>
                              </div>

                              {/* Main Verbal Context Field */}
                              <div>
                                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                                  <MessageSquare className="w-3 h-3 text-brand-orange" />
                                  What Candidate Would Say in Normal Terms (Verbal Context for {d.score} Marks) *
                                </label>
                                <textarea
                                  rows={2}
                                  value={d.goodLooksLike || ""}
                                  onChange={(e) =>
                                    updateDescriptorField(cIndex, dIndex, "goodLooksLike", e.target.value)
                                  }
                                  placeholder={
                                    d.score === 0 ? "says nothing / no answer" :
                                    d.score === 1 ? "says some platform" :
                                    d.score === 2 ? "says demand side platform used to buy (lacks examples)" :
                                    d.score === 3 ? "says demand side platform used by advertisers to run ads on different inventory" :
                                    "says demand side platform used by advertisers to run ads on inventory, gives examples like DV360, Amazon DSP, and brand scenarios like Nike"
                                  }
                                  className="w-full p-2.5 text-xs rounded-xl bg-white border border-slate-300 font-medium leading-relaxed focus:border-brand-orange focus:outline-none"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addCriterion}
                    className="w-full py-3 rounded-2xl border-2 border-dashed border-brand-orange/40 text-brand-orange font-black text-xs uppercase tracking-wider hover:bg-brand-orange/5 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add Another Criterion
                  </button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 border-t border-[var(--border)] pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary py-2.5 px-7 rounded-xl text-xs font-bold flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editingConfig ? "Update Evaluation Criteria" : "Save Evaluation Criteria"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
