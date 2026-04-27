
const { Client } = require('pg');

const projectRef = 'guwcnmznizwoloznngyr';
const password = 'N6oWqwz5nesKzVsO';
const user = `postgres.${projectRef}`;
const ips = [
  '15.207.234.125',
  '13.235.132.203',
  '3.108.139.117',
  '3.111.105.85',
  '15.206.182.201',
  '13.126.113.189'
];

async function findIP() {
  for (const ip of ips) {
    console.log(`Testing IP: ${ip}...`);
    
    const client = new Client({
      host: ip,
      port: 6543,
      user,
      password,
      database: 'postgres',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000
    });

    try {
      await client.connect();
      console.log(`SUCCESS! IP is ${ip}`);
      await client.end();
      process.exit(0);
    } catch (err) {
      console.log(`Failed ${ip}: ${err.message}`);
    }
  }
}

findIP();
