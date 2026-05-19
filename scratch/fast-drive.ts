import { handleStage2 } from '../lib/pipeline/handlers/stage2-chapter-extractor';
import { handleStage3 } from '../lib/pipeline/handlers/stage3-synthesizer';
import { handleStage4 } from '../lib/pipeline/handlers/stage4-flag-generator';
import { prisma } from '../lib/prisma';

const sessionId = 'cmp6qycs800035d33pdv53fln';

async function drive() {
  console.log('Driving session:', sessionId);
  
  while (true) {
    const session = await prisma.analysisSession.findUnique({
      where: { id: sessionId },
      select: { pipeline_stage: true, v3Status: true }
    });

    if (!session) {
      console.error('Session not found');
      break;
    }

    console.log('Current stage:', session.pipeline_stage, '| Status:', session.v3Status);

    if (session.pipeline_stage === 'COMPLETE' || session.pipeline_stage === 'FAILED') {
      console.log('Pipeline reached terminal state:', session.pipeline_stage);
      break;
    }

    try {
      if (session.pipeline_stage === 'CHAPTERS_DETECTED') {
        console.log('Running Stage 2 (Chapter Extractor)...');
        await handleStage2(sessionId);
      } else if (session.pipeline_stage === 'EXTRACTED') {
        console.log('Running Stage 3 (Synthesizer)...');
        await handleStage3(sessionId);
      } else if (session.pipeline_stage === 'SYNTHESIZED') {
        console.log('Running Stage 4 (Flag Generator)...');
        await handleStage4(sessionId);
      } else {
        console.log('Unknown or unhandled stage:', session.pipeline_stage);
        break;
      }
    } catch (e: any) {
      console.error('Error during stage execution:', e.message);
      // Wait a bit before retrying
      await new Promise(r => setTimeout(r, 5000));
    }

    // Small delay between ticks (tuned to avoid 429s)
    await new Promise(r => setTimeout(r, 5000));
  }
}

drive().catch(console.error);
