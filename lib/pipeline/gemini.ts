/**
 * GEMINI CLIENT
 * Centralised wrapper around @google/generative-ai.
 * Handles retries, model fallback, and safe JSON extraction.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const PRIMARY_MODEL = "gemini-2.5-flash";
const FALLBACK_MODEL = "gemini-flash-latest";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

let client: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set in environment variables.");
    client = new GoogleGenerativeAI(apiKey);
  }
  return client;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Strips markdown code fences if the model wraps its response.
 * E.g.  ```json\n{...}\n```  →  {...}
 */
export function stripFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

/**
 * Attempts JSON.parse after stripping fences.
 * On failure, returns null.
 */
export function safeParseJSON(text: string): unknown | null {
  try {
    return JSON.parse(stripFences(text));
  } catch {
    // Try to extract first JSON object/array using a heuristic
    const objMatch = text.match(/\{[\s\S]*\}/);
    const arrMatch = text.match(/\[[\s\S]*\]/);
    const candidate = objMatch?.[0] ?? arrMatch?.[0];
    if (!candidate) return null;
    try {
      return JSON.parse(candidate);
    } catch {
      return null;
    }
  }
}

export interface GeminiCallOptions {
  systemPrompt: string;
  userPrompt: string;
  /**
   * If true, the response MUST parse as JSON or an error is thrown.
   */
  expectJSON?: boolean;
  /**
   * Override the model (defaults to PRIMARY_MODEL with FALLBACK_MODEL on 404).
   */
  model?: string;
  maxOutputTokens?: number;
}

/**
 * Core call: sends system + user prompts, retries on transient errors,
 * falls back to FALLBACK_MODEL on 404/model-not-found.
 */
export async function callGemini(options: GeminiCallOptions): Promise<string> {
  const { systemPrompt, userPrompt, model = PRIMARY_MODEL, maxOutputTokens = 8192 } = options;

  const ai = getClient();
  const modelsToTry = model === PRIMARY_MODEL ? [PRIMARY_MODEL, FALLBACK_MODEL] : [model];

  let lastError: Error | null = null;

  for (const modelName of modelsToTry) {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const genModel = ai.getGenerativeModel({
          model: modelName,
          generationConfig: { maxOutputTokens },
          systemInstruction: systemPrompt,
        });

        const result = await genModel.generateContent(userPrompt);
        const text = result.response.text();
        return text;
      } catch (err: any) {
        lastError = err;
        const is404 = err?.message?.includes("404") || err?.message?.includes("not found");
        const is503 = err?.message?.includes("503") || err?.message?.includes("UNAVAILABLE") || err?.message?.includes("capacity");
        const is429 = err?.message?.includes("429") || err?.message?.includes("quota");

        if (is404) break; // Immediately try next model
        if ((is503 || is429) && attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS * attempt);
          continue;
        }
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS * attempt);
        }
      }
    }
  }

  throw lastError ?? new Error("Gemini call failed after all retries.");
}

/**
 * Convenience wrapper that calls Gemini and parses the JSON response.
 * Throws if the response is not valid JSON and expectJSON is true.
 */
export async function callGeminiJSON<T = unknown>(options: GeminiCallOptions): Promise<T> {
  const raw = await callGemini({ ...options, expectJSON: true });
  const parsed = safeParseJSON(raw);
  if (parsed === null) {
    throw new Error(`GEMINI_JSON_PARSE_FAIL: Could not parse JSON from model response.\nRaw:\n${raw.slice(0, 500)}`);
  }
  return parsed as T;
}
