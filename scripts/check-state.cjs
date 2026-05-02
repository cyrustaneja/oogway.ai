const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const envFile = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf-8');
let dbUrl = '';
for (const line of envFile.split('\n')) {
  const m = line.match(/^DATABASE_URL\s*=\s*"?([^"\n]+)"?/);
  if (m) dbUrl = m[1].replace(/"$/, '');
}
const client = new Client({ connectionString: dbUrl });
(async () => {
  await client.connect();
  const r = await client.query(`
    SELECT s.id, s.name, s."createdAt", s."updatedAt",
           s.pipeline_stage, s."v3Status", s."v3Error",
           s.next_action_at, s.heartbeat,
           s.transcript_quality, s.stage_attempts,
           LENGTH(s."transcriptRaw") AS transcript_len,
           LENGTH(s.transcript_clean) AS clean_len,
           jsonb_array_length(s.chapters_json) AS chapters_planned,
           (SELECT COUNT(*) FROM "AnalysisChapterResult" WHERE session_id = s.id)::int AS chapters_extracted,
           (SELECT id FROM "AnalysisV2" WHERE "sessionId" = s.id) AS v2_id
    FROM "AnalysisSession" s
    WHERE s."deletedAt" IS NULL
    ORDER BY s."createdAt" DESC
    LIMIT 5
  `);
  console.log(JSON.stringify(r.rows, null, 2));
  await client.end();
})().catch(e => { console.error('ERR:', e.message); process.exit(1); });
