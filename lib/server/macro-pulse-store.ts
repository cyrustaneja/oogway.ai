import fs from 'fs';
import path from 'path';
import { MacroPulseSummary } from './macro-pulse-analyzer';

const STORE_DIR = path.join(process.cwd(), '.macro-pulse-cache');

function ensureStoreDir() {
  if (!fs.existsSync(STORE_DIR)) {
    try {
      fs.mkdirSync(STORE_DIR, { recursive: true });
    } catch {}
  }
}

function getFilePath(targetType: string, targetId: string): string {
  ensureStoreDir();
  return path.join(STORE_DIR, `${targetType}_${targetId}.json`);
}

/**
 * Saves/Replaces the Macro Analysis summary for a target folder
 */
export async function saveMacroPulseSummary(summary: MacroPulseSummary): Promise<void> {
  try {
    const filePath = getFilePath(summary.targetType, summary.targetId);
    fs.writeFileSync(filePath, JSON.stringify(summary, null, 2), 'utf-8');
  } catch (err) {
    console.error('[MacroPulseStore] Failed to save summary:', err);
  }
}

/**
 * Retrieves the saved Macro Analysis summary for a target folder if available
 */
export async function getSavedMacroPulseSummary(
  targetType: 'course' | 'module' | 'batch' | 'expert',
  targetId: string
): Promise<MacroPulseSummary | null> {
  try {
    const filePath = getFilePath(targetType, targetId);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content) as MacroPulseSummary;
    }
  } catch (err) {
    console.error('[MacroPulseStore] Failed to read saved summary:', err);
  }
  return null;
}
