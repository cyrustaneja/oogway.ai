
import { PrismaClient } from '@prisma/client'

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

async function bruteForce() {
  for (const region of regions) {
    console.log(`Testing ${region}...`);
    const url = `postgresql://postgres.${projectRef}:${password}@aws-0-${region}.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true`;
    
    const prisma = new PrismaClient({
      datasources: { db: { url } }
    });

    try {
      await prisma.$connect();
      console.log(`SUCCESS! Working Region is ${region}`);
      console.log(`Working URL: ${url}`);
      await prisma.$disconnect();
      process.exit(0);
    } catch (err) {
      console.log(`Failed ${region}: ${err.message}`);
    } finally {
      await prisma.$disconnect();
    }
  }
}

bruteForce();
