import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function findTimestampInTranscript(transcript: string | null | undefined, quote: string): string | null {
  if (!transcript || !quote) return null;

  // Normalize quote: lowercase, strip punctuation, strip extra whitespace
  const cleanString = (str: string) => 
    str.toLowerCase()
       .replace(/[\u2018\u2019\u201C\u201D''""]/g, '') // remove smart and straight quotes
       .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?\u2026\u2014]/g, ' ') // replace punctuation/ellipses/em-dashes with spaces
       .replace(/\s+/g, ' ')
       .trim();

  const cleanQuote = cleanString(quote);
  if (!cleanQuote) return null;

  const lines = transcript.split('\n');
  const words: { word: string; timestamp: string }[] = [];
  let currentTimestamp = '00:00:00';

  const TS_REGEX = /(\d{1,2}:\d{2}:\d{2})(?:\.\d+)?/;

  for (const line of lines) {
    const tsMatch = line.match(TS_REGEX);
    if (tsMatch) {
      currentTimestamp = tsMatch[1];
    }
    
    const lineTextWithoutTs = line.replace(/\[?\b\d{1,2}:\d{2}:\d{2}(?:\.\d+)?\]?/g, '');
    const cleanedLine = cleanString(lineTextWithoutTs);
    if (!cleanedLine) continue;

    const lineWords = cleanedLine.split(' ');
    for (const w of lineWords) {
      if (w) {
        words.push({ word: w, timestamp: currentTimestamp });
      }
    }
  }

  if (words.length === 0) return null;

  const reconstructed = words.map(w => w.word).join(' ');
  
  let matchIndex = reconstructed.indexOf(cleanQuote);
  
  if (matchIndex === -1) {
    const firstPart = cleanQuote.split(' ').slice(0, 5).join(' ');
    if (firstPart.length > 5) {
      matchIndex = reconstructed.indexOf(firstPart);
    }
  }
  
  if (matchIndex === -1) {
    const quoteParts = cleanQuote.split(' ');
    const lastPart = quoteParts.slice(Math.max(0, quoteParts.length - 5)).join(' ');
    if (lastPart.length > 5) {
      matchIndex = reconstructed.indexOf(lastPart);
    }
  }

  if (matchIndex === -1) return null;

  let charAcc = 0;
  for (let i = 0; i < words.length; i++) {
    if (charAcc >= matchIndex) {
      return words[i].timestamp;
    }
    charAcc += words[i].word.length + 1;
  }

  return words[words.length - 1].timestamp;
}

async function main() {
  const sessionId = 'cmpcm0dcm000769cjw50onxz7';
  const session = await prisma.analysisSession.findUnique({
    where: { id: sessionId },
    select: { transcript_clean: true, transcriptRaw: true }
  });
  if (!session) return;
  const transcript = session.transcript_clean ?? session.transcriptRaw ?? '';

  const unmatchedQuotes = [
    "Faram Enterprises, you can consider it as a brand that maybe you have started at home. And you're only selling on Amazon.",
    "dark stores, so these are, like, warehouses."
  ];

  console.log('=== Testing Fuzzy Timestamp Finder ===');
  for (const quote of unmatchedQuotes) {
    const ts = findTimestampInTranscript(transcript, quote);
    console.log(`\nQuote: "${quote}"`);
    console.log(`Found Timestamp: ${ts}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
