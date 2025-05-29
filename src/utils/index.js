import { firestoreDb } from "../firebase/indexFirebase.js";

console.log("firebase DB instance:", firestoreDb);

function shuffle(array) {
  let m = array.length, t, i;
  while (m) {
    i = Math.floor(Math.random() * m--);
    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }
  return array;
}

function prettifyName(name) {
  if (!name) {return "";}
  const replacements = {
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
  if (replacements[lower]) {return replacements[lower];}
  return name.replace(/\w\S*/g, txt =>
    replacements[txt.toLowerCase()] || txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}

function formatTopicName(topic) {
  if (!topic) {return "";}
  return topic.replace(/_/g, " ").replace(/\bsoap\b/gi, "SOAP").replace(/\b\w/g, c => c.toUpperCase());
}

export function getSmartRecommendation() {
  return "Try reviewing your missed questions for better results!";
}

// Returns per-topic accuracy stats from an array of questions
function getAccuracyPerTopic(questions = []) {
  const stats = {};
  for (const q of questions) {
    const topic = q.topic;
    if (!topic) continue;
    if (!stats[topic]) stats[topic] = { correct: 0, total: 0 };
    stats[topic].correct += q.stats?.correct || 0;
    stats[topic].total += (q.stats?.correct || 0) + (q.stats?.incorrect || 0);
  }
  for (const topic in stats) {
    stats[topic].accuracy = stats[topic].total > 0 ? Math.round((stats[topic].correct / stats[topic].total) * 100) : 0;
  }
  return stats;
}

// Returns the N most errored questions based on errorFrequencyMap in localStorage
function getMostErroredQuestions(n = 5, questions = []) {
  let errorMap = {};
  try {
    errorMap = JSON.parse(localStorage.getItem("errorFrequencyMap") || "{}") || {};
  } catch {}
  const arr = questions.map(q => ({
    ...q,
    errorCount: Object.values(errorMap[q.id] || {}).reduce((a, b) => a + b, 0)
  }));
  return arr.sort((a, b) => b.errorCount - a.errorCount).slice(0, n);
}

// Returns per-topic mastery stats from an array of questions
function getTopicMastery(questions = []) {
  const topicStats = {};
  questions.forEach((q) => {
    if (!q.topic) {return;}
    if (!topicStats[q.topic]) {
      topicStats[q.topic] = { correct: 0, incorrect: 0, total: 0 };
    }
    topicStats[q.topic].correct += q.stats?.correct || 0;
    topicStats[q.topic].incorrect += q.stats?.incorrect || 0;
    topicStats[q.topic].total += (q.stats?.correct || 0) + (q.stats?.incorrect || 0);
  });
  return topicStats;
}

export {
    shuffle,
    prettifyName,
    formatTopicName,
    getAccuracyPerTopic,
    getMostErroredQuestions,
    getTopicMastery,
};