/**
 * scripts/run-pipeline.cjs — Local pipeline driver.
 *
 * Picks the most recently-created non-deleted AnalysisSession and drives it
 * through the pipeline by polling /api/pipeline/tick on http://localhost:3000.
 *
 * Stops when:
 *   - pipeline_stage reaches COMPLETE (success), or
 *   - pipeline_stage reaches FAILED (with reason printed), or
 *   - 30 ticks elapsed (whichever comes first).
 *
 * Usage:
 *   node scripts/run-pipeline.cjs
 *
 * Optional arg: a specific session id
 *   node scripts/run-pipeline.cjs <sessionId>
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Read DATABASE_URL from .env.local
const envFile = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf-8');
let dbUrl = '';
for (const line of envFile.split('\n')) {
  const m = line.match(/^DATABASE_URL\s*=\s*"?([^"\n]+?)"?\s*$/);
  if (m) dbUrl = m[1];
}
if (!dbUrl) {
  console.error('FATAL: DATABASE_URL not found in .env.local');
  process.exit(1);
}

const TICK_URL = 'http://localhost:3000/api/pipeline/tick';
const MAX_TICKS = 30;
const SLEEP_MS = 4000;

const arg = process.argv[2];

async function readSession(client, id) {
  const r = await client.query(
    `
    SELECT s.id, s.name, s.pipeline_stage, s."v3Status", s."v3Error",
           s.transcript_quality, s.stage_attempts,
           LENGTH(s."transcriptRaw") AS transcript_len,
           LENGTH(s.transcript_clean) AS clean_len,
            CASE 
              WHEN s.chapters_json IS NULL THEN 0
              WHEN jsonb_typeof(s.chapters_json) != 'array' THEN 0
              ELSE jsonb_array_length(s.chapters_json) 
            END AS chapters_planned,
           (SELECT COUNT(*) FROM "AnalysisChapterResult" WHERE session_id = s.id)::int AS chapters_extracted,
           (SELECT id FROM "AnalysisV2" WHERE "sessionId" = s.id) AS v2_id
    FROM "AnalysisSession" s
    WHERE s.id = $1
    `,
    [id],
  );
  return r.rows[0];
}

async function pickLatest(client) {
  const r = await client.query(
    `SELECT id FROM "AnalysisSession" WHERE "deletedAt" IS NULL ORDER BY "createdAt" DESC LIMIT 1`,
  );
  return r.rows[0]?.id;
}

// Read CRON_SECRET from .env.local if present
let cronSecret = '';
for (const line of envFile.split('\n')) {
  const m2 = line.match(/^CRON_SECRET\s*=\s*"?([^"\n]+?)"?\s*$/);
  if (m2) cronSecret = m2[1];
}

async function tick() {
  const headers = { 'Content-Type': 'application/json' };
  if (cronSecret) headers['Authorization'] = `Bearer ${cronSecret}`;
  const res = await fetch(TICK_URL, { method: 'POST', headers });
  return { status: res.status, body: await res.text() };
}

function fmtRow(s) {
  return [
    `stage=${s.pipeline_stage}`,
    `v3=${s.v3Status}`,
    `chapters=${s.chapters_extracted}/${s.chapters_planned}`,
    `v2=${s.v2_id ? 'yes' : 'no'}`,
    s.v3Error ? `err="${s.v3Error.slice(0, 80)}"` : '',
  ]
    .filter(Boolean)
    .join('  ');
}

(async () => {
  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  const id = arg || (await pickLatest(client));
  if (!id) {
    console.error('No session found. Upload one first.');
    process.exit(1);
  }

  console.log(`Driving session: ${id}`);
  console.log(`Tick endpoint: ${TICK_URL}`);
  console.log('');

  let initial = await readSession(client, id);
  if (!initial) {
    console.error(`Session ${id} not found.`);
    process.exit(1);
  }
  console.log(`[t0] ${fmtRow(initial)}`);
  console.log(`     name="${initial.name}"  transcript_len=${initial.transcript_len}  quality=${initial.transcript_quality}`);
  console.log('');

  for (let i = 1; i <= MAX_TICKS; i++) {
    let tickResult;
    try {
      tickResult = await tick();
    } catch (e) {
      console.error(`[tick ${i}] HTTP error: ${e.message}`);
      console.error('  Is `npm run dev` running on port 3000?');
      break;
    }
    const s = await readSession(client, id);
    const tag = `[tick ${i}]`;
    console.log(`${tag} ${fmtRow(s)}`);

    if (s.pipeline_stage === 'COMPLETE') {
      console.log('');
      console.log(`✅ COMPLETE — open http://localhost:3000/sessions/${id}`);
      break;
    }
    if (s.pipeline_stage === 'FAILED') {
      console.log('');
      console.log('❌ FAILED');
      console.log(`   v3Error: ${s.v3Error}`);
      console.log(`   stage_attempts: ${JSON.stringify(s.stage_attempts)}`);
      console.log('');
      console.log(`   tick HTTP ${tickResult.status} body: ${tickResult.body.slice(0, 300)}`);
      break;
    }

    await new Promise((r) => setTimeout(r, SLEEP_MS));
  }

  await client.end();
})().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
