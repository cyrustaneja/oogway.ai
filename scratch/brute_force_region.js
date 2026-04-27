
const { Client } = require('pg');

const projectRef = 'guwcnmznizwoloznngyr';
const password = 'N6oWqwz5nesKzVsO';
const regions = [
  'ap-south-1',
  'ap-southeast-1',
  'ap-southeast-2',
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'eu-central-1',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'eu-north-1',
  'ca-central-1',
  'sa-east-1'
];

async function findRegion() {
  for (const region of regions) {
    console.log(`Testing ${region}...`);
    const host = `aws-0-${region}.pooler.supabase.com`;
    const user = `postgres.${projectRef}`;
    
    const client = new Client({
      host,
      port: 6543,
      user,
      password,
      database: 'postgres',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000
    });

    try {
      await client.connect();
      console.log(`SUCCESS! Region is ${region}`);
      const res = await client.query('SELECT now()');
      console.log('Query result:', res.rows[0]);
      await client.end();
      process.exit(0);
    } catch (err) {
      console.log(`Failed ${region}: ${err.message}`);
    }
  }
}

findRegion();
