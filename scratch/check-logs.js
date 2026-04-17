const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const latestSessions = await prisma.analysisSession.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      v3Status: true,
      v3Progress: true,
      v3Error: true,
      heartbeat: true,
      createdAt: true
    }
  });

  console.log('\n📊 --- LATEST PIPELINE LOGS ---');
  if (latestSessions.length === 0) {
    console.log('No sessions found in the database. (Clean slate)');
  }

  latestSessions.forEach(s => {
    console.log(`\nSession: ${s.name} (${s.id})`);
    console.log(`Status: ${s.v3Status} [${s.v3Progress || 'N/A'}]`);
    if (s.v3Error) console.log(`Error: ${s.v3Error}`);
    console.log(`Heartbeat: ${s.heartbeat}`);
    console.log(`Created: ${s.createdAt}`);
  });
  console.log('\n-----------------------------\n');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
