const fs = require('fs');
const https = require('https');

async function main() {
  console.log("🔍 Querying Google AI API for available models...");
  
  // Manual env parse
  let apiKey = '';
  try {
    const env = fs.readFileSync('.env.local', 'utf8') || fs.readFileSync('.env', 'utf8');
    apiKey = env.match(/GEMINI_API_KEY=["']?([^"'\n]+)/)?.[1] || '';
  } catch (e) {}

  if (!apiKey) {
     console.error("❌ No API key found.");
     return;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

  https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        if (json.error) {
           console.error("❌ API ERROR:", json.error.message);
           return;
        }
        console.log("✅ Models found:");
        json.models.forEach(m => {
           console.log(` - ${m.name} (${m.displayName})`);
        });
      } catch (e) {
        console.error("❌ Parse Error:", e.message);
        console.log("Raw Response:", data);
      }
    });
  }).on('error', (e) => {
    console.error("❌ Request Error:", e.message);
  });
}

main();
