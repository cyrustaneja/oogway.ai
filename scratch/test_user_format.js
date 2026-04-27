
const { Client } = require('pg');

const projectRef = 'guwcnmznizwoloznngyr';
const password = 'N6oWqwz5nesKzVsO';
const host = 'aws-0-ap-south-1.pooler.supabase.com';

const userFormats = [
  'postgres',
  `postgres.${projectRef}`,
  `${projectRef}.postgres`,
  projectRef
];

async function findUserFormat() {
  for (const user of userFormats) {
    console.log(`Testing user format: ${user}...`);
    
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
      console.log(`SUCCESS! User format is ${user}`);
      await client.end();
      process.exit(0);
    } catch (err) {
      console.log(`Failed ${user}: ${err.message}`);
    }
  }
}

findUserFormat();
