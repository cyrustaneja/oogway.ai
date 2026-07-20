import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { getSessionAnalysis } from '@/lib/server/analysis';
import { SessionPDFDocument } from '@/components/analysis/pdf/SessionPDFDocument';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const result = await getSessionAnalysis(id);
  if (!result) {
    return new NextResponse('Session analysis not found', { status: 404 });
  }

  const { data, chapters } = result;
  const safeChapters = chapters ?? [];

  try {
    const buffer = await renderToBuffer(
      React.createElement(SessionPDFDocument, { data, chapters: safeChapters }) as any,
    );

    const si = (data as any).session_info ?? {};
    const name = (si.name || 'session-analysis').replace(/[^a-z0-9]+/gi, '-').toLowerCase();

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${name}.pdf"`,
        'Content-Length': String(buffer.byteLength),
      },
    });
  } catch (err: any) {
    console.error('[PDF_GEN_ERROR]', err);
    return new NextResponse(`PDF Generation Failed: ${err.message}`, { status: 500 });
  }
}
