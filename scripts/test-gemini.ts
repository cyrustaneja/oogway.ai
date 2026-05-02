// scripts/test-gemini.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

async function main() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  try {
    const result = await model.generateContent("Say hello");
    console.log("Success:", result.response.text());
  } catch (e: any) {
    console.error("Gemini Error:", e.message);
    if (e.response) {
      console.error("Response details:", await e.response.text());
    }
  }
}

main();
