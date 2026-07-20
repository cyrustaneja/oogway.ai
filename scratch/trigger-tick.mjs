import fs from 'fs';
const envFile = fs.readFileSync('.env.local', 'utf-8');
const cronSecret = envFile.split('\n').find(l => l.startsWith('CRON_SECRET=')).split('=')[1];
fetch('http://localhost:3000/api/pipeline/tick', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${cronSecret}` }
}).then(r => r.json()).then(console.log).catch(console.error);
