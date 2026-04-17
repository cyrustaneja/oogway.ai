const { GoogleGenerativeAI } = require("@google/generative-ai");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const STRUCTURE_SYSTEM_PROMPT = `
You are a transcript structure analyser for teaching sessions.
Your task: identify logical topic chapters in the transcript chunk you receive.

You MUST return a JSON array. Each element must have exactly these fields:
- "chapterTitle": string — a clear, descriptive title of the topic discussed
- "startTime": string — timestamp in HH:MM:SS format, taken directly from the transcript
- "endTime": string — timestamp in HH:MM:SS format, taken directly from the transcript

Rules:
- Return an ARRAY even if there is only one chapter
- Do not invent timestamps — use ones that appear in the transcript
- Chapters must be in chronological order, non-overlapping
- First chapter starts at or near the first timestamp in the chunk
- Last chapter ends at or near the last timestamp in the chunk
- Aim for 1 chapter per 10–15 minutes; if the chunk is short, 1–2 chapters is correct
`.trim();

async function test() {
  const sessionId = "cmo1c5skg0001givop7n6ddt5";
  const session = await prisma.analysisSession.findUnique({ where: { id: sessionId } });
  if (!session) return console.log("Session not found");

  const ai = new GoogleGenerativeAI("AIzaSyD-fviPzQ2uCSzwaY1J2ZBajp-D4QLe_90");
  const model = ai.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json" },
    systemInstruction: STRUCTURE_SYSTEM_PROMPT
  });

  console.log("Transcript length:", session.transcriptRaw.length);
  const result = await model.generateContent(`Segment this transcript into chapters. Ensure the entire timeline from start to end is covered:\n\n${session.transcriptRaw}`);
  console.log("GEMINI RAW OUTPUT:");
  console.log(result.response.text());
}
test();
