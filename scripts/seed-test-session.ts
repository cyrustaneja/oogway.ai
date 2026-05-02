// scripts/seed-test-session.ts
// Run with: npx tsx scripts/seed-test-session.ts
// Seeds one Expert + Batch + SessionNote + AnalysisSession with a sample Hindi/English transcript.

import { prisma } from "../lib/prisma";

const SAMPLE_TRANSCRIPT = `
[00:00:12] Vikram: Hello everyone, welcome to today's session on Brand Positioning. Aaj hum baat karenge ki ek brand apne customers ke mind mein kaise ek unique jagah banata hai.

[00:00:34] Vikram: Let me start with a simple example. Jab aap "luxury car" sunte ho, aapke mind mein kya aata hai? Mercedes? BMW? That's brand positioning at work.

[00:01:15] Vikram: Toh let's break this down. Brand positioning has three core elements: target audience, point of difference, and frame of reference. Hum ek-ek karke samjhenge.

[00:02:45] Vikram: Frame of reference matlab — kis category mein aap compete kar rahe ho. Ola is in the ride-sharing category. Zomato is in food delivery. Yeh frame define karta hai.

[00:04:20] Vikram: Point of difference — yeh sabse important hai. Why should the customer pick you over the competitor? Apple says "think different." That's their POD.

[00:06:10] Student Priya: Sir, kya hum yeh framework FMCG products pe bhi apply kar sakte hain?

[00:06:25] Vikram: Bilkul! In fact, FMCG mein toh yeh aur zyada critical hai. Soch toh — Surf Excel positions itself as "daag acche hain." That's emotional POD. Bachhon ko explore karne do, daag toh dho denge.

[00:08:40] Vikram: Now let's look at target audience. Yeh demographic plus psychographic hota hai. Demographic — age, income, gender. Psychographic — values, beliefs, lifestyle.

[00:11:05] Vikram: Quick exercise — close your eyes and think of Maggi. What's the target audience? Working mothers, students, office-goers. What's the POD? Convenience plus taste.

[00:13:30] Vikram: Acha ek aur point — positioning is not what YOU say about your brand. It's what the CUSTOMER perceives. That's the difference between intent and reality.

[00:16:15] Vikram: Let me share a case study. Tata Salt. They positioned as "desh ka namak." Patriotic plus reliable plus safe. Kitna powerful hai yeh positioning, especially Indian market mein.

[00:19:50] Vikram: Now common mistakes. Pehli galti — trying to position for everyone. Agar aap sabke liye ho, toh kisike bhi liye nahi ho. Focus is everything.

[00:22:30] Vikram: Doosri galti — positioning that doesn't deliver. Aap kuch promise karte ho, deliver kuch aur hota hai. Trust khatam ho jaata hai.

[00:25:00] Student Rohit: Sir, what about repositioning? Like when a brand changes its image?

[00:25:18] Vikram: Great question. Repositioning is a complete strategic exercise. Old Spice did this brilliantly — they were "your dad's brand," then they repositioned to younger millennials with the "I'm on a horse" campaign. Massive success.

[00:28:40] Vikram: Toh summary — three pillars: target audience, frame of reference, point of difference. Plus customer perception is reality. Plus avoid generic positioning.

[00:31:05] Vikram: For homework, pick a brand from your kitchen and write its positioning statement using this framework. Submit by Friday.

[00:32:20] Vikram: Alright, that's it for today. Koi questions hain?

[00:32:48] Vikram: No more questions? Thank you everyone, see you Friday.
`.trim();

async function main() {
  console.log("Seeding test data...\n");

  const expert = await prisma.expert.create({
    data: { 
      name: "Vikram Sharma",
      email: `vikram.sharma.${Date.now()}@example.com`
    },
  });
  console.log(`Expert: ${expert.id}`);

  const course = await prisma.course.create({
    data: { name: "Marketing Strategy" }
  });

  const batch = await prisma.batch.create({
    data: { 
      name: "MMP-Aug-2026-Test",
      courseId: course.id
    },
  });
  console.log(`Batch: ${batch.id}`);

  const module = await prisma.module.create({
    data: {
      name: "Brand Basics",
      courseId: course.id
    }
  });

  const sessionNote = await prisma.sessionNote.create({
    data: {
      name: "Brand Positioning Fundamentals",
      moduleId: module.id,
      keyTopics: [
        "Frame of reference",
        "Point of difference",
        "Target audience definition",
        "Common positioning mistakes",
        "Repositioning case studies",
      ],
    },
  });
  console.log(`SessionNote: ${sessionNote.id}`);

  const analysisSession = await prisma.analysisSession.create({
    data: {
      name: "Brand Positioning Analysis - Vikram Sharma",
      expertId: expert.id,
      batchId: batch.id,
      sessionNoteId: sessionNote.id,
      transcriptRaw: SAMPLE_TRANSCRIPT,
      pipeline_stage: "UPLOADED",
      v3Status: "PENDING"
    },
  });
  console.log(`\nAnalysisSession: ${analysisSession.id}`);
  console.log(`\n✓ Seed complete. Now run:`);
  console.log(`  for i in {1..15}; do curl -X POST http://localhost:3000/api/pipeline/tick && echo; sleep 5; done`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
