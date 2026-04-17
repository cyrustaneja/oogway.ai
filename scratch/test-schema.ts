import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

async function test() {
  try {
    const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const model = ai.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              chapterTitle: { type: SchemaType.STRING },
              startTime: { type: SchemaType.STRING },
              endTime: { type: SchemaType.STRING },
            },
            required: ["chapterTitle", "startTime", "endTime"]
          }
        }
      }
    });

    const result = await model.generateContent("Give me exactly one chapter about dogs with valid times.");
    console.log("Success:");
    console.log(result.response.text());
  } catch (err: any) {
    console.error("Failed:", err.message);
  }
}
test();
