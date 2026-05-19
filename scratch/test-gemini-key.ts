import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';

// Manually parse .env.local
const envPath = path.join(__dirname, '../.env.local');
const envFileContent = fs.readFileSync(envPath, 'utf-8');
let apiKey = '';
for (const line of envFileContent.split('\n')) {
  const m = line.match(/^GEMINI_API_KEY\s*=\s*"?([^"\n]+?)"?\s*$/);
  if (m) apiKey = m[1];
}

console.log('Using API key:', apiKey ? `${apiKey.slice(0, 8)}...` : 'None');

async function testModel(modelName: string) {
  console.log(`Testing model: ${modelName}`);
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });
  try {
    const result = await model.generateContent('Say hello');
    console.log(`✅ ${modelName} Response:`, result.response.text());
  } catch (error: any) {
    console.error(`❌ ${modelName} Failed:`, error.message);
  }
}

async function test() {
  if (!apiKey) {
    console.error('No GEMINI_API_KEY found in .env.local');
    return;
  }
  await testModel('gemini-1.5-flash');
  await testModel('gemini-2.5-flash');
  await testModel('gemini-1.5-pro');
  await testModel('gemini-2.5-pro');
}

test();
