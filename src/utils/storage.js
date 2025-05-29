import LZString from "lz-string";

// --- 5. STORAGE & DATA ---
export function saveUserData(missedQuestions) {
  localStorage.setItem("missedQuestions", JSON.stringify(missedQuestions));
}
export function loadUserData() {
  return JSON.parse(localStorage.getItem("missedQuestions")) || [];
}
export function saveStats(stats) {
  localStorage.setItem("stats", JSON.stringify(stats));
}
export function loadStats() {
  return JSON.parse(localStorage.getItem("stats")) || {};
}
export function saveQuizResult(result) {
  localStorage.setItem("quizResult", JSON.stringify(result));
}
export function updateQuestionMeta(qid, isCorrect) {
  const questions = JSON.parse(localStorage.getItem("questions")) || [];
  const question = questions.find(q => q.id === qid);
  if (question) {
    question.stats = question.stats || {};
    question.stats.attempts = (question.stats.attempts || 0) + 1;
    if (isCorrect) {
      question.stats.correct = (question.stats.correct || 0) + 1;
    }
    localStorage.setItem("questions", JSON.stringify(questions));
  }
}
export function getMasteredQuestionIds(questions, threshold = 3) {
  return questions.filter(q => q.stats?.correct >= threshold).map(q => q.id);
}

export function saveQuestionsToLocalStorage(questions) {
  const compressed = LZString.compress(JSON.stringify(questions));
  localStorage.setItem("questions", compressed);
}

export function loadQuestionsFromLocalStorage() {
  const compressed = localStorage.getItem("questions");
  return compressed ? JSON.parse(LZString.decompress(compressed)) : [];
}

export function fetchQuestionsFromLocalStorage() {
  try {
    const questions = loadQuestionsFromLocalStorage();
    console.log("DEBUG: fetched questions from local storage", questions);
    return questions;
  } catch (error) {
    console.error("Error reading questions from local storage:", error);
    return [];
  }
}

export function saveCompressedToLocalStorage(key, data) {
  const compressed = LZString.compress(JSON.stringify(data));
  localStorage.setItem(key, compressed);
}

export function loadCompressedFromLocalStorage(key) {
  const compressed = localStorage.getItem(key);
  return compressed ? JSON.parse(LZString.decompress(compressed)) : null;
}

/**
 * Save quiz progress locally (for offline use).
 */
export function saveProgressLocally(progress) {
  const allProgress = JSON.parse(localStorage.getItem("offlineProgress") || "[]");
  allProgress.push(progress);
  localStorage.setItem("offlineProgress", JSON.stringify(allProgress));
}

/**
 * Sync offline progress to Firestore when back online.
 */
export function setupOfflineProgressSync(saveProgressToFirestore) {
  window.addEventListener("online", async () => {
    const offlineProgress = JSON.parse(localStorage.getItem("offlineProgress") || "[]");
    for (const progress of offlineProgress) {
      await saveProgressToFirestore(progress); // You must implement this function
    }
    localStorage.removeItem("offlineProgress");
  });
}

