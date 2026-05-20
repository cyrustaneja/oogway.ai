import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function testModel(modelName: string) {
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent('Say hello world');
    console.log(`[${modelName}] Success: ${result.response.text().trim()}`);
  } catch (e: any) {
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
