const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');

async function main() {
  console.log("🔍 Diagnosing Gemini Connection...");
  
  // Manual env parse
  let apiKey = '';
  try {
    const env = fs.readFileSync('.env.local', 'utf8') || fs.readFileSync('.env', 'utf8');
    apiKey = env.match(/GEMINI_API_KEY=["']?([^"'\n]+)/)?.[1] || '';
  } catch (e) {}

  if (!apiKey) {
     console.error("❌ Could not find API key in .env or .env.local");
     return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Try different model naming conventions
  const variants = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-pro",
    "gemini-1.0-pro"
  ];

  for (const v of variants) {
    try {
      const model = genAI.getGenerativeModel({ model: v });
      const prompt = "echo 'hi'";
      const result = await model.generateContent(prompt);
      console.log(`✅ SUCCESS: Model "${v}" is working.`);
      return; 
    } catch (err) {
      console.log(`❌ FAILED: Model "${v}" - ${err.message}`);
    }
  }
}

main();
