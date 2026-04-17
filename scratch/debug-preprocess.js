import { preprocessWebVTT } from "../lib/pipeline/stage0-preprocess"; 
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function test() {
  const sessionId = "cmo1c5skg0001givop7n6ddt5";
  const session = await prisma.analysisSession.findUnique({ where: { id: sessionId } });
  const clean = preprocessWebVTT(session.transcriptRaw);
  const lines = clean.split("\n");
  console.log("Lines:", lines.length);
  console.log("First 10:", lines.slice(0, 10));
  console.log("Middle (1500):", lines[1500]);
  console.log("Last 10:", lines.slice(-10));
}
test();
