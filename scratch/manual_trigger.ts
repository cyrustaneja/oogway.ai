import { runPipelineV2 } from "./lib/pipeline/orchestrator-v2.js";
import { prisma } from "./lib/db.js";

const sessionId = "cmo76kh0p0001jndj7rtygrxb";

async function main() {
  console.log(`[CLI] Manually triggering pipeline for ${sessionId}...`);
  try {
    await runPipelineV2(sessionId);
    console.log("[CLI] Pipeline completed successfully.");
  } catch (err) {
    console.error("[CLI] Pipeline failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
