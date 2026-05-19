import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Querying completed sessions...");
  
  // Find all completed sessions
  const sessions = await prisma.analysisSession.findMany({
    where: {
      v3Status: "COMPLETE",
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      chapters_json: true,
      stage_attempts: true,
    },
  });

  if (sessions.length === 0) {
    console.log("No completed sessions found.");
    return;
  }

  console.log(`Found ${sessions.length} completed sessions.`);

  let totalDurationMs = 0;
  let minDurationMs = Infinity;
  let maxDurationMs = -Infinity;
  const durations: number[] = [];

  console.log("\n--- Detailed Completed Sessions List ---");
  for (const session of sessions) {
    const start = new Date(session.createdAt).getTime();
    const end = new Date(session.updatedAt).getTime();
    const durationMs = end - start;
    let chaptersCount = 0;
    if (session.chapters_json && Array.isArray(session.chapters_json)) {
      chaptersCount = session.chapters_json.length;
    } else if (session.chapters_json && typeof session.chapters_json === 'object') {
      const parsed = session.chapters_json as any;
      if (Array.isArray(parsed.chapters)) {
        chaptersCount = parsed.chapters.length;
      }
    }
    
    if (durationMs > 0) {
      durations.push(durationMs);
      totalDurationMs += durationMs;
      if (durationMs < minDurationMs) minDurationMs = durationMs;
      if (durationMs > maxDurationMs) maxDurationMs = durationMs;
      console.log(`- ${session.name.padEnd(45)} | Chapters: ${String(chaptersCount).padStart(2)} | Duration: ${(durationMs / 60000).toFixed(2)} min | Started: ${session.createdAt.toISOString()}`);
    }
  }

  if (durations.length === 0) {
    console.log("No valid durations calculated.");
    return;
  }

  const averageMs = totalDurationMs / durations.length;
  
  // Calculate median
  durations.sort((a, b) => a - b);
  const medianMs = durations[Math.floor(durations.length / 2)];

  console.log("\n=== Pipeline Processing Duration Statistics ===");
  console.log(`Total Completed Sessions Analyzed: ${durations.length}`);
  console.log(`Average Time: ${(averageMs / 60000).toFixed(2)} minutes (${(averageMs / 1000).toFixed(0)} seconds)`);
  console.log(`Median Time: ${(medianMs / 60000).toFixed(2)} minutes (${(medianMs / 1000).toFixed(0)} seconds)`);
  console.log(`Minimum Time: ${(minDurationMs / 60000).toFixed(2)} minutes (${(minDurationMs / 1000).toFixed(0)} seconds)`);
  console.log(`Maximum Time: ${(maxDurationMs / 60000).toFixed(2)} minutes (${(maxDurationMs / 1000).toFixed(0)} seconds)`);
}

main()
  .catch((err) => {
    console.error(err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
