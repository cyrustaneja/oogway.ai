/**
 * STAGE 5 — AGGREGATION
 * Compiles the individual Chapter Insights into a unified Session Flow timeline
 */

export interface ChapterExtractionDbRow {
  chapterIndex: number;
  chapterTitle: string;
  startTime: string; // From AnalysisChapter
  endTime: string;   // From AnalysisChapter
  resultJson: any;   // The output of PROMPT_CHAPTER_INSIGHTS
}

export interface SessionFlowChapter {
  chapter_index: number;
  chapter_title: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  percentage_of_session: number;
  what_was_taught: string;
  how_it_was_taught: string;
  analogies_and_examples: any[];
  technical_questions: any[];
  confusion_points: any[];
}

function timeStringToMinutes(timeSpan: string): number {
  const parts = timeSpan.split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 60 + parts[1] + parts[2] / 60;
  }
  return 0;
}

export function aggregateResults(chapters: ChapterExtractionDbRow[]): SessionFlowChapter[] {
  const sorted = [...chapters].sort((a, b) => a.chapterIndex - b.chapterIndex);
  
  const flow: SessionFlowChapter[] = [];
  let totalSessionMinutes = 0;

  // Pre-calculate durations
  for (const row of sorted) {
    const startMin = timeStringToMinutes(row.startTime);
    const endMin = timeStringToMinutes(row.endTime);
    const duration = Math.max(0.1, endMin - startMin); // fallback to 0.1 to avoid division by zero
    totalSessionMinutes += duration;
  }

  for (const row of sorted) {
    const startMin = timeStringToMinutes(row.startTime);
    const endMin = timeStringToMinutes(row.endTime);
    const duration = Math.max(0.1, endMin - startMin);
    const percentage = totalSessionMinutes > 0 ? (duration / totalSessionMinutes) * 100 : 0;
    
    // Safely extract from resultJson
    const j = row.resultJson || {};
    
    flow.push({
      chapter_index: row.chapterIndex,
      chapter_title: row.chapterTitle,
      start_time: row.startTime,
      end_time: row.endTime,
      duration_minutes: Number(duration.toFixed(1)),
      percentage_of_session: Number(percentage.toFixed(1)),
      what_was_taught: j.what_was_taught || "Not extracted",
      how_it_was_taught: j.how_it_was_taught || "Not extracted",
      analogies_and_examples: Array.isArray(j.analogies_and_examples) ? j.analogies_and_examples : [],
      technical_questions: Array.isArray(j.technical_questions) ? j.technical_questions : [],
      confusion_points: Array.isArray(j.confusion_points) ? j.confusion_points : [],
    });
  }

  return flow;
}
