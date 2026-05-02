-- CreateIndex
CREATE INDEX "AnalysisSession_next_action_at_idx" ON "AnalysisSession"("next_action_at");

-- CreateIndex
CREATE INDEX "AnalysisSession_pipeline_stage_idx" ON "AnalysisSession"("pipeline_stage");
