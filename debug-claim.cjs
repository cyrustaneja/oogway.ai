const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const envFile = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf-8');
let dbUrl = '';
for (const line of envFile.split('\n')) {
  const m = line.match(/^DATABASE_URL\s*=\s*"?([^"\n]+)"?/);
  if (m) dbUrl = m[1].replace(/"$/, '');
}
const client = new Client({ connectionString: dbUrl });
(async () => {
  await client.connect();
  const r = await client.query(`
    SELECT id, pipeline_stage, next_action_at, "deletedAt", "createdAt"
    FROM "AnalysisSession"
    ORDER BY "createdAt" DESC
    LIMIT 5
  `);
  console.log('Due sessions:', JSON.stringify(r.rows, null, 2));
  const now = await client.query('SELECT NOW() as now');
  console.log('Current DB time:', now.rows[0].now);
  await client.end();
})().catch(e => { console.error(e); process.exit(1); });
