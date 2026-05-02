ALTER TABLE "AnalysisSession"
  ADD COLUMN IF NOT EXISTS pipeline_stage TEXT NOT NULL DEFAULT 'UPLOADED',
  ADD COLUMN IF NOT EXISTS next_action_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS stage_attempts JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS transcript_quality TEXT DEFAULT 'Good',
  ADD COLUMN IF NOT EXISTS transcript_quality_signals JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS schema_version TEXT DEFAULT 'v1',
  ADD COLUMN IF NOT EXISTS zoom_recording_id TEXT,
  ADD COLUMN IF NOT EXISTS zoom_download_url TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

CREATE UNIQUE INDEX IF NOT EXISTS idx_session_zoom_recording
  ON "AnalysisSession"(zoom_recording_id) WHERE zoom_recording_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS "AnalysisChapterResult" (
  id TEXT PRIMARY KEY, -- Removed cuid() default as it is a Prisma client function
  session_id TEXT NOT NULL REFERENCES "AnalysisSession"(id) ON DELETE CASCADE,
  chapter_index INT NOT NULL,
  result JSONB NOT NULL,
  needs_review BOOLEAN NOT NULL DEFAULT FALSE,
  review_reasons JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (session_id, chapter_index)
);
CREATE INDEX IF NOT EXISTS idx_chapter_result_session ON "AnalysisChapterResult"(session_id);

ALTER TABLE "AnalysisV2"
  ADD COLUMN IF NOT EXISTS session_flags JSONB,
  ADD COLUMN IF NOT EXISTS accuracy_issues JSONB,
  ADD COLUMN IF NOT EXISTS teaching_depth_map JSONB,
  ADD COLUMN IF NOT EXISTS pacing_map JSONB,
  ADD COLUMN IF NOT EXISTS engagement_by_chapter JSONB,
  ADD COLUMN IF NOT EXISTS confusion_summary JSONB,
  ADD COLUMN IF NOT EXISTS unresolved_doubts JSONB,
  ADD COLUMN IF NOT EXISTS topics_missed JSONB,
  ADD COLUMN IF NOT EXISTS full_synthesis JSONB,
  ADD COLUMN IF NOT EXISTS schema_version TEXT DEFAULT 'v1';