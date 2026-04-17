const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const experts = await prisma.expert.findMany({
      where: { deletedAt: null }
    });
    console.log('EXPERTS:', JSON.stringify(experts, null, 2));
  } catch (err) {
    console.error('ERROR FETCHING EXPERTS:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
