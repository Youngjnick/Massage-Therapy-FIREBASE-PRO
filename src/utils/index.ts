// Type definitions
export interface Question {
  id: string;
  topic?: string;
  stats?: {
    correct?: number;
    incorrect?: number;
  };
  // Add more fields as needed for your app, or use unknown for extra fields
  [key: string]: unknown;
}

export interface TopicStats {
  correct: number;
  incorrect: number;
  total?: number;
  accuracy?: number;
}

/**
 * Randomly shuffles an array in place.
 */
export function shuffle<T>(array: T[]): T[] {
  let m = array.length, t: T, i: number;
  while (m) {
    i = Math.floor(Math.random() * m--);
    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }
  return array;
}

/**
 * Prettifies a name string, applying replacements and formatting.
 */
export function prettifyName(name: string): string {
  if (!name) { return ""; }
  const replacements: Record<string, string> = {
    soap: "SOAP", vs: "vs", mblex: "MBLEx", cpr: "CPR", emr: "EMR", hipaa: "HIPAA",
    rom: "ROM", cmt: "CMT", bpm: "BPM", pt: "PT", ot: "OT", prn: "PRN", npo: "NPO",
    bmi: "BMI", bmr: "BMR", cns: "CNS", cva: "CVA", dvt: "DVT", emt: "EMT", hmo: "HMO",
    iv: "IV", lmt: "LMT", mri: "MRI", nsaids: "NSAIDs", rmt: "RMT", rn: "RN", tbi: "TBI", tmj: "TMJ"
  };
  name = name.replace(/\.json$/i, "")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const lower = name.toLowerCase();
  if (replacements[lower]) { return replacements[lower]; }
  return name.replace(/\w\S*/g, txt =>
    replacements[txt.toLowerCase()] || txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}

/**
 * Formats a topic name for display.
 */
export function formatTopicName(topic: string): string {
  if (!topic) { return ""; }
  const replacements: Record<string, string> = {
    soap: "SOAP", vs: "vs", mblex: "MBLEx", cpr: "CPR", emr: "EMR", hipaa: "HIPAA",
    rom: "ROM", cmt: "CMT", bpm: "BPM", pt: "PT", ot: "OT", prn: "PRN", npo: "NPO",
    bmi: "BMI", bmr: "BMR", cns: "CNS", cva: "CVA", dvt: "DVT", emt: "EMT", hmo: "HMO",
    iv: "IV", lmt: "LMT", mri: "MRI", nsaids: "NSAIDs", rmt: "RMT", rn: "RN", tbi: "TBI", tmj: "TMJ"
  };
  return topic.replace(/_/g, " ")
    .replace(/\b\w+\b/g, (word) => replacements[word.toLowerCase()] || word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

/**
 * Returns per-topic accuracy stats from an array of questions.
 */
export function getAccuracyPerTopic(questions: Array<{ topic?: string; stats?: { correct?: number; incorrect?: number } }> = []) {
  const stats: Record<string, { correct: number; incorrect: number; accuracy?: number; total?: number }> = {};
  for (const q of questions) {
    const topic = q.topic;
    if (!topic) continue;
    if (!stats[topic]) stats[topic] = { correct: 0, incorrect: 0 };
    stats[topic].correct += q.stats?.correct || 0;
    stats[topic].incorrect += q.stats?.incorrect || 0;
  }
  for (const topic in stats) {
    const correct = stats[topic].correct;
    const incorrect = stats[topic].incorrect;
    const total = correct + incorrect;
    stats[topic].accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    stats[topic].total = total;
  }
  return stats;
}

/**
 * Returns the N most errored questions based on errorFrequencyMap in localStorage.
 */
export function getMostErroredQuestions<T extends { id: string }>(n = 5, questions: T[] = []): (T & { errorCount: number })[] {
  let errorMap: Record<string, Record<string, number>> = {};
  try {
    errorMap = JSON.parse(localStorage.getItem("errorFrequencyMap") || "{}") || {};
  } catch {}
  const arr = questions.map(q => ({
    ...q,
    errorCount: Object.values(errorMap[q.id] || {}).reduce((a, b) => a + b, 0)
  }));
  return arr.sort((a, b) => b.errorCount - a.errorCount).slice(0, n);
}

/**
 * Returns a smart recommendation string for the user.
 */
export function getSmartRecommendation(): string {
  return "Try reviewing your missed questions for better results!";
}

/**
 * Returns per-topic mastery stats from an array of questions.
 */
export function getTopicMastery(questions: Array<{ topic?: string; stats?: { correct?: number; incorrect?: number } }> = []) {
  const topicStats: Record<string, { correct: number; incorrect: number; total: number }> = {};
  questions.forEach((q) => {
    if (!q.topic) return;
    if (!topicStats[q.topic]) topicStats[q.topic] = { correct: 0, incorrect: 0, total: 0 };
    topicStats[q.topic].correct += q.stats?.correct || 0;
    topicStats[q.topic].incorrect += q.stats?.incorrect || 0;
    topicStats[q.topic].total += (q.stats?.correct || 0) + (q.stats?.incorrect || 0);
  });
  return topicStats;
}