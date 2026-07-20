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

import { handleStage2 } from "../lib/pipeline/handlers/stage2-chapter-extractor";

async function run() {
  const sessionId = "cmrcghsjb000bph8wuyvunsxz";
  console.log(`Manually running Stage 2 for session ${sessionId} with loaded env...`);
  try {
    await handleStage2(sessionId);
    console.log("✅ Stage 2 finished successfully.");
  } catch (error) {
    console.error("❌ Stage 2 failed:", error);
  }
}

run();
