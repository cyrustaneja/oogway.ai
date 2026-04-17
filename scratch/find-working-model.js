const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');

async function main() {
  let apiKey = '';
  try {
    const env = fs.readFileSync('.env.local', 'utf8') || fs.readFileSync('.env', 'utf8');
    apiKey = env.match(/GEMINI_API_KEY=["']?([^"'\n]+)/)?.[1] || '';
  } catch (e) {}

  if (!apiKey) {
     console.error("❌ No API key found.");
     return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // A vast list of possible models across different tiers
  const variants = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-latest",
    "gemini-2.5-pro",
    "gemini-2.5-flash-native-audio-latest",
    "gemini-2.0-flash",
    "gemini-2.0-flash-001",
    "gemini-2.0-pro-exp-02-05",
    "gemini-1.5-flash",
    "gemini-1.5-flash-002",
    "gemini-1.5-pro",
    "gemini-1.0-pro"
  ];

  for (const v of variants) {
    try {
      console.log(`Testing model: ${v}...`);
      const model = genAI.getGenerativeModel({ model: v });
      const prompt = "Reply with exactly the word SUCCESS";
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      console.log(`✅ WORKED! Model "${v}" replied: ${text.trim()}`);
      return; 
    } catch (err) {
      console.log(`❌ FAILED: ${v} - ${err.message.split('\\n')[0]}`);
    }
  }
}

main();
