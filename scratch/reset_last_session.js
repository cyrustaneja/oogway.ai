const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const last = await prisma.analysisSession.findFirst({
    where: { deletedAt: null },
    orderBy: { updatedAt: 'desc' }
  });
  
  if (!last) {
    console.log("No session found");
    return;
  }
  
  console.log(`Resetting session: ${last.id} (${last.name})`);
  
  await prisma.analysisSession.update({
    where: { id: last.id },
    data: {
      v3Status: 'PENDING',
      v3Progress: '0%',
      v3Error: null,
      heartbeat: new Date()
    }
  });
  
  console.log("Reset complete. Pipeline should start automatically if you click Rethink in UI or if I trigger it.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
