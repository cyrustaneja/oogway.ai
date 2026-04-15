const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const session = await prisma.analysisSession.findFirst({
      where: { v3Status: 'FAILED' },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        v3Status: true,
        v3Error: true,
        expert: { select: { name: true } }
      }
    });

    if (session) {
      console.log("Most recent failed session:", JSON.stringify(session, null, 2));
    } else {
      console.log("No failed sessions found.");
    }
  } catch (error) {
    console.error("Error fetching failed sessions:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
