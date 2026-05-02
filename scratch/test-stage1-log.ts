import { PrismaClient } from '@prisma/client';
import { handleStage1 } from '../lib/pipeline/handlers/stage1-segmenter';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const sessionId = 'cmomhz0120001qj0x7ctf1aec';
  console.log('Running handleStage1 manually with logging...');
  
  // Patch console.log to capture call-stage output
  const logFile = path.join(process.cwd(), 'scratch', 'stage1-full-log.txt');
  const logger = (msg: string) => {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
  };

  try {
    // We need to ensure GEMINI_API_KEY is in process.env
    if (!process.env.GEMINI_API_KEY) {
      const env = fs.readFileSync('.env.local', 'utf-8');
      const keyMatch = env.match(/GEMINI_API_KEY=(.*)/);
      if (keyMatch) process.env.GEMINI_API_KEY = keyMatch[1].trim();
    }

    await handleStage1(sessionId);
    console.log('handleStage1 SUCCESS');
  } catch (err: any) {
    console.error('handleStage1 FAILED:', err.message);
    fs.appendFileSync(logFile, 'ERROR: ' + err.message + '\n');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
