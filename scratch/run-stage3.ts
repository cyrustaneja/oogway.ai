import { handleStage3 } from "../lib/pipeline/handlers/stage3-synthesizer";

async function runStage3() {
  const sessionId = "cmoskn7hu0009j4a085pe4hrh";
  console.log(`Manually running Stage 3 for ${sessionId}...`);
  try {
    await handleStage3(sessionId);
    console.log("✅ Stage 3 finished successfully.");
  } catch (error) {
    console.error("❌ Stage 3 failed:", error);
  }
}

runStage3();
