const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");

async function test() {
  try {
    const ai = new GoogleGenerativeAI("AIzaSyD-fviPzQ2uCSzwaY1J2ZBajp-D4QLe_90");
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

    const result = await model.generateContent("Give me exactly one chapter about dogs with startTime 00:00:00 and endTime 00:10:00.");
    console.log("SUCCESS - responseSchema/array worked:");
    console.log(result.response.text());
  } catch (err) {
    console.error("FAILED:", err.message);
  }
}
test();
