import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf-8');
const keyMatch = env.match(/GEMINI_API_KEY=([^\n]+)/);
const key = keyMatch ? keyMatch[1].trim() : '';

const genAI = new GoogleGenerativeAI(key);

async function testModel(modelName) {
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent('Say hello world');
    console.log(`[${modelName}] Success: ${result.response.text().trim()}`);
  } catch (e) {
    console.log(`[${modelName}] Error: ${e.message}`);
  }
}

async function main() {
  await testModel('gemini-1.5-flash');
  await testModel('gemini-1.5-flash-latest');
  await testModel('gemini-2.0-flash');
  await testModel('gemini-2.5-flash');
}

main();
