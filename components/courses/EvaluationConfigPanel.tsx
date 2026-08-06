'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, ChevronDown, ChevronUp, Save, Trash2, Loader2,
  Link2, ClipboardList, BookOpen, Award, Edit2, X, Check,
  GripVertical, FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Types ─────────────────────────────────────────────────────────────────────

export type EvaluationType = 'VIVA' | 'INTERVIEW';

export interface ScoreDescriptor {
  score: number;
  label: string;
  goodLooksLike: string;
  badLooksLike: string;
  exampleQuestion: string;
}

export interface RubricCriterion {
  criterion: string;
  scoreDescriptors: ScoreDescriptor[];
}

export interface EvaluationConfig {
  id: string;
  moduleId: string;
  evaluationType: EvaluationType;
  name: string;
  description?: string;
  sheetUrl?: string;
  scoreScale: number;
  rubric: RubricCriterion[];
  createdAt: string;
  updatedAt: string;
  _count?: { analysisSessions: number };
}

const EVAL_TYPE_LABELS: Record<EvaluationType, string> = {
  VIVA: 'Viva',
  INTERVIEW: 'Interview',
};

const EVAL_TYPE_COLORS: Record<EvaluationType, string> = {
  VIVA: 'bg-violet-100 text-violet-800 border-violet-300',
  INTERVIEW: 'bg-blue-100 text-blue-800 border-blue-300',
};

// ── Score label derivation ────────────────────────────────────────────────────

function getScoreLabel(score: number, scale: number): string {
  if (scale <= 4) {
    const labels: Record<number, string> = { 4: 'Excellent', 3: 'Good', 2: 'Average', 1: 'Poor', 0: 'Not Attempted' };
    return labels[score] ?? `Score ${score}`;
  }
  if (scale <= 5) {
    const labels: Record<number, string> = { 5: 'Exceptional', 4: 'Excellent', 3: 'Good', 2: 'Average', 1: 'Poor', 0: 'Not Attempted' };
    return labels[score] ?? `Score ${score}`;
  }
  // Generic for larger scales
  const pct = score / scale;
  if (pct >= 0.9) return 'Outstanding';
  if (pct >= 0.75) return 'Excellent';
  if (pct >= 0.5) return 'Good';
  if (pct >= 0.25) return 'Average';
  return 'Poor';
}

function buildDefaultDescriptors(scale: number): ScoreDescriptor[] {
  return Array.from({ length: scale + 1 }, (_, i) => ({
    score: scale - i,
    label: getScoreLabel(scale - i, scale),
    goodLooksLike: '',
    badLooksLike: '',
    exampleQuestion: '',
  }));
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-violet-50 border border-violet-200 flex items-center justify-center mb-4">
        <ClipboardList className="w-8 h-8 text-violet-500" />
      </div>
      <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">No Evaluation Types Yet</h3>
      <p className="text-sm text-[var(--muted)] max-w-xs mb-6">
        Configure Viva or Interview rubrics for this module. The AI will use these to audit mark quality.
      </p>
      <button onClick={onAdd} className="btn-primary px-6 py-2.5 text-sm flex items-center gap-2">
        <Plus className="w-4 h-4" /> Add Evaluation Type
      </button>
    </div>
  );
}

// ── Rubric criterion editor ───────────────────────────────────────────────────

function CriterionEditor({
  criterion,
  scale,
  onChange,
  onRemove,
}: {
  criterion: RubricCriterion;
  scale: number;
  onChange: (c: RubricCriterion) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(true);

  const updateDescriptor = (score: number, field: keyof ScoreDescriptor, value: string | number) => {
    const next = criterion.scoreDescriptors.map((d) =>
      d.score === score ? { ...d, [field]: value } : d
    );
    onChange({ ...criterion, scoreDescriptors: next });
  };

  return (
    <div className="border border-[var(--border)] rounded-2xl overflow-hidden bg-white">
      <div className="flex items-center gap-3 px-4 py-3 bg-[var(--layer-2)] border-b border-[var(--border)]">
        <GripVertical className="w-4 h-4 text-[var(--muted)] shrink-0" />
        <input
          type="text"
          value={criterion.criterion}
          onChange={(e) => onChange({ ...criterion, criterion: e.target.value })}
          placeholder="Criterion name (e.g. Conceptual Understanding)"
          className="flex-1 bg-transparent text-sm font-bold text-[var(--foreground)] placeholder-[var(--muted)] outline-none border-none"
        />
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="p-1 rounded-lg hover:bg-[var(--border)] text-[var(--muted)] transition-colors"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="p-1 rounded-lg hover:bg-red-50 text-[var(--muted)] hover:text-red-500 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {criterion.scoreDescriptors.map((desc) => (
                <div key={desc.score} className="rounded-xl border border-[var(--border)] overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 bg-[var(--layer-2)] border-b border-[var(--border)]">
                    <span className="w-6 h-6 rounded-lg bg-[var(--foreground)] text-white text-[11px] font-black flex items-center justify-center shrink-0">
                      {desc.score}
                    </span>
                    <span className="text-xs font-bold text-[var(--foreground)]">{desc.label}</span>
                    <span className="text-[10px] text-[var(--muted)] ml-auto">Score {desc.score}/{scale}</span>
                  </div>
                  <div className="p-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-1">
                        Good looks like <span className="text-[var(--muted)] normal-case font-normal">(optional)</span>
                      </label>
                      <textarea
                        value={desc.goodLooksLike}
                        onChange={(e) => updateDescriptor(desc.score, 'goodLooksLike', e.target.value)}
                        placeholder="Describe what a student at this level does well..."
                        rows={2}
                        className="w-full text-xs rounded-lg border border-[var(--border)] bg-white px-2.5 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-300 placeholder-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-red-700 uppercase tracking-widest mb-1">
                        Bad looks like <span className="text-[var(--muted)] normal-case font-normal">(optional)</span>
                      </label>
                      <textarea
                        value={desc.badLooksLike}
                        onChange={(e) => updateDescriptor(desc.score, 'badLooksLike', e.target.value)}
                        placeholder="Describe what a student at this level struggles with..."
                        rows={2}
                        className="w-full text-xs rounded-lg border border-[var(--border)] bg-white px-2.5 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-red-300 placeholder-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-blue-700 uppercase tracking-widest mb-1">
                        Example Question <span className="text-[var(--muted)] normal-case font-normal">(optional)</span>
                      </label>
                      <textarea
                        value={desc.exampleQuestion}
                        onChange={(e) => updateDescriptor(desc.score, 'exampleQuestion', e.target.value)}
                        placeholder="Typical question asked to a student at this level..."
                        rows={2}
                        className="w-full text-xs rounded-lg border border-[var(--border)] bg-white px-2.5 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 placeholder-slate-300"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Config form (create / edit) ───────────────────────────────────────────────

function ConfigForm({
  moduleId,
  initial,
  onSave,
  onCancel,
}: {
  moduleId: string;
  initial?: EvaluationConfig;
  onSave: (config: EvaluationConfig) => void;
  onCancel: () => void;
}) {
  const isEdit = !!initial;

  const [evalType, setEvalType] = useState<EvaluationType>(initial?.evaluationType ?? 'VIVA');
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [sheetUrl, setSheetUrl] = useState(initial?.sheetUrl ?? '');
  const [scoreScale, setScoreScale] = useState(initial?.scoreScale ?? 4);
  const [rubric, setRubric] = useState<RubricCriterion[]>(initial?.rubric ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const addCriterion = () => {
    setRubric([
      ...rubric,
      {
        criterion: '',
        scoreDescriptors: buildDefaultDescriptors(scoreScale),
      },
    ]);
  };

  const updateCriterion = (idx: number, c: RubricCriterion) => {
    setRubric(rubric.map((r, i) => (i === idx ? c : r)));
  };

  const removeCriterion = (idx: number) => {
    setRubric(rubric.filter((_, i) => i !== idx));
  };

  // Rebuild descriptors when scale changes
  const handleScaleChange = (newScale: number) => {
    setScoreScale(newScale);
    setRubric(
      rubric.map((c) => ({
        ...c,
        scoreDescriptors: buildDefaultDescriptors(newScale),
      }))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) { setError('Name is required.'); return; }
    if (rubric.some((c) => !c.criterion.trim())) { setError('All criterion names must be filled in.'); return; }

    setSaving(true);
    try {
      const url = isEdit
        ? `/api/modules/${moduleId}/evaluation-configs/${initial!.id}`
        : `/api/modules/${moduleId}/evaluation-configs`;
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evaluationType: evalType,
          name: name.trim(),
          description: description.trim() || undefined,
          sheetUrl: sheetUrl.trim() || undefined,
          scoreScale,
          rubric,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }

      const saved = await res.json();
      onSave(saved);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Step 1: Basic Info */}
      <div className="glass-card p-6 space-y-5">
        <h3 className="text-sm font-extrabold text-[var(--foreground)] uppercase tracking-widest flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-[var(--foreground)] text-white text-[10px] font-black flex items-center justify-center">1</span>
          Basic Info
        </h3>

        {/* Evaluation Type */}
        <div>
          <label className="block text-[11px] font-bold text-[var(--muted-foreground)] tracking-widest uppercase mb-2">
            Evaluation Type *
          </label>
          <div className="flex gap-2">
            {(Object.keys(EVAL_TYPE_LABELS) as EvaluationType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setEvalType(t)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                  evalType === t
                    ? 'bg-[var(--foreground)] text-white border-[var(--foreground)] shadow-md'
                    : 'bg-white text-[var(--muted)] border-[var(--border)] hover:border-[var(--foreground)]'
                }`}
              >
                {EVAL_TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold text-[var(--muted-foreground)] tracking-widest uppercase mb-2">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`e.g. ${evalType === 'VIVA' ? 'Programmatic Viva' : 'Technical Interview'}`}
              className="w-full liquid-input"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[var(--muted-foreground)] tracking-widest uppercase mb-2">
              Score Scale *
            </label>
            <select
              value={scoreScale}
              onChange={(e) => handleScaleChange(Number(e.target.value))}
              className="w-full liquid-input appearance-none"
            >
              {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((s) => (
                <option key={s} value={s}>
                  {s} points (0 – {s})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[var(--muted-foreground)] tracking-widest uppercase mb-2">
              Description <span className="text-[var(--muted)] normal-case font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description..."
              className="w-full liquid-input"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold text-[var(--muted-foreground)] tracking-widest uppercase mb-2 flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Google Sheet URL <span className="text-[var(--muted)] normal-case font-normal">(CSV export link)</span>
            </label>
            <input
              type="url"
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/…/export?format=csv"
              className="w-full liquid-input font-mono text-xs"
            />
            <p className="text-[11px] text-[var(--muted)] mt-1.5">
              💡 In Google Sheets: <strong>File → Share → Publish to web → CSV</strong>. This sheet persists and can be updated anytime.
            </p>
          </div>
        </div>
      </div>

      {/* Step 2: Rubric */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-[var(--foreground)] uppercase tracking-widest flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[var(--foreground)] text-white text-[10px] font-black flex items-center justify-center">2</span>
            Rubric Criteria
          </h3>
          <span className="text-[11px] text-[var(--muted)] font-medium">Scale: 0 – {scoreScale}</span>
        </div>

        {rubric.length === 0 && (
          <div className="text-center py-8 text-sm text-[var(--muted)] border-2 border-dashed border-[var(--border)] rounded-2xl">
            No criteria yet. Add at least one.
          </div>
        )}

        <div className="space-y-3">
          {rubric.map((c, idx) => (
            <CriterionEditor
              key={idx}
              criterion={c}
              scale={scoreScale}
              onChange={(updated) => updateCriterion(idx, updated)}
              onRemove={() => removeCriterion(idx)}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={addCriterion}
          className="w-full py-3 rounded-xl border-2 border-dashed border-[var(--border)] text-xs font-bold text-[var(--muted)] hover:border-brand-orange hover:text-brand-orange transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Criterion
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">
          {error}
        </div>
      )}

      <div className="flex gap-3 justify-end pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 rounded-xl border border-[var(--border)] text-sm font-bold text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="btn-primary px-6 py-2.5 text-sm flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isEdit ? 'Save Changes' : 'Create Config'}
        </button>
      </div>
    </form>
  );
}

// ── Config card ───────────────────────────────────────────────────────────────

function ConfigCard({
  config,
  onEdit,
  onDelete,
}: {
  config: EvaluationConfig;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete "${config.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    await fetch(`/api/modules/${config.moduleId}/evaluation-configs/${config.id}`, { method: 'DELETE' });
    onDelete();
  };

  return (
    <div className="glass-card p-5 space-y-3 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${EVAL_TYPE_COLORS[config.evaluationType]}`}>
              {EVAL_TYPE_LABELS[config.evaluationType]}
            </span>
            <h4 className="text-sm font-bold text-[var(--foreground)] truncate">{config.name}</h4>
          </div>
          {config.description && (
            <p className="text-xs text-[var(--muted)] line-clamp-1">{config.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg hover:bg-[var(--layer-2)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            title="Edit"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-1.5 rounded-lg hover:bg-red-50 text-[var(--muted)] hover:text-red-500 transition-colors"
            title="Delete"
          >
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 text-[11px] text-[var(--muted)] font-medium">
        <span className="flex items-center gap-1">
          <Award className="w-3 h-3" /> Scale: 0 – {config.scoreScale}
        </span>
        <span className="flex items-center gap-1">
          <ClipboardList className="w-3 h-3" /> {config.rubric.length} criteria
        </span>
        <span className="flex items-center gap-1">
          <BookOpen className="w-3 h-3" /> {config._count?.analysisSessions ?? 0} analyses
        </span>
        {config.sheetUrl && (
          <a
            href={config.sheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-brand-orange hover:underline"
            title="Open sheet"
          >
            <Link2 className="w-3 h-3" /> Sheet
          </a>
        )}
      </div>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

export function EvaluationConfigPanel({ moduleId, isAdmin }: { moduleId: string; isAdmin: boolean }) {
  const [configs, setConfigs] = useState<EvaluationConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState<null | 'new' | EvaluationConfig>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/modules/${moduleId}/evaluation-configs`);
    if (res.ok) setConfigs(await res.json());
    setLoading(false);
  }, [moduleId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="flex justify-center py-12">
      <Loader2 className="w-8 h-8 text-brand-orange animate-spin" />
    </div>
  );

  if (showForm) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-[var(--foreground)] uppercase tracking-widest">
            {showForm === 'new' ? 'New Evaluation Type' : `Edit: ${(showForm as EvaluationConfig).name}`}
          </h3>
          <button
            onClick={() => setShowForm(null)}
            className="p-1.5 rounded-lg hover:bg-[var(--layer-2)] text-[var(--muted)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <ConfigForm
          moduleId={moduleId}
          initial={showForm === 'new' ? undefined : (showForm as EvaluationConfig)}
          onSave={(saved) => {
            load();
            setShowForm(null);
          }}
          onCancel={() => setShowForm(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[var(--foreground)]">Evaluation Types</h3>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            Configure rubrics for Viva and Interview evaluations. The AI uses these to audit mark quality.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowForm('new')}
            className="btn-primary px-4 py-2 text-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Add Type
          </button>
        )}
      </div>

      {configs.length === 0 ? (
        isAdmin ? <EmptyState onAdd={() => setShowForm('new')} /> : (
          <p className="text-center py-10 text-sm text-[var(--muted)]">No evaluation types configured for this module.</p>
        )
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {configs.map((c) => (
            <ConfigCard
              key={c.id}
              config={c}
              onEdit={() => setShowForm(c)}
              onDelete={load}
            />
          ))}
        </div>
      )}
    </div>
  );
}
