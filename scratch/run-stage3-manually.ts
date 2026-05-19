import * as fs from 'fs';
import * as path from 'path';

// Manually parse .env.local and set env vars before importing handlers
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envFileContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envFileContent.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)\s*=\s*"?([^"\r\n]+?)"?\s*$/);
    if (m) {
      process.env[m[1]] = m[2].trim();
    }
  }
}

import { handleStage3 } from "../lib/pipeline/handlers/stage3-synthesizer";

async function runStage3() {
  const sessionId = "cmpcjao01000168bhn9vqsl21";
  console.log(`Manually running Stage 3 for Dipak Anand (${sessionId}) with loaded env...`);
  try {
    await handleStage3(sessionId);
    console.log("✅ Stage 3 finished successfully.");
  } catch (error) {
    console.error("❌ Stage 3 failed:", error);
  }
}

runStage3();
