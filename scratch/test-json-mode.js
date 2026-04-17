const { GoogleGenerativeAI } = require("@google/generative-ai");

async function test() {
  const ai = new GoogleGenerativeAI("AIzaSyD-fviPzQ2uCSzwaY1J2ZBajp-D4QLe_90");
  
  const modelsToTest = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest"];
  
  for (const modelName of modelsToTest) {
    try {
      const model = ai.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: "application/json",
          maxOutputTokens: 512,
        }
      });
      const result = await model.generateContent('Return a JSON array with one object: {"chapterTitle":"Test","startTime":"00:01:00","endTime":"00:10:00"}');
      const text = result.response.text();
      const parsed = JSON.parse(text);
      const isArray = Array.isArray(parsed);
      console.log(`✅ ${modelName}: Got ${isArray ? 'ARRAY' : 'OBJECT'} — ${text.slice(0, 100)}`);
    } catch (err) {
      console.log(`❌ ${modelName}: ${err.message.slice(0, 120)}`);
    }
  }
}
test();
