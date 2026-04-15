const { GoogleGenerativeAI } = require("@google/generative-ai");

async function main() {
  const apiKey = "AIzaSyD-fviPzQ2uCSzwaY1J2ZBajp-D4QLe_90";
  const genAI = new GoogleGenerativeAI(apiKey);
  
  const models = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-2.0-flash"];
  
  for (const m of models) {
    try {
      console.log(`Testing: ${m}`);
      const model = genAI.getGenerativeModel({ model: m });
      const result = await model.generateContent("Say 'OK'");
      console.log(`✅ ${m} works: ${result.response.text()}`);
    } catch (e) {
      console.log(`❌ ${m} failed: ${e.message}`);
    }
  }
}

main();
