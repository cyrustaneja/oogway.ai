import React from 'react';
import {
  Document, Page, Text, View, StyleSheet, Font,
} from '@react-pdf/renderer';
import { SessionAnalysis, ChapterResult } from '@/lib/types/analysis';

// ── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg: '#0f0f11',
  card: '#18181b',
  inner: '#232329',
  border: '#2e2e36',
  fg: '#f2f2f5',
  muted: '#7a7a8a',
  orange: '#f97316',
  green: '#22c55e',
  amber: '#f59e0b',
  red: '#ef4444',
  darkgreen: '#16a34a',
  white: '#ffffff',
};

// ── Score → colour ────────────────────────────────────────────────────────────
const POSITIVE = new Set(['Deep','Strong','Active','On','No Gap','Resolved','Accurate','Correct','Full Context','Complete','On Time','Answered+Anchored','Reframed','Complete+Deep']);
const CAUTION  = new Set(['Explained','Balanced','Responsive','Partial','Minor Gap','Notable Gap','Answered','Possibly Incorrect','Needs Review','Partial Context','Isolated','Localized']);
const NEGATIVE = new Set(['Definitional','Weak','Silent','Off','Delayed','Major Gap','Ignored','Incorrect','Left Hanging','Widespread','No Context','Incomplete','Rushed','Overdwelled','Incorrect Resolution']);

function labelColor(label?: string | null) {
  if (!label) return C.muted;
  if (POSITIVE.has(label)) return C.green;
  if (CAUTION.has(label))  return C.amber;
  if (NEGATIVE.has(label)) return C.red;
  return C.muted;
}

function scoreColor(score?: number | null) {
  if (score == null) return C.muted;
  if (score >= 80) return C.green;
  if (score >= 60) return C.amber;
  return C.red;
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: { backgroundColor: C.bg, padding: 36, fontFamily: 'Helvetica', color: C.fg },
  // Header
  headerCard: { backgroundColor: C.card, borderRadius: 10, padding: 20, marginBottom: 18, borderWidth: 1, borderColor: C.border },
  orangeLine: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: C.orange, borderRadius: 10 },
  eyebrow: { fontSize: 7, color: C.muted, fontFamily: 'Helvetica-Bold', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 },
  title: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: C.fg, letterSpacing: -0.5, marginBottom: 8 },
  metaRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  metaText: { fontSize: 8, color: C.muted, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 1 },
  // Stat pills
  pillsRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  pill: { flex: 1, borderRadius: 8, padding: 8, borderWidth: 1 },
  pillLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 1, opacity: 0.75, marginBottom: 3 },
  pillValue: { fontSize: 12, fontFamily: 'Helvetica-Bold' },
  // Section
  sectionCard: { backgroundColor: C.card, borderRadius: 10, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: C.border },
  sectionEyebrow: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.orange, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 },
  sectionTitle: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: C.fg, marginBottom: 10 },
  body: { fontSize: 9, color: C.fg, lineHeight: 1.6 },
  muted: { fontSize: 9, color: C.muted, lineHeight: 1.6 },
  // Flag
  flagRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 8, borderRadius: 8, backgroundColor: C.inner, borderWidth: 1, borderColor: C.border, marginBottom: 5 },
  flagDot: { width: 6, height: 6, borderRadius: 3, marginTop: 2 },
  flagCategory: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.orange, textTransform: 'uppercase', letterSpacing: 1 },
  flagText: { fontSize: 8.5, color: C.fg, lineHeight: 1.5 },
  // Chapter
  chapterHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  chapterNum: { width: 28, height: 28, borderRadius: 6, backgroundColor: '#2c1810', borderWidth: 1, borderColor: '#7c2d12', alignItems: 'center', justifyContent: 'center' },
  chapterNumText: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.orange },
  chapterTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.fg, flex: 1 },
  chapterTime: { fontSize: 7, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  chapterSummary: { fontSize: 8.5, color: C.fg, lineHeight: 1.65, marginBottom: 10 },
  // Rubric chips row
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 8 },
  chip: { paddingVertical: 3, paddingHorizontal: 7, borderRadius: 5, borderWidth: 1 },
  chipText: { fontSize: 7, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.8 },
  // Evidence quote
  quote: { borderLeftWidth: 2, borderLeftColor: C.orange, paddingLeft: 8, marginBottom: 6, marginTop: 2 },
  quoteText: { fontSize: 7.5, color: C.muted, lineHeight: 1.55, fontStyle: 'italic' },
  quoteTimestamp: { fontSize: 6.5, color: C.orange, marginTop: 2 },
  // Doubts
  doubtRow: { padding: 8, borderRadius: 6, backgroundColor: C.inner, borderWidth: 1, borderColor: C.border, marginBottom: 5 },
  doubtStudent: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.orange, marginBottom: 2 },
  doubtText: { fontSize: 8, color: C.fg, lineHeight: 1.5, marginBottom: 4 },
  // Divider
  divider: { height: 1, backgroundColor: C.border, marginVertical: 10 },
  // Page number
  pageNum: { position: 'absolute', bottom: 18, right: 36, fontSize: 7.5, color: C.muted },
  // Key learning points
  bulletRow: { flexDirection: 'row', gap: 6, marginBottom: 5 },
  bullet: { fontSize: 9, color: C.orange, marginTop: 1 },
  bulletText: { fontSize: 8.5, color: C.fg, lineHeight: 1.6, flex: 1 },
  // Table-like rows
  tableRow: { flexDirection: 'row', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: C.border },
  tableCell: { flex: 1, fontSize: 8, color: C.fg },
  tableCellBold: { flex: 1, fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.fg },
  tableHeader: { flexDirection: 'row', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: C.orange, marginBottom: 2 },
  tableHeaderCell: { flex: 1, fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.orange, textTransform: 'uppercase', letterSpacing: 1 },
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatTs(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}

function Chip({ label }: { label?: string | null }) {
  if (!label) return null;
  const color = labelColor(label);
  return (
    <View style={[s.chip, { borderColor: color + '55', backgroundColor: color + '18' }]}>
      <Text style={[s.chipText, { color }]}>{label}</Text>
    </View>
  );
}

function Quote({ quote, timestamp }: { quote?: string | null; timestamp?: string | null }) {
  if (!quote) return null;
  return (
    <View style={s.quote}>
      <Text style={s.quoteText}>"{quote.slice(0, 220)}{quote.length > 220 ? '…' : ''}"</Text>
      {timestamp && <Text style={s.quoteTimestamp}>{timestamp}</Text>}
    </View>
  );
}

function SectionEyebrow({ children }: { children: string }) {
  return <Text style={s.sectionEyebrow}>{children}</Text>;
}

// ── Flags section ─────────────────────────────────────────────────────────────
function buildFlags(data: SessionAnalysis, chapters: ChapterResult[]) {
  const aiFlags = data.session_flags?.flags ?? [];
  const auto: any[] = [];
  chapters.forEach(ch => {
    if (ch.accuracy_check?.label === 'Incorrect' || ch.accuracy_check?.label === 'Possibly Incorrect') {
      auto.push({ category: 'AccuracyConcern', severity: 'high', rationale: `Ch.${ch.chapter_num}: ${ch.accuracy_check.label} – "${ch.title}"` });
    }
    const ignored = ch.doubts?.filter((d: any) => d.resolution?.label === 'Ignored') || [];
    if (ignored.length) auto.push({ category: 'UnresolvedDoubt', severity: 'high', rationale: `Ch.${ch.chapter_num}: ${ignored.length} doubt(s) left unresolved` });
    if (ch.confusion_points?.some((p: any) => p.severity?.label === 'Widespread')) {
      auto.push({ category: 'WideConfusion', severity: 'high', rationale: `Ch.${ch.chapter_num}: Widespread confusion in "${ch.title}"` });
    }
    if (ch.example_gap?.label === 'Severe Gap') {
      auto.push({ category: 'MissingExamples', severity: 'high', rationale: `Ch.${ch.chapter_num}: Severe example gap` });
    }
  });
  if ((data.context_setup?.score ?? 100) <= 60) {
    auto.push({ category: 'ContextMissing', severity: 'medium', rationale: `Context score ${data.context_setup?.score}/100 — missing agenda framing` });
  }
  return [...aiFlags, ...auto];
}

// ── Main PDF Document ─────────────────────────────────────────────────────────
type Props = {
  data: SessionAnalysis;
  chapters: ChapterResult[];
};

export function SessionPDFDocument({ data, chapters }: Props) {
  const si = (data as any).session_info ?? {};
  const allFlags = buildFlags(data, chapters);
  const highCount = allFlags.filter(f => (f.severity || '').toLowerCase() === 'high').length;
  const medCount  = allFlags.filter(f => (f.severity || '').toLowerCase() === 'medium').length;
  const totalDoubts = data.expert_audit?.doubt_resolution_summary?.length ?? 0;
  const unresolved  = data.student_log?.unresolved_doubts?.length ?? 0;
  const flagTone = highCount > 0 ? C.red : medCount > 0 ? C.amber : C.green;

  return (
    <Document
      title={si.name || 'Session Analysis'}
      author="KraftShala"
      subject="Pedagogical Audit Report"
    >
      {/* ── PAGE 1: Overview ── */}
      <Page size="A4" style={s.page}>
        <Text style={s.pageNum} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />

        {/* Header */}
        <View style={s.headerCard}>
          <View style={s.orangeLine} />
          <Text style={s.eyebrow}>{si.expertName} · {si.batchName}</Text>
          <Text style={s.title}>{si.name || 'Session Analysis'}</Text>
          <View style={s.metaRow}>
            {si.date     && <Text style={s.metaText}>📅  {si.date}</Text>}
            {si.duration && <Text style={s.metaText}>⏱  {si.duration}</Text>}
          </View>

          {/* Stat pills */}
          <View style={s.pillsRow}>
            {[
              { label: 'Completeness', value: data.session_completeness?.label || '—', color: labelColor(data.session_completeness?.label) },
              { label: 'Flags Raised', value: String(allFlags.length), color: flagTone },
              { label: 'Student Doubts', value: String(totalDoubts), color: scoreColor(100 - unresolved * 12) },
              { label: 'Unresolved', value: String(unresolved), color: unresolved > 0 ? C.amber : C.green },
            ].map(p => (
              <View key={p.label} style={[s.pill, { borderColor: p.color + '55', backgroundColor: p.color + '18' }]}>
                <Text style={[s.pillLabel, { color: p.color }]}>{p.label}</Text>
                <Text style={[s.pillValue, { color: p.color }]}>{p.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Pedagogical Health */}
        {data.expert_audit?.pedagogical_health_summary && (
          <View style={s.sectionCard}>
            <SectionEyebrow>Pedagogical Health Summary</SectionEyebrow>
            <Text style={s.body}>{data.expert_audit.pedagogical_health_summary}</Text>
          </View>
        )}

        {/* Flags */}
        {allFlags.length > 0 && (
          <View style={s.sectionCard}>
            <SectionEyebrow>{`⚠  ${allFlags.length} Operational Flag${allFlags.length !== 1 ? 's' : ''}`}</SectionEyebrow>
            {allFlags.map((f, i) => {
              const sev = (f.severity || '').toLowerCase();
              const dot = sev === 'high' ? C.red : sev === 'medium' ? C.amber : C.muted;
              return (
                <View key={i} style={s.flagRow}>
                  <View style={[s.flagDot, { backgroundColor: dot }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.flagCategory}>[{f.category}]</Text>
                    <Text style={s.flagText}>{f.rationale}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Key Learning Points */}
        {(data.key_learning_points?.length ?? 0) > 0 && (
          <View style={s.sectionCard}>
            <SectionEyebrow>Key Learning Points</SectionEyebrow>
            {data.key_learning_points.map((pt, i) => (
              <View key={i} style={s.bulletRow}>
                <Text style={s.bullet}>▸</Text>
                <Text style={s.bulletText}>{pt}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Topic Coverage */}
        {(data.topics_covered?.length ?? 0) > 0 && (
          <View style={s.sectionCard}>
            <SectionEyebrow>Topics Covered</SectionEyebrow>
            <View style={s.chipsRow}>
              {data.topics_covered.map((t, i) => (
                <View key={i} style={[s.chip, { borderColor: C.orange + '44', backgroundColor: C.orange + '14' }]}>
                  <Text style={[s.chipText, { color: C.orange }]}>{t}</Text>
                </View>
              ))}
            </View>
            {(data.topics_missed_from_notes?.length ?? 0) > 0 && (
              <>
                <Text style={[s.muted, { marginTop: 8, marginBottom: 4 }]}>Missed from planned notes:</Text>
                <View style={s.chipsRow}>
                  {data.topics_missed_from_notes.map((t, i) => (
                    <View key={i} style={[s.chip, { borderColor: C.red + '44', backgroundColor: C.red + '14' }]}>
                      <Text style={[s.chipText, { color: C.red }]}>{t}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        )}
      </Page>

      {/* ── PAGE 2: Chapter-by-Chapter ── */}
      <Page size="A4" style={s.page}>
        <Text style={s.pageNum} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
        <Text style={[s.sectionEyebrow, { marginBottom: 14 }]}>{`Chapter Breakdown — ${chapters.length} Chapters`}</Text>

        {chapters.map((ch, i) => (
          <View key={i} style={[s.sectionCard, { marginBottom: 10 }]} wrap={false}>
            <View style={s.chapterHeader}>
              <View style={s.chapterNum}>
                <Text style={s.chapterNumText}>{String(ch.chapter_num).padStart(2, '0')}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.chapterTitle}>{ch.title}</Text>
                <Text style={s.chapterTime}>
                  {formatTs(ch.t_start ?? 0)} – {formatTs(ch.t_end ?? 0)}
                </Text>
              </View>
            </View>

            <Text style={s.chapterSummary}>{ch.what_was_taught}</Text>

            {/* Rubric chips */}
            <View style={s.chipsRow}>
              {ch.teaching_depth && <Chip label={ch.teaching_depth.label} />}
              {ch.pacing          && <Chip label={ch.pacing.label} />}
              {ch.engagement      && <Chip label={ch.engagement.label} />}
              {ch.example_gap     && <Chip label={ch.example_gap.label} />}
              {ch.accuracy_check  && <Chip label={ch.accuracy_check.label} />}
            </View>

            {/* Best evidence quote */}
            {ch.teaching_depth?.evidence?.[0] && (
              <Quote
                quote={ch.teaching_depth.evidence[0].verbatim_quote}
                timestamp={ch.teaching_depth.evidence[0].timestamp}
              />
            )}

            {/* Doubts */}
            {(ch.doubts?.length ?? 0) > 0 && (
              <View style={{ marginTop: 6 }}>
                <Text style={[s.eyebrow, { marginBottom: 4 }]}>{`Student Doubts (${ch.doubts.length})`}</Text>
                {ch.doubts.slice(0, 3).map((d: any, j: number) => (
                  <View key={j} style={s.doubtRow}>
                    <Text style={s.doubtStudent}>{d.student_name_raw || 'Student'}</Text>
                    <Text style={s.doubtText}>{d.doubt_verbatim?.slice(0, 180)}</Text>
                    <Chip label={d.resolution?.label} />
                  </View>
                ))}
              </View>
            )}

            {/* Confusion */}
            {(ch.confusion_points?.length ?? 0) > 0 && (
              <View style={{ marginTop: 6 }}>
                <Text style={[s.eyebrow, { marginBottom: 4 }]}>{`Confusion Points (${ch.confusion_points.length})`}</Text>
                {ch.confusion_points.slice(0, 2).map((p: any, j: number) => (
                  <View key={j} style={s.bulletRow}>
                    <Text style={[s.bullet, { color: labelColor(p.severity?.label) }]}>▸</Text>
                    <Text style={s.bulletText}>{p.topic}</Text>
                    <Chip label={p.severity?.label} />
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </Page>

      {/* ── PAGE 3: Expert & Student Audit ── */}
      <Page size="A4" style={s.page}>
        <Text style={s.pageNum} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />

        {/* Doubt Resolution Table */}
        {(data.expert_audit?.doubt_resolution_summary?.length ?? 0) > 0 && (
          <View style={s.sectionCard}>
            <SectionEyebrow>Doubt Resolution Log</SectionEyebrow>
            <View style={s.tableHeader}>
              {['Ch.', 'Student', 'Doubt', 'Resolution', 'Accuracy'].map(h => (
                <Text key={h} style={s.tableHeaderCell}>{h}</Text>
              ))}
            </View>
            {data.expert_audit.doubt_resolution_summary.slice(0, 20).map((d, i) => (
              <View key={i} style={s.tableRow}>
                <Text style={[s.tableCellBold, { flex: 0.3 }]}>{String(d.chapter)}</Text>
                <Text style={[s.tableCell, { flex: 0.8 }]}>{d.student?.slice(0, 12)}</Text>
                <Text style={[s.tableCell, { flex: 2 }]}>{d.doubt?.slice(0, 60)}</Text>
                <Text style={[s.tableCell, { flex: 0.8, color: labelColor(d.resolution_label) }]}>{d.resolution_label}</Text>
                <Text style={[s.tableCell, { flex: 0.8, color: labelColor(d.resolution_accuracy) }]}>{d.resolution_accuracy}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Analogies */}
        {(data.expert_audit?.analogies_summary?.length ?? 0) > 0 && (
          <View style={s.sectionCard}>
            <SectionEyebrow>{`Analogies Used (${data.expert_audit.analogies_summary.length})`}</SectionEyebrow>
            {data.expert_audit.analogies_summary.map((a, i) => (
              <View key={i} style={[s.bulletRow, { marginBottom: 8 }]}>
                <Text style={s.bullet}>▸</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[s.body, { fontFamily: 'Helvetica-Bold' }]}>{a.concept} <Text style={{ color: labelColor(a.quality_label) }}>({a.quality_label})</Text></Text>
                  {a.verbatim_quote && <Quote quote={a.verbatim_quote} />}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Accuracy Issues */}
        {(data.expert_audit?.accuracy_issues?.length ?? 0) > 0 && (
          <View style={s.sectionCard}>
            <SectionEyebrow>Accuracy Issues</SectionEyebrow>
            {data.expert_audit.accuracy_issues.map((a, i) => (
              <View key={i} style={[s.doubtRow, { marginBottom: 6 }]}>
                <View style={s.chipsRow}>
                  <Text style={[s.tableCellBold, { fontSize: 8 }]}>{`Ch.${a.chapter}: ${a.topic}`}</Text>
                  <Chip label={a.accuracy_label} />
                </View>
                {a.concern && <Text style={[s.muted, { marginTop: 3 }]}>{a.concern}</Text>}
                {a.verbatim_quote && <Quote quote={a.verbatim_quote} timestamp={a.timestamp} />}
              </View>
            ))}
          </View>
        )}

        {/* Unresolved Doubts */}
        {(data.student_log?.unresolved_doubts?.length ?? 0) > 0 && (
          <View style={s.sectionCard}>
            <SectionEyebrow>{`Unresolved Doubts (${data.student_log.unresolved_doubts.length})`}</SectionEyebrow>
            {data.student_log.unresolved_doubts.map((d, i) => (
              <View key={i} style={s.doubtRow}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                  <Text style={s.doubtStudent}>{d.student}</Text>
                  <Text style={s.metaText}>{`Ch.${d.chapter} · ${d.timestamp}`}</Text>
                </View>
                <Text style={s.doubtText}>{d.doubt?.slice(0, 200)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Footer branding */}
        <View style={{ position: 'absolute', bottom: 18, left: 36 }}>
          <Text style={[s.eyebrow, { color: C.orange }]}>Generated by KraftShala · Pedagogical Audit</Text>
        </View>
      </Page>
    </Document>
  );
}
