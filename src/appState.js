export const appState = {
  current: 0,
  selectedTopic: "",
  quiz: [],
  correct: 0,
  streak: 0,
  missedQuestions: [],
  unansweredQuestions: [],
  bookmarkedQuestions: [],
  questions: [],
  sessionQuestionsAnswered: 0,
  questionTimes: JSON.parse(localStorage.getItem("questionTimes") || "{}"),
  questionStartTime: null,
  sessionStartTime: Date.now(),
  historyChart: null,
  accuracyChart: null,
};

export const SELECTORS = {
  quizCard: ".quiz-card",
  topicSelect: ".control[data-topic]",
  lengthSelect: ".control[data-quiz-length]",
  startBtn: ".start-btn",
  feedback: ".feedback",
  progressFill: ".progress-fill",
  progressPercent: ".progress-section span:last-child"
};

// (No export statement here; only use export const ... at the top)