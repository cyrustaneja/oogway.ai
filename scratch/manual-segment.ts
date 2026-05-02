import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const sessionId = process.argv[2] || 'cmon88snj00033yrm8s8gp5tu';
  
  const chapters = [
    {
      chapter_index: 1,
      title: "Welcome, Attendance & Session Setup",
      t_start: 689,
      t_end: 840,
      type: "admin",
      one_line_summary: "Expert welcomed students, conducted attendance, and set the stage for the session.",
      transcript_quality_local: "Clean"
    },
    {
      chapter_index: 2,
      title: "Journey with Programmatic & Platform Access",
      t_start: 840,
      t_end: 1200,
      type: "teaching",
      one_line_summary: "Discussion on students' prior experience and verifying access to the programmatic platform.",
      transcript_quality_local: "Clean"
    },
    {
      chapter_index: 3,
      title: "Introduction to Audiences & Targeting Options",
      t_start: 1200,
      t_end: 2100,
      type: "teaching",
      one_line_summary: "Overview of audience types and the fundamental targeting options available.",
      transcript_quality_local: "Clean"
    },
    {
      chapter_index: 4,
      title: "Deep Dive: Contextual vs Behavioral Audiences",
      t_start: 2100,
      t_end: 3000,
      type: "teaching",
      one_line_summary: "Detailed explanation of the differences between contextual and behavioral targeting strategies.",
      transcript_quality_local: "Clean"
    },
    {
      chapter_index: 5,
      title: "Affinity, In-Market & Custom Audiences",
      t_start: 3000,
      t_end: 3900,
      type: "teaching",
      one_line_summary: "Exploring Google's affinity and in-market segments, plus custom intent audiences.",
      transcript_quality_local: "Clean"
    },
    {
      chapter_index: 6,
      title: "Retargeting vs Remarketing & Final Q&A",
      t_start: 3900,
      t_end: 4549,
      type: "qna",
      one_line_summary: "Clarifying the nuances between retargeting and remarketing, followed by session wrap-up.",
      transcript_quality_local: "Clean"
    }
  ];

  await prisma.analysisSession.update({
    where: { id: sessionId },
    data: {
      chapters_json: chapters,
      pipeline_stage: 'CHAPTERS_DETECTED',
      v3Status: 'EXTRACTING',
      next_action_at: new Date()
    }
  });

  console.log('Manual segmentation applied. Pipeline moved to Stage 2.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
