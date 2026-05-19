import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function resetSession() {
  const sessionId = "cmoskn7hu0009j4a085pe4hrh";

  console.log(`Resetting session ${sessionId} with fresh timestamps...`);

  try {
    // 1. Reset the main AnalysisSession state
    // We set createdAt to NOW so the 240-minute timeout doesn't kill it immediately.
    await prisma.analysisSession.update({
      where: { id: sessionId },
      data: {
        pipeline_stage: "PREPROCESSED", // Skip Stage 0/1 since we already have chapters
        v3Status: "PENDING",
        next_action_at: new Date(),
        createdAt: new Date(), 
        v3Progress: "Force starting from Stage 2...",
        v3Error: null,
        stage_attempts: {},
      },
    });

    // 2. Wipe previous chapter results
    await prisma.analysisChapterResult.deleteMany({
      where: { session_id: sessionId },
    });

    // 3. Wipe previous synthesis/flags in AnalysisV2
    await prisma.analysisV2.deleteMany({
      where: { sessionId: sessionId },
    });

    console.log("✅ Session reset successful. Pipeline should pick it up now.");
  } catch (error) {
    console.error("❌ Failed to reset session:", error);
  } finally {
    await prisma.$disconnect();
  }
}

resetSession();
