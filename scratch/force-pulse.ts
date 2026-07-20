import { handleTier1Review } from '../lib/pipeline/handlers/stage1-tier1-reviewer';

async function main() {
  console.log("Starting pulse directly...");
  await handleTier1Review('cmrcghsjb000bph8wuyvunsxz');
  console.log("Done!");
}
main();
