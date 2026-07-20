const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const session = await prisma.analysisSession.findFirst({
    where: { id: "cmr84gnrh00097sln3alqnokw" }
  });
  
  if (!session) {
    console.log("No session found");
  } else {
    console.log("transcriptPath:", session.transcriptPath);
    console.log("transcriptUrl:", session.transcriptUrl);
    console.log("transcript_clean length:", session.transcript_clean ? session.transcript_clean.length : 0);
    console.log("transcriptRaw length:", session.transcriptRaw ? session.transcriptRaw.length : 0);
  }
}

check().finally(() => prisma.$disconnect());
