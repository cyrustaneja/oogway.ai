import { GoogleGenerativeAI } from '@google/generative-ai';
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
model.generateContent('Hello')
  .then(res => console.log(res.response.text()))
  .catch(err => {
    console.log('STATUS:', err.status);
    console.log('MESSAGE:', err.message);
  });
