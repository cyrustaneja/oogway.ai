import React from 'react';
import { renderToFile } from '@react-pdf/renderer';
import { PrismaClient } from '@prisma/client';
import { getSessionAnalysis } from './lib/server/analysis';
import { SessionPDFDocument } from './components/analysis/pdf/SessionPDFDocument';

async function test() {
  const sessionId = 'cmp6qycs800035d33pdv53fln';
  const result = await getSessionAnalysis(sessionId);
  if (!result) {
    console.error('Session not found');
    process.exit(1);
  }

  const { data, chapters } = result;
  try {
    console.log('Generating PDF...');
    await renderToFile(
      React.createElement(SessionPDFDocument, { data, chapters }) as any,
      './scratch/test-pdf.pdf'
    );
    console.log('PDF generated successfully at ./scratch/test-pdf.pdf');
  } catch (err) {
    console.error('PDF generation failed:', err);
  }
  process.exit(0);
}

test();
