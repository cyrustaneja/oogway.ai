const { GoogleGenerativeAI } = require("@google/generative-ai");

async function main() {
  const apiKey = "AIzaSyD-fviPzQ2uCSzwaY1J2ZBajp-D4QLe_90"; // From .env
  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    // There is no direct listModels in the standard SDK easily accessible like this
    // but we can try to call a model and see what happens with a simple prompt
    const models = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro", "gemini-2.0-flash-exp", "gemini-2.0-flash"];
    
    for (const m of models) {
      try {
        console.log(`Testing model: ${m}`);
        const model = genAI.getGenerativeModel({ model: m });
        const result = await model.generateContent("Hi");
        console.log(`✅ ${m} works: ${result.response.text().slice(0, 20)}...`);
      } catch (e) {
        console.log(`❌ ${m} failed: ${e.message}`);
      }
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
