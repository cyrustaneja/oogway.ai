import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Testing DB connection...');
  try {
    const res = await prisma.$queryRaw`SELECT 1 as result`;
    console.log('Success:', res);
  } catch (err) {
    console.error('Connection failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
