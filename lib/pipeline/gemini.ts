/**
 * GEMINI CLIENT
 * Centralised wrapper around @google/generative-ai.
 * Uses responseMimeType: "application/json" for all JSON calls to guarantee
 * valid JSON output — no markdown fences, no prose, no parsing heuristics needed.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

// Models confirmed working with this API key (tested 2025-04-16)
// gemini-2.0-flash does NOT work on this key — omitted.
const PRIMARY_MODEL   = "gemini-2.5-flash";
const FALLBACK_MODELS = ["gemini-flash-latest"];

const MAX_RETRIES    = 3;
const RETRY_DELAY_MS = 3000;

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

export interface GeminiCallOptions {
  systemPrompt: string;
  userPrompt: string;
  expectJSON?: boolean;
  model?: string;
  maxOutputTokens?: number;
}

/**
 * Core call: sends system + user prompts, retries on transient errors,
 * falls back to FALLBACK_MODELS on 404/model-not-found.
 * When expectJSON is true, sets responseMimeType to application/json
 * so the model is forced to return valid JSON — no parsing tricks needed.
 */
export async function callGemini(options: GeminiCallOptions): Promise<string> {
  const {
    systemPrompt,
    userPrompt,
    expectJSON = false,
    model = PRIMARY_MODEL,
    maxOutputTokens = 8192,
  } = options;

  const ai = getClient();
  const modelsToTry = model === PRIMARY_MODEL
    ? [PRIMARY_MODEL, ...FALLBACK_MODELS]
    : [model];

  let lastError: Error | null = null;

  for (const modelName of modelsToTry) {
    console.log(`[GEMINI] Attempting model: ${modelName}`);

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const generationConfig: any = { maxOutputTokens };

        // Force JSON output at the API level — eliminates all parsing issues
        if (expectJSON) {
          generationConfig.responseMimeType = "application/json";
        }

        const genModel = ai.getGenerativeModel({
          model: modelName,
          generationConfig,
          systemInstruction: systemPrompt,
        });

        const result = await genModel.generateContent(userPrompt);

        const candidate = result.response.candidates?.[0];
        const finishReason = candidate?.finishReason;
        console.log(`[GEMINI] Model finished: ${finishReason} | model: ${modelName}`);

        if (finishReason === "SAFETY") {
          throw new Error("Generation blocked by safety filters.");
        }
        if (finishReason === "MAX_TOKENS") {
          console.warn("[GEMINI] WARNING: Hit max tokens — output may be truncated.");
        }

        const text = result.response.text();
        console.log(`[GEMINI] ✅ Success with ${modelName}. Length: ${text.length} chars.`);
        return text;

      } catch (err: any) {
        lastError = err;
        console.warn(
          `[GEMINI] ❌ Model ${modelName} failed (attempt ${attempt}/${MAX_RETRIES}):`,
          err?.message?.slice(0, 200) ?? err
        );

        const is404 = err?.message?.includes("404") || err?.message?.includes("not found");
        const is503 =
          err?.message?.includes("503") ||
          err?.message?.includes("UNAVAILABLE") ||
          err?.message?.includes("capacity");
        const is429 =
          err?.message?.includes("429") || err?.message?.includes("quota");
        const isReset = err?.message?.includes("ECONNRESET") || err?.message?.includes("socket");

        if (is404) {
          console.warn(`[GEMINI] Model ${modelName} not found on this API key. Trying next model.`);
          break; // Immediately try next model
        }

        if ((is503 || is429 || isReset) && attempt < MAX_RETRIES) {
          const delay = RETRY_DELAY_MS * attempt;
          console.warn(`[GEMINI] Rate limit / server error. Waiting ${delay}ms before retry...`);
          await sleep(delay);
          continue;
        }

        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS);
        }
      }
    }
  }

  throw lastError ?? new Error("Gemini call failed after all retries and model fallbacks.");
}

/**
 * Convenience wrapper that calls Gemini with JSON mode enabled.
 * Because responseMimeType is set, the response IS guaranteed JSON — we just parse it.
 * No heuristic stripping, no fence removal, no fallback regexes needed.
 */
export async function callGeminiJSON<T = unknown>(options: GeminiCallOptions): Promise<T> {
  const raw = await callGemini({ ...options, expectJSON: true });

  try {
    return JSON.parse(raw) as T;
  } catch (err: any) {
    // This should essentially never happen when responseMimeType is set,
    // but we log the raw output to diagnose if it ever does.
    console.error(
      "====== FATAL: responseMimeType=json but response failed to parse ======\n",
      raw.slice(0, 2000),
      "\n======================================================================"
    );
    throw new Error(
      `GEMINI_JSON_PARSE_FAIL: Model returned non-JSON despite JSON mode.\nRaw (first 500 chars): ${raw.slice(0, 500)}`
    );
  }
}
