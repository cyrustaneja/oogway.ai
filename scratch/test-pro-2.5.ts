import { GoogleGenerativeAI } from "@google/generative-ai";

async function main() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
  const modelName = "gemini-2.5-pro";
  console.log(`Testing model: ${modelName}`);
  const model = genAI.getGenerativeModel({ model: modelName });

  try {
    const result = await model.generateContent("Say hello");
    console.log("Success:", result.response.text());
  } catch (e: any) {
    console.error("Gemini Error:", e.message);
  }
}
main();
