// ===============================
// Massage Therapy Smart Study PRO
// Main App Logic (Refactored & Commented)
// ===============================

// --- GLOBAL STATE ---

const SELECTORS = {
  quizCard: ".quiz-card",
  topicSelect: ".control[data-topic]",
  lengthSelect: ".control[data-quiz-length]",
  startBtn: ".start-btn",
  feedback: ".feedback",
  progressFill: ".progress-fill",
  progressPercent: ".progress-section span:last-child"
};

let current = 0;
let selectedTopic = "";
let quiz = [];
let correct = 0;
let streak = 0;
let missedQuestions = [];
let unansweredQuestions = [];
let bookmarkedQuestions = [];
let questions = [];
let sessionQuestionsAnswered = 0;
let questionTimes = JSON.parse(localStorage.getItem("questionTimes") || "{}");
let questionStartTime = null;
let sessionStartTime = Date.now();

window.historyChart = null;
window.accuracyChart = null;

// --- BADGES Imported by FIREBASE---
import badges from "./badges.js";
import * as badgeFns from "./generated_badge_conditions.js";

// Attach the correct condition function to each badge by id
badges.forEach(badge => {
  // Normalize id for function name (replace - and spaces and % with _)
  const fnName = "checkUnlock_" + badge.id.replace(/[-\s%]/g, "_");
  if (typeof badgeFns[fnName] !== "function") {
    console.warn(`No unlock function found for badge id: ${badge.id}`);
  }
  badge.condition = badgeFns[fnName] || (() => false);
});

// User streak/badge progress data (store separately)
const userStreakData = {
  user_id: "user_001",
  current_streak_days: 22,
  last_session_date: "2025-05-18",
  streak_resume_date: "2025-05-17",
  grace_used: true,
  badges: {
    streak_3: { times_earned: 5, last_earned_date: "2025-05-15", glow_state: "on" },
    streak_10: { times_earned: 3, last_earned_date: "2025-05-16", glow_state: "on" },
    streak_20: { times_earned: 1, last_earned_date: "2025-05-17", glow_state: "off" },
    streak_10x3: { unlocked: true, unlocked_date: "2025-05-16", glow_state: "pulsing" },
    streak_3x5: { unlocked: true, unlocked_date: "2025-05-15", glow_state: "pulsing" }
  }
};
// --- UTILITY FUNCTIONS ---

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
  if (!name) return "";
  // List of acronyms and special cases (add more as needed)
  const replacements = {
    soap: "SOAP",
    vs: "vs",
    mblex: "MBLEx",
    cpr: "CPR",
    emr: "EMR",
    hipaa: "HIPAA",
    rom: "ROM",
    cmt: "CMT",
    bpm: "BPM",
    pt: "PT",
    ot: "OT",
    prn: "PRN",
    npo: "NPO",
    bmi: "BMI",
    bmr: "BMR",
    cns: "CNS",
    cva: "CVA",
    dvt: "DVT",
    emt: "EMT",
    hmo: "HMO",
    iv: "IV",
    lmt: "LMT",
    mri: "MRI",
    nsaids: "NSAIDs",
    rmt: "RMT",
    rn: "RN",
    tbi: "TBI",
    tmj: "TMJ",
    // Add more as needed
  };
  // Clean up name
  name = name.replace(/\.json$/i, "")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  // If the whole name matches a replacement, return it
  const lower = name.toLowerCase();
  if (replacements[lower]) return replacements[lower];
  // Otherwise, capitalize each word unless it's a replacement
  return name.replace(/\w\S*/g, txt =>
    replacements[txt.toLowerCase()] || txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}

function formatTopicName(topic) {
  if (!topic) return "";
  return topic.replace(/_/g, " ").replace(/\bsoap\b/gi, "SOAP").replace(/\b\w/g, c => c.toUpperCase());
}

// --- FIREBASE CONFIG ---

import { firebaseConfig } from "./firebaseConfig.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-analytics.js";
import { getFirestore, setDoc, getDoc, doc, collection, addDoc, getDocs, collectionGroup } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, onAuthStateChanged, signOut, getRedirectResult } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";

// --- INITIALIZE FIREBASE APP FIRST ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const analytics = getAnalytics(app);
const provider = new GoogleAuthProvider();

function isMobile() {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

async function signInWithGoogle() {
  try {
    if (isMobile()) {
      await signInWithRedirect(auth, provider);
    } else {
      await signInWithPopup(auth, provider);
    }
  } catch (error) {
    if (error.code === "auth/popup-closed-by-user") {
      showNotification("Sign-in cancelled", "You closed the sign-in window before completing authentication.", "badges/summary.png");
    } else {
      showNotification("Sign-in failed", error.message, "badges/summary.png");
    }
  }
}

// --- QUESTION LOADING ---

async function loadQuestionsFromFirestore() {
  console.log("Loading questions from Firestore...");
  const itemsSnapshot = await getDocs(collectionGroup(db, "items"));
  let loadedQuestions = [];
  itemsSnapshot.forEach(docSnap => {
    loadedQuestions.push({ id: docSnap.id, ...docSnap.data() });
  });
  console.log("Fetched questions:", loadedQuestions);
  return loadedQuestions;
}

function ensureQuestionMetadata(questions) {
  questions.forEach(q => {
    if (!q.stats) {
      q.stats = { correct: 0, incorrect: 0 };
    }
  });
}

// --- APP INIT ---

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result && result.user) {
      // User signed in via redirect
      console.log("Redirect sign-in successful:", result.user);
    }
  } catch (error) {
    console.error("Redirect sign-in error:", error);
  }

  const statusElem = document.querySelector("#status");
  if (statusElem) statusElem.innerText = "Checking authentication...";

  onAuthStateChanged(auth, async user => {
    console.log("Auth state changed. User:", user); // <-- Add this
    if (user) {
      if (statusElem) statusElem.innerText = "Loading questions...";
      questions = await loadQuestionsFromFirestore();
      console.log("Questions loaded from Firestore:", questions); // <-- Add this
      ensureQuestionMetadata(questions);
      if (questions.length === 0) {
        if (statusElem) statusElem.innerText = "No questions found!";
        return;
      }
      if (statusElem) statusElem.innerText = "";
      startQuiz(questions);
      setupUI();
      populateTopicDropdown();
      showNotification("Welcome!", "Challenge your skills with Massage Therapy Smart Study PRO!", "badges/welcome.png");
      renderChartsOnLoad();
    } else {
      if (statusElem) statusElem.innerText = "Please sign in to access questions.";
      // Optionally, hide quiz UI until signed in
    }
  });
}); // <-- Add this closing brace and parenthesis

// --- UI & QUIZ LOGIC ---

function setupUI() {
  const topicSelect = document.querySelector(SELECTORS.topicSelect);
  const lengthSelect = document.querySelector(SELECTORS.lengthSelect);
  const startBtn = document.querySelector(SELECTORS.startBtn);

  function updateStartBtn() {
    if (startBtn) startBtn.disabled = !(topicSelect.value && lengthSelect.value);
  }
  if (topicSelect) {
    topicSelect.addEventListener("change", () => {
      selectedTopic = topicSelect.value;
      updateStartBtn();
    });
  }
  if (lengthSelect) lengthSelect.addEventListener("change", updateStartBtn);
  if (startBtn) startBtn.addEventListener("click", () => {
    let quizPool = [];
    const topic = topicSelect.value;
    const length = lengthSelect.value === "all" ? 9999 : parseInt(lengthSelect.value, 10);

    if (topic === "unanswered") quizPool = unansweredQuestions;
    else if (topic === "missed") quizPool = missedQuestions.map(id => questions.find(q => q.id === id)).filter(Boolean);
    else if (topic === "bookmarked") quizPool = bookmarkedQuestions;
    else if (topic === "review_unmastered") quizPool = getQuestionsMastered(0);
    else if (topic === "review_most_missed") quizPool = getMostErroredQuestions();
    else if (topic === "adaptive_quiz") quizPool = getAdaptiveQuiz();
    else if (topicSelect.value && topicSelect.value.includes("::")) {
      const [topic, unit] = topicSelect.value.split("::");
      quizPool = questions.filter(q => q.topic.trim() === topic && q.unit.trim() === unit);
    } else {
      quizPool = questions.filter(q => q.topic === topicSelect.value);
    }
    startQuiz(quizPool.slice(0, length));
  });

  document.querySelectorAll(".smart-learning a, .smart-learning-link").forEach(link =>
    link.addEventListener("click", showSmartLearningModal)
  );
  document.querySelectorAll(".view-analytics a, .analytics-link").forEach(link =>
    link.addEventListener("click", showAnalyticsModal)
  );
}

async function populateTopicDropdown() {
  const topicSelect = document.querySelector(SELECTORS.topicSelect);
  topicSelect.innerHTML = ""; // Clear existing options

  // Add "-- Select Topic --" option
  const selectOption = document.createElement("option");
  selectOption.value = "";
  selectOption.textContent = "-- Select Topic --";
  selectOption.disabled = true;
  selectOption.selected = true;
  topicSelect.appendChild(selectOption);

  // Add "All Topics" option
  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = "All Topics";
  topicSelect.appendChild(allOption);

  // Group questions by topic and unit (subtopic)
  const topicMap = {};
  questions.forEach(q => {
    if (!topicMap[q.topic]) topicMap[q.topic] = new Set();
    if (q.unit) topicMap[q.topic].add(q.unit);
  });

  // Add topics and subtopics as selectable options
  Object.entries(topicMap).forEach(([topic, units]) => {
    // Main topic as selectable option (bold via CSS if desired)
    const topicOption = document.createElement("option");
    topicOption.value = topic;
    topicOption.textContent = "★ " + prettifyName(topic);
    topicOption.className = "main-topic-option";
    topicSelect.appendChild(topicOption);

    // Subtopics (units) as indented options
    units.forEach(unitPath => {
      const unitName = unitPath.split("/").pop();
      const subOption = document.createElement("option");
      subOption.value = `${topic}::${unitPath}`;
      subOption.textContent = "  " + prettifyName(unitName); // Use em-spaces for indent
      topicSelect.appendChild(subOption);
    });
  });
}

function startQuiz(quizPool) {
  quiz = shuffle([...quizPool].filter(q => Array.isArray(q.answers)));
  current = 0; correct = 0; streak = 0;
  const quizCard = document.querySelector(SELECTORS.quizCard);
  if (quizCard) quizCard.classList.remove("hidden");
  renderQuestion();
}

function renderQuestion(q) {
  q = q || quiz[current];
  const quizCard = document.querySelector(SELECTORS.quizCard);

  if (!quiz || quiz.length === 0) {
    if (quizCard) quizCard.innerHTML = "<p>No questions available for this quiz!</p>";
    return;
  }
  if (!q || !Array.isArray(q.answers)) {
    if (quizCard) quizCard.innerHTML = "<p>Invalid question data. Please try another quiz or topic.</p>";
    return;
  }
  const answerObjs = q.answers.map((a, i) => ({
    text: a,
    isCorrect: i === q.correct
  }));
  shuffle(answerObjs);

  renderQuizHeader(q);

  const quizHeaderStrong = document.querySelector(".quiz-header strong");
  if (quizHeaderStrong) quizHeaderStrong.textContent = formatTopicName(selectedTopic);

  const questionText = document.querySelector(".question-text");
  if (questionText) questionText.textContent = q.question;

  renderAnswers(answerObjs);

  const feedbackElem = document.querySelector(SELECTORS.feedback);
  if (feedbackElem) feedbackElem.textContent = "";

  quizCard.querySelectorAll(".question-actions").forEach(el => el.remove());
  renderQuestionActions(q);
}

/**
 * Render the quiz header row with topic, streak, and bookmark button.
 */
function renderQuizHeader(q) {
  const mastered = getQuestionsMastered().length;
  const total = questions.length;
  const quizHeader = document.querySelector(".quiz-header");
  if (!quizHeader) return;
  quizHeader.querySelector(".quiz-header-row")?.remove();

  const headerRow = document.createElement("div");
  headerRow.className = "quiz-header-row";
  headerRow.innerHTML = `
    <div class="topic-streak">
      <span>TOPIC: <strong>${prettifyName(selectedTopic)}</strong></span>
      <span style="margin-left: 16px;">Streak: <span id="quizStreak">${streak}</span></span>
      <span style="margin-left: 16px;"><strong>Mastery:</strong> ${mastered}/${total}</span>
    </div>
  `;

  // Only update masteryStatus if it exists
  const masteryStatusElem = document.getElementById("masteryStatus");
  if (masteryStatusElem) {
    masteryStatusElem.innerHTML = `
      <strong>Mastery:</strong> ${mastered}/${total}
    `;
  }

  const bookmarkBtn = document.createElement("button");
  bookmarkBtn.className = "bookmark-btn";
  bookmarkBtn.textContent = q.bookmarked ? "Unbookmark" : "Bookmark";
  bookmarkBtn.setAttribute("aria-label", q.bookmarked ? "Unbookmark this question" : "Bookmark this question");
  bookmarkBtn.addEventListener("click", () => {
    q.bookmarked = !q.bookmarked;
    bookmarkBtn.textContent = q.bookmarked ? "Unbookmark" : "Bookmark";
    bookmarkBtn.setAttribute("aria-label", q.bookmarked ? "Unbookmark this question" : "Bookmark this question");
    toggleBookmark(q.id);
    bookmarkedQuestions = getBookmarkedQuestions(questions);
  });

  headerRow.appendChild(bookmarkBtn);
  quizHeader.appendChild(headerRow);
}

/**
 * Render answer buttons for the current question.
 */
function renderAnswers(answerObjs) {
  const answersDiv = document.getElementById("answers");
  answersDiv.innerHTML = "";
  answerObjs.forEach((ansObj, i) => {
    const btn = document.createElement("div");
    btn.className = "answer";
    btn.textContent = `${String.fromCharCode(65 + i)}. ${ansObj.text}`;
    btn.setAttribute("role", "button");
    btn.setAttribute("tabindex", "0");
    btn.setAttribute("aria-pressed", "false");
    btn.setAttribute("aria-label", `Answer ${String.fromCharCode(65 + i)}: ${ansObj.text}`);
    btn.addEventListener("click", () => {
      handleAnswerClick(ansObj.isCorrect, btn);
      btn.setAttribute("aria-pressed", "true");
    });
    btn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        handleAnswerClick(ansObj.isCorrect, btn);
        btn.setAttribute("aria-pressed", "true");
      }
    });
    answersDiv.appendChild(btn);
  });
}

/**
 * Render action buttons (suggest, report, flag, rate) for the current question.
 */
function renderQuestionActions(q) {
  const quizCard = document.querySelector(SELECTORS.quizCard);
  const actionsDiv = document.createElement("div");
  actionsDiv.className = "question-actions";
  actionsDiv.setAttribute("role", "group");
  actionsDiv.setAttribute("aria-label", "Question actions");

  actionsDiv.appendChild(createSuggestBtn());
  actionsDiv.appendChild(createReportBtn());
  actionsDiv.appendChild(createFlagBtn());
  actionsDiv.appendChild(createRateDiv(q.id));

  quizCard.appendChild(actionsDiv);
}

/**
 * Create the "Suggest a Question" button and modal.
 */
function createSuggestBtn() {
  const btn = document.createElement("button");
  btn.textContent = "Suggest a Question";
  btn.className = "suggest-btn";
  btn.addEventListener("click", () => {
    openModal("Suggest a Question", `
      <form id="suggestForm">
        <label>Question:<br><input type="text" id="suggestQ" required></label><br>
        <label>Answer A:<br><input type="text" id="suggestA" required></label><br>
        <label>Answer B:<br><input type="text" id="suggestB" required></label><br>
        <label>Answer C:<br><input type="text" id="suggestC"></label><br>
        <label>Answer D:<br><input type="text" id="suggestD"></label><br>
        <label>Correct Answer (A/B/C/D):<br><input type="text" id="suggestCorrect" required maxlength="1"></label><br>
        <label>Topic:<br><input type="text" id="suggestTopic" required></label><br>
        <button type="submit">Submit</button>
      </form>
    `);
    document.getElementById("suggestForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const suggestion = {
        question: document.getElementById("suggestQ").value,
        answers: [
          document.getElementById("suggestA").value,
          document.getElementById("suggestB").value,
          document.getElementById("suggestC").value,
          document.getElementById("suggestD").value,
        ].filter(Boolean),
        correct: ["A","B","C","D"].indexOf(document.getElementById("suggestCorrect").value.toUpperCase()),
        topic: document.getElementById("suggestTopic").value,
        submittedAt: new Date().toISOString()
      };
      await submitSuggestionToFirestore(suggestion);
      showNotification("Thank you!", "Your suggestion has been submitted.", "badges/summary.png");
      document.querySelector(".modal-overlay").remove();
    });
  });
  btn.setAttribute("aria-pressed", "true");
  return btn;
}

/**
 * Create the "Report Question" button and modal.
 */
function createReportBtn() {
  const btn = document.createElement("button");
  btn.textContent = "Report Question";
  btn.className = "report-btn";
  btn.addEventListener("click", () => {
    openModal("Report Question", `
      <form id="reportForm">
        <p>Why are you reporting this question?</p>
        <textarea id="reportReason" required style="width:100%;height:60px;"></textarea><br>
        <button type="submit">Submit Report</button>
      </form>
    `);
    document.getElementById("reportForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const report = {
        questionId: quiz[current].id,
        question: quiz[current].question,
        reason: document.getElementById("reportReason").value,
        reportedAt: new Date().toISOString()
      };
      await submitReportToFirestore(report);
      showNotification("Thank you!", "Your report has been submitted.", "badges/summary.png");
      document.querySelector(".modal-overlay").remove();
    });
  });
  btn.setAttribute("aria-pressed", "true");
  return btn;
}

/**
 * Create the "Flag as Unclear" button.
 */
function createFlagBtn() {
  const btn = document.createElement("button");
  btn.textContent = "Flag as Unclear";
  btn.className = "flag-unclear-btn";
  btn.addEventListener("click", async () => {
    const qid = quiz[current].id;
    let unclearFlags = JSON.parse(localStorage.getItem("unclearFlags") || "{}");
    unclearFlags[qid] = (unclearFlags[qid] || 0) + 1;
    localStorage.setItem("unclearFlags", JSON.stringify(unclearFlags));

    try {
      await addDoc(collection(db, "unclearFlags"), {
        questionId: qid,
        flaggedAt: new Date().toISOString(),
        user: auth.currentUser?.uid || null
      });
    } catch (error) {
      showNotification("Error", "Failed to flag as unclear. Try again later.", "badges/summary.png");
      console.error("Error flagging as unclear:", error);
    }
    showNotification("Thank you!", "This question has been flagged as unclear.", "badges/summary.png");
  });
  btn.setAttribute("aria-pressed", "true");
  return btn;
}

/**
 * Create the star rating UI for the current question.
 */
function createRateDiv(qid) {
  const rateDiv = document.createElement("div");
  rateDiv.className = "rate-question";
  rateDiv.innerHTML = `
    <span>Rate: </span>
    ${[1, 2, 3, 4, 5].map(n =>
      `<span class="star" data-star="${n}" style="cursor:pointer;font-size:1.2em;color:#ccc;">&#9734;</span>`
    ).join("")}
  `;
  const stars = rateDiv.querySelectorAll(".star");
  const ratings = JSON.parse(localStorage.getItem("questionRatings") || "{}");
  const savedRating = ratings[qid] || 0;
  stars.forEach((star, index) => {
    star.style.color = index < savedRating ? "gold" : "#ccc";
    star.addEventListener("click", () => {
      stars.forEach((s, i) => s.style.color = i <= index ? "gold" : "#ccc");
      const rating = index + 1;
      ratings[qid] = rating;
      localStorage.setItem("questionRatings", JSON.stringify(ratings));
      showNotification("Thank you!", `You rated this question ${rating} stars.`, "badges/summary.png");
    });
    star.addEventListener("mouseover", () => {
      stars.forEach((s, i) => s.style.color = i <= index ? "gold" : "#ccc");
    });
    star.addEventListener("mouseout", () => {
      stars.forEach((s, i) => s.style.color = i < savedRating ? "gold" : "#ccc");
    });
  });
  return rateDiv;
}

/**
 * Create the confidence rating UI for the current question.
 */
function createConfidenceDiv(qid) {
  const confidenceDiv = document.createElement("div");
  confidenceDiv.className = "confidence-rating";
  confidenceDiv.innerHTML = `
    <span>Confidence: </span>
    ${[1, 2, 3, 4, 5].map(n =>
      `<span class="confidence-dot" data-confidence="${n}" style="cursor:pointer;font-size:1.5em;color:#ccc;">●</span>`
    ).join("")}
    <span id="confidenceLabel" style="margin-left:8px;font-size:0.9em;color:#888;"></span>
  `;
  const dots = confidenceDiv.querySelectorAll(".confidence-dot");
  const labels = ["Not confident", "Slightly", "Neutral", "Confident", "Very confident"];
  const confidences = JSON.parse(localStorage.getItem("questionConfidence") || "{}");
  const saved = confidences[qid] || 0;
  dots.forEach((dot, index) => {
    dot.style.color = index < saved ? "#6BCB77" : "#ccc";
    dot.addEventListener("click", () => {
      dots.forEach((d, i) => d.style.color = i <= index ? "#6BCB77" : "#ccc");
      confidences[qid] = index + 1;
      localStorage.setItem("questionConfidence", JSON.stringify(confidences));
      confidenceDiv.querySelector("#confidenceLabel").textContent = labels[index];
      showNotification("Thank you!", `You rated your confidence: ${labels[index]}.`, "badges/summary.png");
    });
    dot.addEventListener("mouseover", () => {
      confidenceDiv.querySelector("#confidenceLabel").textContent = labels[index];
    });
    dot.addEventListener("mouseout", () => {
      confidenceDiv.querySelector("#confidenceLabel").textContent = saved ? labels[saved - 1] : "";
    });
  });
  if (saved) confidenceDiv.querySelector("#confidenceLabel").textContent = labels[saved - 1];
  return confidenceDiv;
}

/**
 * Handle answer selection, update streak, feedback, and progress.
 */
function handleAnswerClick(isCorrect, btn) {
  if (!quiz[current]) return;
  btn.classList.add(isCorrect ? "correct" : "incorrect");
  updateStreak(isCorrect);
  updateProgress(current + 1, quiz.length);

  const feedback = document.querySelector(SELECTORS.feedback);
  const qid = quiz[current].id;

  if (!isCorrect) {
    const correctAnswer = quiz[current].answers[quiz[current].correct];
    feedback.textContent = `Incorrect! The correct answer is: ${correctAnswer}`;
    feedback.style.color = "red";
    if (!missedQuestions.includes(qid)) {
      missedQuestions.push(qid);
      saveUserData();
    }
    quiz[current].stats = quiz[current].stats || { correct: 0, incorrect: 0 };
    quiz[current].stats.incorrect++;
    localStorage.setItem("review_" + qid, JSON.stringify({
      lastMissed: Date.now(),
      interval: 24 * 60 * 60 * 1000
    }));
    recordWrongAnswer(qid, btn.textContent);
  } else {
    feedback.textContent = "Correct!";
    feedback.style.color = "green";
    missedQuestions = missedQuestions.filter(id => id !== qid);
    saveUserData();
    quiz[current].stats = quiz[current].stats || { correct: 0, incorrect: 0 };
    quiz[current].stats.correct++;
  }
  const explanation = quiz[current].explanation || "";
  feedback.innerHTML += explanation ? `<br><em>${explanation}</em>` : "";
  if (isCorrect) correct++;
  unansweredQuestions = unansweredQuestions.filter(q => q.id !== qid);

  setTimeout(() => {
    current++;
    if (current >= quiz.length) {
      showSummary();
      return;
    }
    renderQuestion();
    renderAccuracyChart(correct, current - correct, quiz.length - current);
  }, 1500);
  updateQuestionMeta(qid, isCorrect);

  // Track time to answer
  if (questionStartTime) {
    const elapsed = Date.now() - questionStartTime;
    questionTimes[qid] = questionTimes[qid] || [];
    questionTimes[qid].push(elapsed);
    localStorage.setItem("questionTimes", JSON.stringify(questionTimes));
    questionStartTime = null;
  }
  sessionQuestionsAnswered++;
  logDailyProgress();

  // Add this line to save stats after each answer
  saveStats();
  saveQuizResult();
  saveStatsToFirestore(); // <-- add this
}

/**
 * Log daily progress for streaks.
 */
function logDailyProgress() {
  const today = new Date().toISOString().slice(0, 10);
  const progress = JSON.parse(localStorage.getItem("dailyProgress") || "{}");
  progress[today] = (progress[today] || 0) + 1;
  localStorage.setItem("dailyProgress", JSON.stringify(progress));
}

/**
 * Update the user's streak and check for badge unlocks.
 */
function updateStreak(isCorrect) {
  streak = isCorrect ? streak + 1 : 0;
  document.getElementById("quizStreak").textContent = streak;
  checkBadges();
}

/**
 * Update the quiz progress bar and percentage.
 */
function updateProgress(current, total) {
  const progress = Math.round((current / total) * 100);
  document.querySelector(SELECTORS.progressFill).style.width = `${progress}%`;
  document.querySelector(SELECTORS.progressPercent).textContent = `${progress}%`;
}

/**
 * Show quiz summary and review/smart review buttons if needed.
 */
function showSummary() {
  const accuracy = quiz.length > 0 ? Math.round((correct / quiz.length) * 100) : 0;
  showNotification("Quiz Summary", `You answered ${correct} out of ${quiz.length} questions correctly (${accuracy}% accuracy).`, "badges/summary.png");
  checkBadges();
  if (missedQuestions.length > 0) showReviewMissedBtn();
  if (getQuestionsForSmartReview().length > 0) showSmartReviewBtn();
  saveQuizResult();
}

/**
 * Show a button to review missed questions after quiz.
 */
function showReviewMissedBtn() {
  const reviewBtn = document.createElement("button");
  reviewBtn.textContent = "Review Missed Questions";
  reviewBtn.className = "modal-btn";
  reviewBtn.onclick = () => {
    quiz = questions.filter(q => missedQuestions.includes(q.id));
    current = 0; correct = 0; streak = 0;
    document.querySelector(SELECTORS.quizCard).classList.remove("hidden");
    renderQuestion();
    document.querySelector(".notification-container")?.remove();
  };
  setTimeout(() => {
    document.body.appendChild(reviewBtn);
    setTimeout(() => reviewBtn.remove(), 5000);
  }, 500);
}

/**
 * Show a button to smart review questions after quiz.
 */
function showSmartReviewBtn() {
  const smartReviewBtn = document.createElement("button");
  smartReviewBtn.textContent = "Smart Review Questions";
  smartReviewBtn.className = "modal-btn";
  smartReviewBtn.onclick = () => {
    quiz = getQuestionsForSmartReview();
    current = 0; correct = 0; streak = 0;
    document.querySelector(SELECTORS.quizCard).classList.remove("hidden");
    renderQuestion();
    document.querySelector(".notification-container")?.remove();
  };
  setTimeout(() => {
    document.body.appendChild(smartReviewBtn);
    setTimeout(() => smartReviewBtn.remove(), 5000);
  }, 500);
}

/**
 * Start a review session for unmastered questions.
 */
function startUnmasteredReview() {
  quiz = shuffle(getQuestionsMastered(0)); // Or set a threshold
  current = 0; correct = 0; streak = 0;
  document.querySelector(SELECTORS.quizCard).classList.remove("hidden");
  renderQuestion();
}

// --- MODALS ---
/**
 * Open a modal dialog with the given title and content.
 * @param {string} title
 * @param {string} content
 * @param {boolean} [toggle=false]
 */
function openModal(title, content, toggle = false) {
  // Always remove any existing modal
  const existingModal = document.querySelector(".modal-overlay");
  if (existingModal) existingModal.remove();

  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-label", title);
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h2>${title}</h2>
        <button class="close-modal">&times;</button>
      </div>
      <div class="modal-body">${content}</div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector(".close-modal").addEventListener("click", () => modal.remove());
  modal.addEventListener("click", () => modal.remove());
  modal.querySelector(".modal").addEventListener("click", (e) => e.stopPropagation());
  modal.querySelector(".close-modal").setAttribute("aria-label", "Close modal");
  document.addEventListener("keydown", function escListener(e) {
    if (e.key === "Escape") {
      modal.remove();
      document.removeEventListener("keydown", escListener);
    }
  });
  setTimeout(() => {
    const modalBody = document.querySelector(".modal-body");
    if (modalBody) modalBody.scrollTop = 0;
  }, 0);
}

/**
 * Show the Smart Learning modal with badge grid.
 */
function showSmartLearningModal(e) {
  if (e) e.preventDefault();
  // Always use a fallback if earnedBadges is not loaded yet
  const earned = Array.isArray(earnedBadges) ? earnedBadges : JSON.parse(localStorage.getItem("earnedBadges") || "[]");
  openModal("Smart Learning", `
    <p>Smart Learning helps you focus on missed or unanswered questions to improve your knowledge.</p>
    <div class="badge-grid">
      ${badges.map(badge => `
        <div class="badge-item ${earned.includes(badge.id) ? "" : "unearned"}">
          <img src="badges/${badge.id}.png" alt="${badge.name}" />
          <p>${badge.name}</p>
        </div>
      `).join("")}
    </div>
  `);
}

/**
 * Show the Analytics modal with charts and mastery stats.
 */
function showAnalyticsModal(e) {
  if (e) e.preventDefault();
  const totalQuestions = quiz.length;
  const unansweredQuestionsCount = totalQuestions - current;
  const incorrectAnswers = current - correct;
  const accuracy = totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;
  const stats = { totalQuestions, correctAnswers: correct, incorrectAnswers, unansweredQuestions: unansweredQuestionsCount, accuracy, streak };
  const topicStats = getTopicMastery();

  // Calculate average, fastest, and slowest time per question
  const times = Object.values(questionTimes).flat();
  const avgTime = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
  const fastest = times.length ? Math.min(...times) : 0;
  const slowest = times.length ? Math.max(...times) : 0;

  function getSessionDuration() {
    const now = Date.now();
    const durationMs = now - sessionStartTime;
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }

  // --- NEW: Topic mastery heatmap ---
  const masteryGrid = `
    <div class="topic-heatmap" style="display: flex; flex-direction: column; gap: 2px; width: 100%;">
      ${Object.entries(topicStats).map(([topic, stat]) => {
        const acc = stat.total ? stat.correct / stat.total : 0;
        const percent = Math.round(acc * 100);
        return `
          <div class="topic-progress-row" style="display:flex;align-items:center;gap:8px;min-height:20px;">
            <span 
              style="flex:2 1 180px;font-size:0.97em;overflow-wrap:break-word;" 
              title="${formatTopicName(topic)}"
            >${formatTopicName(topic)}</span>
            <div class="topic-progress-bar" style="flex:4 1 120px;height:8px;background:#222;border-radius:4px;overflow:hidden;margin:0 6px;">
              <div style="height:100%;width:${percent}%;background:${masteryColor(acc)};transition:width 0.4s;"></div>
            </div>
            <span style="width:38px;text-align:left;font-size:0.97em;">${percent}%</span>
          </div>
        `;
      }).join("")}
    </div>
  `;

  openModal("View Analytics", `
    <p>Track your progress, accuracy, confidence, and streaks over time to measure your improvement.</p>
    <div style="display: flex; flex-direction: column; align-items: center; gap: 20px;">
      <canvas id="accuracyChart" width="200" height="200"></canvas>
      <canvas id="confidenceChart" width="200" height="200" style="margin-top:16px;"></canvas>
      <canvas id="masteryHistoryChart" width="300" height="120" style="margin-top:16px;"></canvas>
      <ul style="list-style: none; padding: 0; text-align: left;">
        <li><strong>Total Questions Attempted:</strong> ${stats.totalQuestions}</li>
        <li><strong>Correct Answers:</strong> ${stats.correctAnswers}</li>
        <li><strong>Incorrect Answers:</strong> ${stats.incorrectAnswers}</li>
        <li><strong>Unanswered Questions:</strong> ${stats.unansweredQuestions}</li>
        <li><strong>Accuracy:</strong> ${stats.accuracy}%</li>
        <li><strong>Current Streak:</strong> ${stats.streak}</li>
        <li><strong>Session Duration:</strong> ${getSessionDuration()}</li>
        <li><strong>Questions Answered This Session:</strong> ${sessionQuestionsAnswered}</li>
        <li><strong>Average Time per Question:</strong> ${avgTime} ms</li>
        <li><strong>Fastest:</strong> ${fastest} ms</li>
        <li><strong>Slowest:</strong> ${slowest} ms</li>
        <li><strong>Next Best Quiz:</strong> ${getSmartRecommendation()}</li>
      </ul>
      <h4 style="margin-top:16px;">Mastery by Topic</h4>
      ${masteryGrid}
      <h4 style="margin-top:16px;">Quiz History</h4>
      <canvas id="historyChart" width="300" height="120"></canvas>
    </div>
  `);

  // Render all charts after modal is open
  requestAnimationFrame(() => {
    renderAccuracyChart(stats.correctAnswers, stats.incorrectAnswers, stats.unansweredQuestions);
    renderHistoryChart();
    renderConfidenceChart();
    renderMasteryHistoryChart();
  });
}

function renderMasteryHistoryChart() {
  const data = JSON.parse(localStorage.getItem("masteryHistory") || "[]");
  const ctxElem = document.getElementById("masteryHistoryChart");
  if (!ctxElem) return;
  if (window.masteryHistoryChart && typeof window.masteryHistoryChart.destroy === "function") {
    window.masteryHistoryChart.destroy();
    window.masteryHistoryChart = null;
  }
  window.masteryHistoryChart = new Chart(ctxElem.getContext("2d"), {
    type: "line",
    data: {
      labels: data.map(d => new Date(d.date).toLocaleDateString()),
      datasets: [{
        label: "Average Mastery (%)",
        data: data.map(d => d.avgMastery),
        borderColor: "#6BCB77",
        fill: false,
      }]
    },
    options: { responsive: true }
  });
}

const masteryHistory = JSON.parse(localStorage.getItem("masteryHistory") || "[]");
const topicStats = getTopicMastery();
const avgMastery = Object.values(topicStats).length
  ? Math.round(Object.values(topicStats).reduce((sum, stat) => sum + (stat.total ? stat.correct / stat.total : 0), 0) / Object.values(topicStats).length * 100)
  : 0;
masteryHistory.push({ date: new Date().toISOString(), avgMastery });
localStorage.setItem("masteryHistory", JSON.stringify(masteryHistory));

/**
 * Reset all user progress and settings.
 */
function resetAll() {
  if (!confirm("Are you sure you want to reset all progress and settings? This cannot be undone.")) return;
  localStorage.clear();
  location.reload();
}

// --- CHARTS ---
function renderChartsOnLoad() {
  const stats = {
    correct: correct,
    incorrect: quiz.length - correct,
    unanswered: quiz.length > 0 ? quiz.length - current : 0
  };
  renderAccuracyChart(stats.correct, stats.incorrect, stats.unanswered);
  renderHistoryChart();
}

function renderAccuracyChart(correct, incorrect, unanswered) {
  const ctxElem = document.getElementById("accuracyChart");
  if (!ctxElem) return;
  if (window.accuracyChart) {
    window.accuracyChart.destroy();
    window.accuracyChart = null;
  }
  const ctx = ctxElem.getContext("2d");
  window.accuracyChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Correct", "Incorrect", "Unanswered"],
      datasets: [{
        data: [correct, incorrect, unanswered],
        backgroundColor: ["#6BCB77", "#FF6B6B", "#FFD93D"],
        hoverBackgroundColor: ["#8FDCA8", "#FF8787", "#FFE066"],
        borderWidth: 1,
        borderColor: "#ffffff",
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom", labels: { font: { size: 14 } } },
      },
      cutout: "85%",
    },
  });
}

function renderHistoryChart() {
  const results = JSON.parse(localStorage.getItem("quizResults")) || [];
  const ctx = document.getElementById("historyChart")?.getContext("2d");
  if (!ctx) return;
  if (window.historyChart) window.historyChart.destroy();
  window.historyChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: results.length ? results.map(r => new Date(r.date).toLocaleDateString()) : ["No Data"],
      datasets: [
        {
          label: "Accuracy (%)",
          data: results.length
            ? results.map(r =>
                r.total > 0 && typeof r.score === "number"
                  ? Math.max(0, Math.round((r.score / r.total) * 100))
                  : 0
              )
            : [0],
          borderColor: "#007bff",
          fill: false,
        },
        {
          label: "Streak",
          data: results.length
            ? results.map(r => typeof r.streak === "number" ? Math.max(0, r.streak) : 0)
            : [0],
          borderColor: "#FFD93D",
          fill: false,
        }
      ]
    },
    options: { responsive: true }
  });
}

function renderConfidenceChart() {
  const ctxElem = document.getElementById("confidenceChart");
  if (!ctxElem) return;
  // Only destroy if it's a Chart instance
  if (window.confidenceChart && typeof window.confidenceChart.destroy === "function") {
    window.confidenceChart.destroy();
    window.confidenceChart = null;
  }
  const confidences = JSON.parse(localStorage.getItem("questionConfidence") || "{}");
  const values = Object.values(confidences);
  const counts = [1,2,3,4,5].map(n => values.filter(v => v === n).length);
  window.confidenceChart = new Chart(ctxElem.getContext("2d"), {
    type: "bar",
    data: {
      labels: ["Not confident", "Slightly", "Neutral", "Confident", "Very confident"],
      datasets: [{
        label: "Number of Answers",
        data: counts,
        backgroundColor: "#6BCB77"
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 } }
      }
    }
  });
}

// --- NOTIFICATIONS ---
/**
 * Show a notification with title, message, and image.
 * @param {string} title
 * @param {string} message
 * @param {string} imageUrl
 */
function showNotification(title, message, imageUrl) {
  let container = document.getElementById("notification-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "notification-container";
    container.className = "notification-container";
    container.setAttribute("role", "alert");
    container.setAttribute("aria-live", "assertive");
    document.body.appendChild(container);
  }
  const notification = document.createElement("div");
  notification.className = "notification";
  notification.innerHTML = `<h3>${title}</h3><p>${message}</p><img src="${imageUrl}" alt="${title}" />`;
  container.appendChild(notification);
  setTimeout(() => {
    notification.remove();
    if (container.children.length === 0) container.remove();
  }, 3000);
}

// --- BADGES ---
 /* Show a modal for a newly earned badge.
 */
function showBadgeModal(badge) {
  openModal("New Achievement Unlocked!", `
    <h3>${badge.name}</h3>
    <p>${badge.description}</p>
    <img src="badges/${badge.id}.png" alt="${badge.name}" style="width: 100px; height: 100px;" />
  `);
}

// --- STORAGE & DATA ---
/**
 * Save user stats to localStorage.
 */
function saveStats() {
  localStorage.setItem("quizStats", JSON.stringify({
    streak,
    correct,
    missedQuestions,

    masteredQuestions: getMasteredQuestionIds(), // <-- now defined
    sessionQuestionsAnswered,
    // add any other stats you want to persist
  }));
}

/**
 * Load user stats from localStorage.
 */
function loadStats() {
  const savedStats = JSON.parse(localStorage.getItem("userStats"));
  if (savedStats) {
    correct = savedStats.correct || 0;
    streak = savedStats.streak || 0;
    current = savedStats.current || 0;
    quiz = quiz.slice(0, savedStats.quizLength || quiz.length);
  }
}

/**
 * Save missed questions to localStorage.
 */
function saveUserData() {
  localStorage.setItem("missedQuestions", JSON.stringify(missedQuestions));
}

/**
 * Load missed questions from localStorage.
 */
function loadUserData() {
  missedQuestions = JSON.parse(localStorage.getItem("missedQuestions")) || [];
}

/**
 * Save quiz result to localStorage and update history chart.
 */
function saveQuizResult() {
  const results = JSON.parse(localStorage.getItem("quizResults")) || [];
  results.push({ streak, total: quiz.length, score: correct, date: new Date().toISOString() });
  localStorage.setItem("quizResults", JSON.stringify(results));
  renderHistoryChart();
}

/**
 * Update question metadata (attempts, correct/incorrect count, last attempt time).
 */
function updateQuestionMeta(qid, isCorrect) {
  const metaMap = JSON.parse(localStorage.getItem("questionMeta") || "{}");
  if (!metaMap[qid]) {
    metaMap[qid] = { attempts: 0, correct: 0, incorrect: 0, lastAttempt: null };
  }
  metaMap[qid].attempts++;
  if (isCorrect) metaMap[qid].correct++;
  else metaMap[qid].incorrect++;
  metaMap[qid].lastAttempt = Date.now();
  localStorage.setItem("questionMeta", JSON.stringify(metaMap));
}

// --- ANALYTICS ---
/**
 * Get mastery stats for each topic.
 * @returns {Object}
 */
function getTopicMastery() {
  const topicStats = {};
  questions.forEach(q => {
    if (!q.topic) return;
    if (!topicStats[q.topic]) topicStats[q.topic] = { correct: 0, incorrect: 0, total: 0 };
    topicStats[q.topic].correct += q.stats?.correct || 0;
    topicStats[q.topic].incorrect += q.stats?.incorrect || 0;
    topicStats[q.topic].total += (q.stats?.correct || 0) + (q.stats?.incorrect || 0);
  });
  return topicStats;
}

/**
 * Get color for topic mastery based on accuracy.
 */
function masteryColor(accuracy) {
  // accuracy: 0.0 (red) to 1.0 (green)
  const r = Math.round(255 * (1 - accuracy));
  const g = Math.round(200 * accuracy + 80 * (1 - accuracy));
  return `rgb(${r},${g},86)`; // Red to green
}

/**
 * Get questions that need smart review (low accuracy or multiple misses).
 * @returns {Array}
 */
function getQuestionsForSmartReview() {
  return questions.filter(q => (q.stats?.incorrect || 0) > 1 || ((q.stats?.correct || 0) / ((q.stats?.correct || 0) + (q.stats?.incorrect || 0))) < 0.7);
}

/**
 * Get accuracy stats for each topic.
 * @returns {Object}
 */
function getAccuracyPerTopic() {
  const stats = {};
  questions.forEach(q => {
    if (!q.topic) return;
    if (!stats[q.topic]) stats[q.topic] = { correct: 0, total: 0 };
    stats[q.topic].correct += q.stats?.correct || 0;
    stats[q.topic].total += (q.stats?.correct || 0) + (q.stats?.incorrect || 0);
  });
  Object.keys(stats).forEach(topic => {
    stats[topic].accuracy = stats[topic].total > 0 ? Math.round((stats[topic].correct / stats[topic].total) * 100) : 0;
  });
  return stats;
}

/**
 * Get questions that have been mastered.
 * @param {number} [threshold=3] - The number of correct answers required to consider a question mastered.
 * @returns {Array}
 */
function getQuestionsMastered(threshold = 3) {
  return questions.filter(q => q.stats?.correct >= threshold);
}

/**
 * Get questions that have been repeated.
 * @returns {Array}
 */
function getQuestionsRepeated() {
  return questions.filter(q => (q.stats?.correct || 0) + (q.stats?.incorrect || 0) > 1);
}

/**
 * Get topics with the lowest accuracy.
 * @param {number} [n=3] - The number of topics to return.
 * @returns {Array}
 */
function getLowestAccuracyTopics(n = 3) {
  const acc = getAccuracyPerTopic();
  return Object.entries(acc)
    .sort((a, b) => a[1].accuracy - b[1].accuracy)
    .slice(0, n)
    .map(([topic]) => topic);
}

/**
 * Get questions with the most errors.
 * @param {number} [n=5] - The number of questions to return.
 * @returns {Array}
 */
function getMostErroredQuestions(n = 5) {
  const errorMap = JSON.parse(localStorage.getItem("errorFrequencyMap") || "{}");
  return Object.entries(errorMap)
    .map(([qid, errors]) => ({
      qid,
      totalErrors: Object.values(errors).reduce((a, b) => a + b, 0)
    }))
    .sort((a, b) => b.totalErrors - a.totalErrors)
    .slice(0, n)
    .map(e => questions.find(q => q.id === e.qid))
    .filter(Boolean);
}

/**
 * Get adaptive quiz questions based on user performance.
 * Focus on most missed and low mastery questions.
 */
function getAdaptiveQuiz() {
  const mostMissed = getMostErroredQuestions(10);
  const lowMastery = questions.filter(q => {
    const stats = q.stats || {};
    const total = (stats.correct || 0) + (stats.incorrect || 0);
    return total > 0 && ((stats.correct || 0) / total) < 0.7;
  });
  const adaptivePool = [...new Set([...mostMissed, ...lowMastery])];
  return adaptivePool.length > 0 ? adaptivePool : questions;
}

/**
 * Get smart quiz questions based on lowest accuracy and least recent attempts.
 * @param {number} [limit=20] - The maximum number of questions to return.
 * @returns {Array}
 */
function getSmartQuizQuestions(limit = 20) {
  const metaMap = JSON.parse(localStorage.getItem("questionMeta") || "{}");
  const sorted = questions
    .map(q => {
      const meta = metaMap[q.id] || {};
      const accuracy = meta.attempts ? (meta.correct || 0) / meta.attempts : 0;
      return { ...q, meta, accuracy };
    })
    .sort((a, b) => {
      if (a.accuracy !== b.accuracy) return a.accuracy - b.accuracy;
      return (a.meta.lastAttempt || 0) - (b.meta.lastAttempt || 0);
    });
  return sorted.slice(0, limit);
}

// Example: Build quiz from selected tags
function buildCustomQuiz(questions, selectedTags, count = 10) {
  const pool = questions.filter(q => q.tags.some(tag => selectedTags.includes(tag)));
  return pool.slice(0, count);
}

function getSmartRecommendation() {
  const lowest = getLowestAccuracyTopics(1)[0];
  if (lowest) {
    return `Focus on <strong>${formatTopicName(lowest)}</strong> for best improvement!`;
  }
  return "Keep practicing to improve your mastery!";
}

function getConfidenceAccuracyCorrelation() {
  const confidences = JSON.parse(localStorage.getItem("questionConfidence") || "{}");
  let confidentAndCorrect = 0, confidentTotal = 0, lowConfAndWrong = 0, lowConfTotal = 0;
  questions.forEach(q => {
    const conf = confidences[q.id];
    if (conf >= 4) { // confident
      confidentTotal++;
      if (q.stats?.correct > q.stats?.incorrect) confidentAndCorrect++;
    } else if (conf && conf <= 2) { // not confident
      lowConfTotal++;
      if ((q.stats?.incorrect || 0) > (q.stats?.correct || 0)) lowConfAndWrong++;
    }
  });
  return {
    confidentAccuracy: confidentTotal ? Math.round(100 * confidentAndCorrect / confidentTotal) : 0,
    lowConfError: lowConfTotal ? Math.round(100 * lowConfAndWrong / lowConfTotal) : 0
  };
}

// --- BOOKMARKS ---
/**
 * Toggle bookmark state for a question.
 */
function toggleBookmark(questionId) {
  let bookmarks = JSON.parse(localStorage.getItem("bookmarkedQuestions")) || [];
  if (bookmarks.includes(questionId)) bookmarks = bookmarks.filter(id => id !== questionId);
  else bookmarks.push(questionId);
  localStorage.setItem("bookmarkedQuestions", JSON.stringify(bookmarks));
}

/**
 * Get all bookmarked questions from the full question list.
 */
function getBookmarkedQuestions(allQuestions) {
  const bookmarks = JSON.parse(localStorage.getItem("bookmarkedQuestions")) || [];
  return allQuestions.filter(q => bookmarks.includes(q.id));
}

// --- TOPIC DROPDOWN ---
// Example: Group questions by unit (top-level folder)
function groupQuestionsByUnit(manifest) {
  const units = {};
  manifest.forEach(path => {
    // Extract the unit name (first folder after 'questions/')
    const match = path.match(/^questions\/([^/]+)\//);
    if (match) {
      const unit = match[1];
      if (!units[unit]) units[unit] = [];
      units[unit].push(path);
    }
  });
  return units;
}

// --- FIREBASE HELPERS ---
async function submitSuggestionToFirestore(suggestion) {
  try {
    await addDoc(collection(db, "suggestedQuestions"), suggestion);
  } catch (error) {
    showNotification("Error", "Failed to submit suggestion. Try again later.", "badges/summary.png");
    console.error("Error submitting suggestion:", error);
  }
}

async function submitReportToFirestore(report) {
  try {
    await addDoc(collection(db, "reportedQuestions"), report);
  } catch (error) {
    showNotification("Error", "Failed to submit report. Try again later.", "badges/summary.png");
    console.error("Error submitting report:", error);
  }
}

async function saveUserProfile(uid, data) {
  try {
    await setDoc(doc(db, "users", uid), data, { merge: true });
    showNotification("Success", "Your progress was saved!", "badges/summary.png");
  } catch (error) {
    showNotification("Error", "Failed to save your progress. Please try again.", "badges/summary.png");
    console.error("Error saving user profile:", error);
  }
}

async function loadUserProfile(uid) {
  const statusElem = document.querySelector("#status");
  try {
    if (statusElem) statusElem.innerText = "Loading your profile...";
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      // Merge Firestore data into your app state as needed
      showNotification("Loaded", "Your profile was loaded.", "badges/summary.png");
    } else {
      showNotification("Info", "No profile found. Start practicing to save your progress!", "badges/summary.png");
    }
  } catch (error) {
    showNotification("Error", "Failed to load your profile. Please try again.", "badges/summary.png");
    console.error("Error loading user profile:", error);
  } finally {
    if (statusElem) statusElem.innerText = "";
  }
}

// Sign in with Google (global sign-in button)
document.getElementById("signInBtn")?.addEventListener("click", async () => {
  console.log("Sign-in button clicked"); // Debug: confirm handler fires
  const provider = new GoogleAuthProvider();
  try {
    if (isMobile()) {
      console.log("Using signInWithRedirect");
      await signInWithRedirect(auth, provider);
    } else {
      console.log("Using signInWithPopup");
      await signInWithPopup(auth, provider);
    }
  } catch (error) {
    console.error("Google sign-in error:", error); // Debug: log errors
    alert("Sign-in failed: " + (error && error.message ? error.message : error));
  }
});

// Sign out
const signOutBtn = document.getElementById("signOutBtn");
if (signOutBtn) signOutBtn.addEventListener("click", async () => {
  await signOut(auth);
});
const signoutBtn = document.getElementById("signout-btn");
if (signoutBtn) signoutBtn.onclick = () => signOut(auth);

// Update UI on auth state change
const profileAvatar = document.getElementById("profileAvatar");
onAuthStateChanged(auth, user => {
  if (user) {
    if (profileAvatar) profileAvatar.src = user.photoURL || "default-avatar.png";
    document.getElementById("signout-btn").style.display = "block";
  } else {
    if (profileAvatar) profileAvatar.src = "default-avatar.png";
    document.getElementById("signout-btn").style.display = "none";
  }
});

// Try to load earnedBadges from Firestore (if signed in), else from localStorage
let earnedBadges = [];

onAuthStateChanged(auth, async user => {
  if (user) {
    // Try to load from Firestore
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists() && Array.isArray(userDoc.data().earnedBadges)) {
      earnedBadges = userDoc.data().earnedBadges;
    } else {
      earnedBadges = [];
    }
  } else {
    // Fallback to localStorage if not signed in
    earnedBadges = JSON.parse(localStorage.getItem("earnedBadges") || "[]");
  }
});

export { saveUserProfile, loadUserProfile, showNotification, getStreak };

/**
 * Get streak data from localStorage.
 * @returns {Object}
 */
function getStreak() {
  let progress;
  try {
    progress = JSON.parse(localStorage.getItem("dailyProgress") || "{}");
  } catch (e) {
    progress = {};
  }
  const todayStr = new Date().toISOString().slice(0, 10);
  const days = Object.keys(progress)
    .filter(date => date <= todayStr) // Ignore future dates
    .sort()
    .reverse();
  let streak = 0;
  let d = new Date();
  for (let i = 0; i < days.length; i++) {
    if (days[i] === d.toISOString().slice(0, 10)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

/**
 * Get IDs of mastered questions (3+ correct by default).
 * @returns {Array}
 */
function getMasteredQuestionIds(threshold = 3) {
  return questions.filter(q => q.stats?.correct >= threshold).map(q => q.id);
}

// --- END OF FILE ---

// Collect answer stats as users answer questions
// Then render with Chart.js as a bar chart

function getSpacedRepetitionQuestions() {
  const now = Date.now();
  return questions.filter(q => {
    const review = JSON.parse(localStorage.getItem("review_" + q.id) || "{}");
    return !review.lastMissed || now > (review.lastMissed + (review.interval || 86400000));
  });
}

document.getElementById("soundFeedbackToggle")?.addEventListener("change", (e) => {
  localStorage.setItem("soundFeedback", e.target.checked ? "on" : "off");
});
document.getElementById("darkModeToggle")?.addEventListener("change", (e) => {
  const enabled = e.target.checked;
  localStorage.setItem("darkMode", enabled ? "on" : "off");
  document.body.classList.toggle("dark-mode", enabled);
});

if (localStorage.getItem("darkMode") === "on") {
  document.body.classList.add("dark-mode");
}

document.getElementById("questionSearchBtn")?.addEventListener("click", () => {
  const query = document.getElementById("questionSearchInput").value.trim().toLowerCase();
  const resultsDiv = document.getElementById("searchResults");
  if (!query) {
    resultsDiv.innerHTML = "";
    return;
  }
  const results = questions.filter(q =>
    q.question.toLowerCase().includes(query) ||
    (q.topic && q.topic.toLowerCase().includes(query)) ||
    (q.answers && q.answers.some(a => a.toLowerCase().includes(query)))
  );
  if (results.length === 0) {
    resultsDiv.innerHTML = "<p>No questions found.</p>";
    return;
  }
  resultsDiv.innerHTML = results.map(q => `
    <div class="search-result" style="margin-bottom:12px;">
      <strong>${formatTopicName(q.topic)}</strong><br>
      <span>${q.question}</span>
      <button class="modal-btn" onclick="startSingleQuestion('${q.id}')">Review</button>
    </div>
  `).join("");
});

// Helper to start a review of a single question
window.startSingleQuestion = function(qid) {
  const q = questions.find(q => q.id === qid);
  if (!q) return;
  quiz = [q];
  current = 0; correct = 0; streak = 0;
  document.querySelector(".quiz-card").classList.remove("hidden");
  renderQuestion();
  document.getElementById("searchResults").innerHTML = "";
};

function updateMasteryStatus() {
  const mastered = getQuestionsMastered().length;
  const total = questions.length;
  document.getElementById("masteryStatus").innerHTML = `
    <strong>Mastery:</strong> ${mastered}/${total}
  `;
}

// --- END OF FILE ---

function showProfileModal() {
  const user = auth.currentUser;
  openModal("Profile", `
    <div style="text-align:center;">
      <img src="${user?.photoURL || 'default-avatar.png'}" alt="Avatar" style="width:80px;height:80px;border-radius:50%;margin-bottom:12px;">
      <h3>${user?.displayName || "User"}</h3>
      <p><strong>Email:</strong> ${user?.email || "Not signed in"}</p>
      <div style="margin:16px 0;">
        <button class="modal-btn" id="smartLearningBtn">Smart Learning</button>
        <button class="modal-btn" id="viewAnalyticsBtn">View Analytics</button>
      </div>
      <div style="margin:16px 0;">
        <label style="margin-right:12px;">
          <input type="checkbox" id="profileDarkModeToggle" ${document.body.classList.contains("dark-mode") ? "checked" : ""}>
          Dark Mode
        </label>
        <label>
          <input type="checkbox" id="profileSoundToggle" ${localStorage.getItem("soundFeedback") === "on" ? "checked" : ""}>
          Sound Feedback
        </label>
      </div>
      <div style="margin-top:16px;">
        ${user
          ? `<button class="modal-btn" onclick="signOut()">Sign Out</button>`
          : `<button class="modal-btn" onclick="document.getElementById('signInBtn').click()">Sign In with Google</button>`
        }
      </div>
    </div>
  `);

  setTimeout(() => {
    document.getElementById("smartLearningBtn")?.addEventListener("click", showSmartLearningModal);
    document.getElementById("viewAnalyticsBtn")?.addEventListener("click", showAnalyticsModal);
    document.getElementById("profileDarkModeToggle")?.addEventListener("change", (e) => {
      const enabled = e.target.checked;
      localStorage.setItem("darkMode", enabled ? "on" : "off");
      document.body.classList.toggle("dark-mode", enabled);
    });
    document.getElementById("profileSoundToggle")?.addEventListener("change", (e) => {
      localStorage.setItem("soundFeedback", e.target.checked ? "on" : "off");
    });
  }, 0);
}
window.showProfileModal = showProfileModal;

/**
 * Record a wrong answer for analytics or review purposes.
 * @param {string} qid - The question ID.
 * @param {string} answer - The given answer.
 */
function recordWrongAnswer(q) {
  // Optionally log or store wrong answers here
  // Example: missedQuestions.push(q);
}

document.getElementById("profileBtn")?.addEventListener("click", showProfileModal);

// --- FIRESTORE STATS ---

async function saveStatsToFirestore() {
  if (!auth.currentUser) return;
  const stats = {
    streak,
    correct,
    missedQuestions,
    masteredQuestions: getMasteredQuestionIds(),
    sessionQuestionsAnswered,
    quizResults: JSON.parse(localStorage.getItem("quizResults") || "[]"),
    questionConfidence: JSON.parse(localStorage.getItem("questionConfidence") || "{}"),
    masteryHistory: JSON.parse(localStorage.getItem("masteryHistory") || "[]"),
    lastUpdated: new Date().toISOString()
  };
  await setDoc(doc(db, "users", auth.currentUser.uid), { stats }, { merge: true });
}

/**
 * Merge Firestore stats with local stats and update localStorage.
 * Call this after login to ensure all progress is preserved.
 */
function mergeStats(local, remote) {
  // Merge arrays and deduplicate by unique keys (e.g., date or id)
  function mergeArray(localArr, remoteArr, key = "date") {
    const map = {};
    [...(localArr || []), ...(remoteArr || [])].forEach(item => {
      if (item && item[key]) map[item[key]] = item;
    });
    return Object.values(map);
  }

  // Merge objects (e.g., confidence ratings)
  function mergeObject(localObj, remoteObj) {
    return { ...(localObj || {}), ...(remoteObj || {}) };
  }

  // Merge numbers (take max or sum as needed)
  function mergeNumber(localNum, remoteNum, mode = "max") {
    if (mode === "sum") return (localNum || 0) + (remoteNum || 0);
    return Math.max(localNum || 0, remoteNum || 0);
  }

  return {
    streak: mergeNumber(local.streak, remote.streak, "max"),
    correct: mergeNumber(local.correct, remote.correct, "sum"),
    missedQuestions: Array.from(new Set([...(local.missedQuestions || []), ...(remote.missedQuestions || [])])),
    masteredQuestions: Array.from(new Set([...(local.masteredQuestions || []), ...(remote.masteredQuestions || [])])),
    sessionQuestionsAnswered: mergeNumber(local.sessionQuestionsAnswered, remote.sessionQuestionsAnswered, "sum"),
    quizResults: mergeArray(local.quizResults, remote.quizResults, "date"),
    questionConfidence: mergeObject(local.questionConfidence, remote.questionConfidence),
    masteryHistory: mergeArray(local.masteryHistory, remote.masteryHistory, "date"),
    exp: mergeNumber(local.exp, remote.exp, "sum"),
    earnedBadges: Array.from(new Set([...(local.earnedBadges || []), ...(remote.earnedBadges || [])])),
    // Add more fields as needed
  };
}

/**
 * Load and merge stats from Firestore with localStorage.
 */
async function loadStatsFromFirestore() {
  if (!auth.currentUser) return;
  const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
  if (userDoc.exists() && userDoc.data().stats) {
    const remote = userDoc.data().stats;
    const local = {
      streak: parseInt(localStorage.getItem("streak") || "0", 10),
      correct: parseInt(localStorage.getItem("correct") || "0", 10),
      missedQuestions: JSON.parse(localStorage.getItem("missedQuestions") || "[]"),
      masteredQuestions: JSON.parse(localStorage.getItem("masteredQuestions") || "[]"),
      sessionQuestionsAnswered: parseInt(localStorage.getItem("sessionQuestionsAnswered") || "0", 10),
      quizResults: JSON.parse(localStorage.getItem("quizResults") || "[]"),
      questionConfidence: JSON.parse(localStorage.getItem("questionConfidence") || "{}"),
      masteryHistory: JSON.parse(localStorage.getItem("masteryHistory") || "[]"),
      exp: parseInt(localStorage.getItem("exp") || "0", 10),
      earnedBadges: JSON.parse(localStorage.getItem("earnedBadges") || "[]"),
    };
    const merged = mergeStats(local, remote);

    // Save merged stats back to localStorage
    localStorage.setItem("streak", merged.streak);
    localStorage.setItem("correct", merged.correct);
    localStorage.setItem("missedQuestions", JSON.stringify(merged.missedQuestions));
    localStorage.setItem("masteredQuestions", JSON.stringify(merged.masteredQuestions));
    localStorage.setItem("sessionQuestionsAnswered", merged.sessionQuestionsAnswered);
    localStorage.setItem("quizResults", JSON.stringify(merged.quizResults));
    localStorage.setItem("questionConfidence", JSON.stringify(merged.questionConfidence));
    localStorage.setItem("masteryHistory", JSON.stringify(merged.masteryHistory));
    localStorage.setItem("exp", merged.exp);
    localStorage.setItem("earnedBadges", JSON.stringify(merged.earnedBadges));
  }
}

onAuthStateChanged(auth, async user => {
  if (user) {
    await loadStatsFromFirestore(); // <-- Add this line
    // ...rest of your logic
  }
});

let exp = parseInt(localStorage.getItem("exp") || "0", 10);

async function checkBadges() {
  // ...existing code...
  exp += 10; // or whatever logic you want for EXP per question
  localStorage.setItem("exp", exp);
  if (auth.currentUser) {
    await setDoc(doc(db, "users", auth.currentUser.uid), { earnedBadges, exp }, { merge: true });
  }
}
// Before signOut(auth)
await saveStatsToFirestore();

document.getElementById("accuracyChart")
document.getElementById("confidenceChart")
document.getElementById("masteryHistoryChart")
document.getElementById("historyChart")
localStorage.getItem("quizResults")
localStorage.getItem("questionConfidence")
localStorage.getItem("masteryHistory")

window.onerror = function(message, source, lineno, colno, error) {
  alert("Error: " + message + "\n" + source + ":" + lineno);
};


// ===============================
// Massage Therapy Smart Study PRO
// Main App Logic (Refactored & Commented)
// ===============================

// --- GLOBAL STATE ---

const SELECTORS = {
  quizCard: ".quiz-card",
  topicSelect: ".control[data-topic]",
  lengthSelect: ".control[data-quiz-length]",
  startBtn: ".start-btn",
  feedback: ".feedback",
  progressFill: ".progress-fill",
  progressPercent: ".progress-section span:last-child"
};

let current = 0;
let selectedTopic = "";
let quiz = [];
let correct = 0;
let streak = 0;
let missedQuestions = [];
let unansweredQuestions = [];
let bookmarkedQuestions = [];
let questions = [];
let sessionQuestionsAnswered = 0;
let questionTimes = JSON.parse(localStorage.getItem("questionTimes") || "{}");
let questionStartTime = null;
let sessionStartTime = Date.now();

window.historyChart = null;
window.accuracyChart = null;

// --- BADGES Imported by FIREBASE---
import badges from "./badges.js";
import * as badgeFns from "./generated_badge_conditions.js";

// Attach the correct condition function to each badge by id
badges.forEach(badge => {
  // Normalize id for function name (replace - and spaces and % with _)
  const fnName = "checkUnlock_" + badge.id.replace(/[-\s%]/g, "_");
  if (typeof badgeFns[fnName] !== "function") {
    console.warn(`No unlock function found for badge id: ${badge.id}`);
  }
  badge.condition = badgeFns[fnName] || (() => false);
});

// User streak/badge progress data (store separately)
const userStreakData = {
  user_id: "user_001",
  current_streak_days: 22,
  last_session_date: "2025-05-18",
  streak_resume_date: "2025-05-17",
  grace_used: true,
  badges: {
    streak_3: { times_earned: 5, last_earned_date: "2025-05-15", glow_state: "on" },
    streak_10: { times_earned: 3, last_earned_date: "2025-05-16", glow_state: "on" },
    streak_20: { times_earned: 1, last_earned_date: "2025-05-17", glow_state: "off" },
    streak_10x3: { unlocked: true, unlocked_date: "2025-05-16", glow_state: "pulsing" },
    streak_3x5: { unlocked: true, unlocked_date: "2025-05-15", glow_state: "pulsing" }
  }
};
// --- UTILITY FUNCTIONS ---

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
  if (!name) return "";
  // List of acronyms and special cases (add more as needed)
  const replacements = {
    soap: "SOAP",
    vs: "vs",
    mblex: "MBLEx",
    cpr: "CPR",
    emr: "EMR",
    hipaa: "HIPAA",
    rom: "ROM",
    cmt: "CMT",
    bpm: "BPM",
    pt: "PT",
    ot: "OT",
    prn: "PRN",
    npo: "NPO",
    bmi: "BMI",
    bmr: "BMR",
    cns: "CNS",
    cva: "CVA",
    dvt: "DVT",
    emt: "EMT",
    hmo: "HMO",
    iv: "IV",
    lmt: "LMT",
    mri: "MRI",
    nsaids: "NSAIDs",
    rmt: "RMT",
    rn: "RN",
    tbi: "TBI",
    tmj: "TMJ",
    // Add more as needed
  };
  // Clean up name
  name = name.replace(/\.json$/i, "")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  // If the whole name matches a replacement, return it
  const lower = name.toLowerCase();
  if (replacements[lower]) return replacements[lower];
  // Otherwise, capitalize each word unless it's a replacement
  return name.replace(/\w\S*/g, txt =>
    replacements[txt.toLowerCase()] || txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}

function formatTopicName(topic) {
  if (!topic) return "";
  return topic.replace(/_/g, " ").replace(/\bsoap\b/gi, "SOAP").replace(/\b\w/g, c => c.toUpperCase());
}

// --- FIREBASE CONFIG ---

import { firebaseConfig } from "./firebaseConfig.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-analytics.js";
import { getFirestore, setDoc, getDoc, doc, collection, addDoc, getDocs, collectionGroup } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, onAuthStateChanged, signOut, getRedirectResult } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";

// --- INITIALIZE FIREBASE APP FIRST ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const analytics = getAnalytics(app);
const provider = new GoogleAuthProvider();

function isMobile() {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

async function signInWithGoogle() {
  try {
    if (isMobile()) {
      await signInWithRedirect(auth, provider);
    } else {
      await signInWithPopup(auth, provider);
    }
  } catch (error) {
    if (error.code === "auth/popup-closed-by-user") {
      showNotification("Sign-in cancelled", "You closed the sign-in window before completing authentication.", "badges/summary.png");
    } else {
      showNotification("Sign-in failed", error.message, "badges/summary.png");
    }
  }
}

// --- QUESTION LOADING ---

async function loadQuestionsFromFirestore() {
  console.log("Loading questions from Firestore...");
  const itemsSnapshot = await getDocs(collectionGroup(db, "items"));
  let loadedQuestions = [];
  itemsSnapshot.forEach(docSnap => {
    loadedQuestions.push({ id: docSnap.id, ...docSnap.data() });
  });
  console.log("Fetched questions:", loadedQuestions);
  return loadedQuestions;
}

function ensureQuestionMetadata(questions) {
  questions.forEach(q => {
    if (!q.stats) {
      q.stats = { correct: 0, incorrect: 0 };
    }
  });
}

// --- APP INIT ---

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result && result.user) {
      // User signed in via redirect
      console.log("Redirect sign-in successful:", result.user);
    }
  } catch (error) {
    console.error("Redirect sign-in error:", error);
  }

  const statusElem = document.querySelector("#status");
  if (statusElem) statusElem.innerText = "Checking authentication...";

  onAuthStateChanged(auth, async user => {
    console.log("Auth state changed. User:", user); // <-- Add this
    if (user) {
      if (statusElem) statusElem.innerText = "Loading questions...";
      questions = await loadQuestionsFromFirestore();
      console.log("Questions loaded from Firestore:", questions); // <-- Add this
      ensureQuestionMetadata(questions);
      if (questions.length === 0) {
        if (statusElem) statusElem.innerText = "No questions found!";
        return;
      }
      if (statusElem) statusElem.innerText = "";
      startQuiz(questions);
      setupUI();
      populateTopicDropdown();
      showNotification("Welcome!", "Challenge your skills with Massage Therapy Smart Study PRO!", "badges/welcome.png");
      renderChartsOnLoad();
    } else {
      if (statusElem) statusElem.innerText = "Please sign in to access questions.";
      // Optionally, hide quiz UI until signed in
    }
  });
}); // <-- Add this closing brace and parenthesis

// --- UI & QUIZ LOGIC ---

function setupUI() {
  const topicSelect = document.querySelector(SELECTORS.topicSelect);
  const lengthSelect = document.querySelector(SELECTORS.lengthSelect);
  const startBtn = document.querySelector(SELECTORS.startBtn);

  function updateStartBtn() {
    if (startBtn) startBtn.disabled = !(topicSelect.value && lengthSelect.value);
  }
  if (topicSelect) {
    topicSelect.addEventListener("change", () => {
      selectedTopic = topicSelect.value;
      updateStartBtn();
    });
  }
  if (lengthSelect) lengthSelect.addEventListener("change", updateStartBtn);
  if (startBtn) startBtn.addEventListener("click", () => {
    let quizPool = [];
    const topic = topicSelect.value;
    const length = lengthSelect.value === "all" ? 9999 : parseInt(lengthSelect.value, 10);

    if (topic === "unanswered") quizPool = unansweredQuestions;
    else if (topic === "missed") quizPool = missedQuestions.map(id => questions.find(q => q.id === id)).filter(Boolean);
    else if (topic === "bookmarked") quizPool = bookmarkedQuestions;
    else if (topic === "review_unmastered") quizPool = getQuestionsMastered(0);
    else if (topic === "review_most_missed") quizPool = getMostErroredQuestions();
    else if (topic === "adaptive_quiz") quizPool = getAdaptiveQuiz();
    else if (topicSelect.value && topicSelect.value.includes("::")) {
      const [topic, unit] = topicSelect.value.split("::");
      quizPool = questions.filter(q => q.topic.trim() === topic && q.unit.trim() === unit);
    } else {
      quizPool = questions.filter(q => q.topic === topicSelect.value);
    }
    startQuiz(quizPool.slice(0, length));
  });

  document.querySelectorAll(".smart-learning a, .smart-learning-link").forEach(link =>
    link.addEventListener("click", showSmartLearningModal)
  );
  document.querySelectorAll(".view-analytics a, .analytics-link").forEach(link =>
    link.addEventListener("click", showAnalyticsModal)
  );
}

async function populateTopicDropdown() {
  const topicSelect = document.querySelector(SELECTORS.topicSelect);
  topicSelect.innerHTML = ""; // Clear existing options

  // Add "-- Select Topic --" option
  const selectOption = document.createElement("option");
  selectOption.value = "";
  selectOption.textContent = "-- Select Topic --";
  selectOption.disabled = true;
  selectOption.selected = true;
  topicSelect.appendChild(selectOption);

  // Add "All Topics" option
  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = "All Topics";
  topicSelect.appendChild(allOption);

  // Group questions by topic and unit (subtopic)
  const topicMap = {};
  questions.forEach(q => {
    if (!topicMap[q.topic]) topicMap[q.topic] = new Set();
    if (q.unit) topicMap[q.topic].add(q.unit);
  });

  // Add topics and subtopics as selectable options
  Object.entries(topicMap).forEach(([topic, units]) => {
    // Main topic as selectable option (bold via CSS if desired)
    const topicOption = document.createElement("option");
    topicOption.value = topic;
    topicOption.textContent = "★ " + prettifyName(topic);
    topicOption.className = "main-topic-option";
    topicSelect.appendChild(topicOption);

    // Subtopics (units) as indented options
    units.forEach(unitPath => {
      const unitName = unitPath.split("/").pop();
      const subOption = document.createElement("option");
      subOption.value = `${topic}::${unitPath}`;
      subOption.textContent = "  " + prettifyName(unitName); // Use em-spaces for indent
      topicSelect.appendChild(subOption);
    });
  });
}

function startQuiz(quizPool) {
  quiz = shuffle([...quizPool].filter(q => Array.isArray(q.answers)));
  current = 0; correct = 0; streak = 0;
  const quizCard = document.querySelector(SELECTORS.quizCard);
  if (quizCard) quizCard.classList.remove("hidden");
  renderQuestion();
}

function renderQuestion(q) {
  q = q || quiz[current];
  const quizCard = document.querySelector(SELECTORS.quizCard);

  if (!quiz || quiz.length === 0) {
    if (quizCard) quizCard.innerHTML = "<p>No questions available for this quiz!</p>";
    return;
  }
  if (!q || !Array.isArray(q.answers)) {
    if (quizCard) quizCard.innerHTML = "<p>Invalid question data. Please try another quiz or topic.</p>";
    return;
  }
  const answerObjs = q.answers.map((a, i) => ({
    text: a,
    isCorrect: i === q.correct
  }));
  shuffle(answerObjs);

  renderQuizHeader(q);

  const quizHeaderStrong = document.querySelector(".quiz-header strong");
  if (quizHeaderStrong) quizHeaderStrong.textContent = formatTopicName(selectedTopic);

  const questionText = document.querySelector(".question-text");
  if (questionText) questionText.textContent = q.question;

  renderAnswers(answerObjs);

  const feedbackElem = document.querySelector(SELECTORS.feedback);
  if (feedbackElem) feedbackElem.textContent = "";

  quizCard.querySelectorAll(".question-actions").forEach(el => el.remove());
  renderQuestionActions(q);
}

/**
 * Render the quiz header row with topic, streak, and bookmark button.
 */
function renderQuizHeader(q) {
  const mastered = getQuestionsMastered().length;
  const total = questions.length;
  const quizHeader = document.querySelector(".quiz-header");
  if (!quizHeader) return;
  quizHeader.querySelector(".quiz-header-row")?.remove();

  const headerRow = document.createElement("div");
  headerRow.className = "quiz-header-row";
  headerRow.innerHTML = `
    <div class="topic-streak">
      <span>TOPIC: <strong>${prettifyName(selectedTopic)}</strong></span>
      <span style="margin-left: 16px;">Streak: <span id="quizStreak">${streak}</span></span>
      <span style="margin-left: 16px;"><strong>Mastery:</strong> ${mastered}/${total}</span>
    </div>
  `;

  // Only update masteryStatus if it exists
  const masteryStatusElem = document.getElementById("masteryStatus");
  if (masteryStatusElem) {
    masteryStatusElem.innerHTML = `
      <strong>Mastery:</strong> ${mastered}/${total}
    `;
  }

  const bookmarkBtn = document.createElement("button");
  bookmarkBtn.className = "bookmark-btn";
  bookmarkBtn.textContent = q.bookmarked ? "Unbookmark" : "Bookmark";
  bookmarkBtn.setAttribute("aria-label", q.bookmarked ? "Unbookmark this question" : "Bookmark this question");
  bookmarkBtn.addEventListener("click", () => {
    q.bookmarked = !q.bookmarked;
    bookmarkBtn.textContent = q.bookmarked ? "Unbookmark" : "Bookmark";
    bookmarkBtn.setAttribute("aria-label", q.bookmarked ? "Unbookmark this question" : "Bookmark this question");
    toggleBookmark(q.id);
    bookmarkedQuestions = getBookmarkedQuestions(questions);
  });

  headerRow.appendChild(bookmarkBtn);
  quizHeader.appendChild(headerRow);
}

/**
 * Render answer buttons for the current question.
 */
function renderAnswers(answerObjs) {
  const answersDiv = document.getElementById("answers");
  answersDiv.innerHTML = "";
  answerObjs.forEach((ansObj, i) => {
    const btn = document.createElement("div");
    btn.className = "answer";
    btn.textContent = `${String.fromCharCode(65 + i)}. ${ansObj.text}`;
    btn.setAttribute("role", "button");
    btn.setAttribute("tabindex", "0");
    btn.setAttribute("aria-pressed", "false");
    btn.setAttribute("aria-label", `Answer ${String.fromCharCode(65 + i)}: ${ansObj.text}`);
    btn.addEventListener("click", () => {
      handleAnswerClick(ansObj.isCorrect, btn);
      btn.setAttribute("aria-pressed", "true");
    });
    btn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        handleAnswerClick(ansObj.isCorrect, btn);
        btn.setAttribute("aria-pressed", "true");
      }
    });
    answersDiv.appendChild(btn);
  });
}

/**
 * Render action buttons (suggest, report, flag, rate) for the current question.
 */
function renderQuestionActions(q) {
  const quizCard = document.querySelector(SELECTORS.quizCard);
  const actionsDiv = document.createElement("div");
  actionsDiv.className = "question-actions";
  actionsDiv.setAttribute("role", "group");
  actionsDiv.setAttribute("aria-label", "Question actions");

  actionsDiv.appendChild(createSuggestBtn());
  actionsDiv.appendChild(createReportBtn());
  actionsDiv.appendChild(createFlagBtn());
  actionsDiv.appendChild(createRateDiv(q.id));

  quizCard.appendChild(actionsDiv);
}

/**
 * Create the "Suggest a Question" button and modal.
 */
function createSuggestBtn() {
  const btn = document.createElement("button");
  btn.textContent = "Suggest a Question";
  btn.className = "suggest-btn";
  btn.addEventListener("click", () => {
    openModal("Suggest a Question", `
      <form id="suggestForm">
        <label>Question:<br><input type="text" id="suggestQ" required></label><br>
        <label>Answer A:<br><input type="text" id="suggestA" required></label><br>
        <label>Answer B:<br><input type="text" id="suggestB" required></label><br>
        <label>Answer C:<br><input type="text" id="suggestC"></label><br>
        <label>Answer D:<br><input type="text" id="suggestD"></label><br>
        <label>Correct Answer (A/B/C/D):<br><input type="text" id="suggestCorrect" required maxlength="1"></label><br>
        <label>Topic:<br><input type="text" id="suggestTopic" required></label><br>
        <button type="submit">Submit</button>
      </form>
    `);
    document.getElementById("suggestForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const suggestion = {
        question: document.getElementById("suggestQ").value,
        answers: [
          document.getElementById("suggestA").value,
          document.getElementById("suggestB").value,
          document.getElementById("suggestC").value,
          document.getElementById("suggestD").value,
        ].filter(Boolean),
        correct: ["A","B","C","D"].indexOf(document.getElementById("suggestCorrect").value.toUpperCase()),
        topic: document.getElementById("suggestTopic").value,
        submittedAt: new Date().toISOString()
      };
      await submitSuggestionToFirestore(suggestion);
      showNotification("Thank you!", "Your suggestion has been submitted.", "badges/summary.png");
      document.querySelector(".modal-overlay").remove();
    });
  });
  btn.setAttribute("aria-pressed", "true");
  return btn;
}

/**
 * Create the "Report Question" button and modal.
 */
function createReportBtn() {
  const btn = document.createElement("button");
  btn.textContent = "Report Question";
  btn.className = "report-btn";
  btn.addEventListener("click", () => {
    openModal("Report Question", `
      <form id="reportForm">
        <p>Why are you reporting this question?</p>
        <textarea id="reportReason" required style="width:100%;height:60px;"></textarea><br>
        <button type="submit">Submit Report</button>
      </form>
    `);
    document.getElementById("reportForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const report = {
        questionId: quiz[current].id,
        question: quiz[current].question,
        reason: document.getElementById("reportReason").value,
        reportedAt: new Date().toISOString()
      };
      await submitReportToFirestore(report);
      showNotification("Thank you!", "Your report has been submitted.", "badges/summary.png");
      document.querySelector(".modal-overlay").remove();
    });
  });
  btn.setAttribute("aria-pressed", "true");
  return btn;
}

/**
 * Create the "Flag as Unclear" button.
 */
function createFlagBtn() {
  const btn = document.createElement("button");
  btn.textContent = "Flag as Unclear";
  btn.className = "flag-unclear-btn";
  btn.addEventListener("click", async () => {
    const qid = quiz[current].id;
    let unclearFlags = JSON.parse(localStorage.getItem("unclearFlags") || "{}");
    unclearFlags[qid] = (unclearFlags[qid] || 0) + 1;
    localStorage.setItem("unclearFlags", JSON.stringify(unclearFlags));

    try {
      await addDoc(collection(db, "unclearFlags"), {
        questionId: qid,
        flaggedAt: new Date().toISOString(),
        user: auth.currentUser?.uid || null
      });
    } catch (error) {
      showNotification("Error", "Failed to flag as unclear. Try again later.", "badges/summary.png");
      console.error("Error flagging as unclear:", error);
    }
    showNotification("Thank you!", "This question has been flagged as unclear.", "badges/summary.png");
  });
  btn.setAttribute("aria-pressed", "true");
  return btn;
}

/**
 * Create the star rating UI for the current question.
 */
function createRateDiv(qid) {
  const rateDiv = document.createElement("div");
  rateDiv.className = "rate-question";
  rateDiv.innerHTML = `
    <span>Rate: </span>
    ${[1, 2, 3, 4, 5].map(n =>
      `<span class="star" data-star="${n}" style="cursor:pointer;font-size:1.2em;color:#ccc;">&#9734;</span>`
    ).join("")}
  `;
  const stars = rateDiv.querySelectorAll(".star");
  const ratings = JSON.parse(localStorage.getItem("questionRatings") || "{}");
  const savedRating = ratings[qid] || 0;
  stars.forEach((star, index) => {
    star.style.color = index < savedRating ? "gold" : "#ccc";
    star.addEventListener("click", () => {
      stars.forEach((s, i) => s.style.color = i <= index ? "gold" : "#ccc");
      const rating = index + 1;
      ratings[qid] = rating;
      localStorage.setItem("questionRatings", JSON.stringify(ratings));
      showNotification("Thank you!", `You rated this question ${rating} stars.`, "badges/summary.png");
    });
    star.addEventListener("mouseover", () => {
      stars.forEach((s, i) => s.style.color = i <= index ? "gold" : "#ccc");
    });
    star.addEventListener("mouseout", () => {
      stars.forEach((s, i) => s.style.color = i < savedRating ? "gold" : "#ccc");
    });
  });
  return rateDiv;
}

/**
 * Create the confidence rating UI for the current question.
 */
function createConfidenceDiv(qid) {
  const confidenceDiv = document.createElement("div");
  confidenceDiv.className = "confidence-rating";
  confidenceDiv.innerHTML = `
    <span>Confidence: </span>
    ${[1, 2, 3, 4, 5].map(n =>
      `<span class="confidence-dot" data-confidence="${n}" style="cursor:pointer;font-size:1.5em;color:#ccc;">●</span>`
    ).join("")}
    <span id="confidenceLabel" style="margin-left:8px;font-size:0.9em;color:#888;"></span>
  `;
  const dots = confidenceDiv.querySelectorAll(".confidence-dot");
  const labels = ["Not confident", "Slightly", "Neutral", "Confident", "Very confident"];
  const confidences = JSON.parse(localStorage.getItem("questionConfidence") || "{}");
  const saved = confidences[qid] || 0;
  dots.forEach((dot, index) => {
    dot.style.color = index < saved ? "#6BCB77" : "#ccc";
    dot.addEventListener("click", () => {
      dots.forEach((d, i) => d.style.color = i <= index ? "#6BCB77" : "#ccc");
      confidences[qid] = index + 1;
      localStorage.setItem("questionConfidence", JSON.stringify(confidences));
      confidenceDiv.querySelector("#confidenceLabel").textContent = labels[index];
      showNotification("Thank you!", `You rated your confidence: ${labels[index]}.`, "badges/summary.png");
    });
    dot.addEventListener("mouseover", () => {
      confidenceDiv.querySelector("#confidenceLabel").textContent = labels[index];
    });
    dot.addEventListener("mouseout", () => {
      confidenceDiv.querySelector("#confidenceLabel").textContent = saved ? labels[saved - 1] : "";
    });
  });
  if (saved) confidenceDiv.querySelector("#confidenceLabel").textContent = labels[saved - 1];
  return confidenceDiv;
}

/**
 * Handle answer selection, update streak, feedback, and progress.
 */
function handleAnswerClick(isCorrect, btn) {
  if (!quiz[current]) return;
  btn.classList.add(isCorrect ? "correct" : "incorrect");
  updateStreak(isCorrect);
  updateProgress(current + 1, quiz.length);

  const feedback = document.querySelector(SELECTORS.feedback);
  const qid = quiz[current].id;

  if (!isCorrect) {
    const correctAnswer = quiz[current].answers[quiz[current].correct];
    feedback.textContent = `Incorrect! The correct answer is: ${correctAnswer}`;
    feedback.style.color = "red";
    if (!missedQuestions.includes(qid)) {
      missedQuestions.push(qid);
      saveUserData();
    }
    quiz[current].stats = quiz[current].stats || { correct: 0, incorrect: 0 };
    quiz[current].stats.incorrect++;
    localStorage.setItem("review_" + qid, JSON.stringify({
      lastMissed: Date.now(),
      interval: 24 * 60 * 60 * 1000
    }));
    recordWrongAnswer(qid, btn.textContent);
  } else {
    feedback.textContent = "Correct!";
    feedback.style.color = "green";
    missedQuestions = missedQuestions.filter(id => id !== qid);
    saveUserData();
    quiz[current].stats = quiz[current].stats || { correct: 0, incorrect: 0 };
    quiz[current].stats.correct++;
  }
  const explanation = quiz[current].explanation || "";
  feedback.innerHTML += explanation ? `<br><em>${explanation}</em>` : "";
  if (isCorrect) correct++;
  unansweredQuestions = unansweredQuestions.filter(q => q.id !== qid);

  setTimeout(() => {
    current++;
    if (current >= quiz.length) {
      showSummary();
      return;
    }
    renderQuestion();
    renderAccuracyChart(correct, current - correct, quiz.length - current);
  }, 1500);
  updateQuestionMeta(qid, isCorrect);

  // Track time to answer
  if (questionStartTime) {
    const elapsed = Date.now() - questionStartTime;
    questionTimes[qid] = questionTimes[qid] || [];
    questionTimes[qid].push(elapsed);
    localStorage.setItem("questionTimes", JSON.stringify(questionTimes));
    questionStartTime = null;
  }
  sessionQuestionsAnswered++;
  logDailyProgress();

  // Add this line to save stats after each answer
  saveStats();
  saveQuizResult();
  saveStatsToFirestore(); // <-- add this
}

/**
 * Log daily progress for streaks.
 */
function logDailyProgress() {
  const today = new Date().toISOString().slice(0, 10);
  const progress = JSON.parse(localStorage.getItem("dailyProgress") || "{}");
  progress[today] = (progress[today] || 0) + 1;
  localStorage.setItem("dailyProgress", JSON.stringify(progress));
}

/**
 * Update the user's streak and check for badge unlocks.
 */
function updateStreak(isCorrect) {
  streak = isCorrect ? streak + 1 : 0;
  document.getElementById("quizStreak").textContent = streak;
  checkBadges();
}

/**
 * Update the quiz progress bar and percentage.
 */
function updateProgress(current, total) {
  const progress = Math.round((current / total) * 100);
  document.querySelector(SELECTORS.progressFill).style.width = `${progress}%`;
  document.querySelector(SELECTORS.progressPercent).textContent = `${progress}%`;
}

/**
 * Show quiz summary and review/smart review buttons if needed.
 */
function showSummary() {
  const accuracy = quiz.length > 0 ? Math.round((correct / quiz.length) * 100) : 0;
  showNotification("Quiz Summary", `You answered ${correct} out of ${quiz.length} questions correctly (${accuracy}% accuracy).`, "badges/summary.png");
  checkBadges();
  if (missedQuestions.length > 0) showReviewMissedBtn();
  if (getQuestionsForSmartReview().length > 0) showSmartReviewBtn();
  saveQuizResult();
}

/**
 * Show a button to review missed questions after quiz.
 */
function showReviewMissedBtn() {
  const reviewBtn = document.createElement("button");
  reviewBtn.textContent = "Review Missed Questions";
  reviewBtn.className = "modal-btn";
  reviewBtn.onclick = () => {
    quiz = questions.filter(q => missedQuestions.includes(q.id));
    current = 0; correct = 0; streak = 0;
    document.querySelector(SELECTORS.quizCard).classList.remove("hidden");
    renderQuestion();
    document.querySelector(".notification-container")?.remove();
  };
  setTimeout(() => {
    document.body.appendChild(reviewBtn);
    setTimeout(() => reviewBtn.remove(), 5000);
  }, 500);
}

/**
 * Show a button to smart review questions after quiz.
 */
function showSmartReviewBtn() {
  const smartReviewBtn = document.createElement("button");
  smartReviewBtn.textContent = "Smart Review Questions";
  smartReviewBtn.className = "modal-btn";
  smartReviewBtn.onclick = () => {
    quiz = getQuestionsForSmartReview();
    current = 0; correct = 0; streak = 0;
    document.querySelector(SELECTORS.quizCard).classList.remove("hidden");
    renderQuestion();
    document.querySelector(".notification-container")?.remove();
  };
  setTimeout(() => {
    document.body.appendChild(smartReviewBtn);
    setTimeout(() => smartReviewBtn.remove(), 5000);
  }, 500);
}

/**
 * Start a review session for unmastered questions.
 */
function startUnmasteredReview() {
  quiz = shuffle(getQuestionsMastered(0)); // Or set a threshold
  current = 0; correct = 0; streak = 0;
  document.querySelector(SELECTORS.quizCard).classList.remove("hidden");
  renderQuestion();
}

// --- MODALS ---
/**
 * Open a modal dialog with the given title and content.
 * @param {string} title
 * @param {string} content
 * @param {boolean} [toggle=false]
 */
function openModal(title, content, toggle = false) {
  // Always remove any existing modal
  const existingModal = document.querySelector(".modal-overlay");
  if (existingModal) existingModal.remove();

  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-label", title);
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h2>${title}</h2>
        <button class="close-modal">&times;</button>
      </div>
      <div class="modal-body">${content}</div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector(".close-modal").addEventListener("click", () => modal.remove());
  modal.addEventListener("click", () => modal.remove());
  modal.querySelector(".modal").addEventListener("click", (e) => e.stopPropagation());
  modal.querySelector(".close-modal").setAttribute("aria-label", "Close modal");
  document.addEventListener("keydown", function escListener(e) {
    if (e.key === "Escape") {
      modal.remove();
      document.removeEventListener("keydown", escListener);
    }
  });
  setTimeout(() => {
    const modalBody = document.querySelector(".modal-body");
    if (modalBody) modalBody.scrollTop = 0;
  }, 0);
}

/**
 * Show the Smart Learning modal with badge grid.
 */
function showSmartLearningModal(e) {
  if (e) e.preventDefault();
  // Always use a fallback if earnedBadges is not loaded yet
  const earned = Array.isArray(earnedBadges) ? earnedBadges : JSON.parse(localStorage.getItem("earnedBadges") || "[]");
  openModal("Smart Learning", `
    <p>Smart Learning helps you focus on missed or unanswered questions to improve your knowledge.</p>
    <div class="badge-grid">
      ${badges.map(badge => `
        <div class="badge-item ${earned.includes(badge.id) ? "" : "unearned"}">
          <img src="badges/${badge.id}.png" alt="${badge.name}" />
          <p>${badge.name}</p>
        </div>
      `).join("")}
    </div>
  `);
}

/**
 * Show the Analytics modal with charts and mastery stats.
 */
function showAnalyticsModal(e) {
  if (e) e.preventDefault();
  const totalQuestions = quiz.length;
  const unansweredQuestionsCount = totalQuestions - current;
  const incorrectAnswers = current - correct;
  const accuracy = totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;
  const stats = { totalQuestions, correctAnswers: correct, incorrectAnswers, unansweredQuestions: unansweredQuestionsCount, accuracy, streak };
  const topicStats = getTopicMastery();

  // Calculate average, fastest, and slowest time per question
  const times = Object.values(questionTimes).flat();
  const avgTime = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
  const fastest = times.length ? Math.min(...times) : 0;
  const slowest = times.length ? Math.max(...times) : 0;

  function getSessionDuration() {
    const now = Date.now();
    const durationMs = now - sessionStartTime;
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }

  // --- NEW: Topic mastery heatmap ---
  const masteryGrid = `
    <div class="topic-heatmap" style="display: flex; flex-direction: column; gap: 2px; width: 100%;">
      ${Object.entries(topicStats).map(([topic, stat]) => {
        const acc = stat.total ? stat.correct / stat.total : 0;
        const percent = Math.round(acc * 100);
        return `
          <div class="topic-progress-row" style="display:flex;align-items:center;gap:8px;min-height:20px;">
            <span 
              style="flex:2 1 180px;font-size:0.97em;overflow-wrap:break-word;" 
              title="${formatTopicName(topic)}"
            >${formatTopicName(topic)}</span>
            <div class="topic-progress-bar" style="flex:4 1 120px;height:8px;background:#222;border-radius:4px;overflow:hidden;margin:0 6px;">
              <div style="height:100%;width:${percent}%;background:${masteryColor(acc)};transition:width 0.4s;"></div>
            </div>
            <span style="width:38px;text-align:left;font-size:0.97em;">${percent}%</span>
          </div>
        `;
      }).join("")}
    </div>
  `;

  openModal("View Analytics", `
    <p>Track your progress, accuracy, confidence, and streaks over time to measure your improvement.</p>
    <div style="display: flex; flex-direction: column; align-items: center; gap: 20px;">
      <canvas id="accuracyChart" width="200" height="200"></canvas>
      <canvas id="confidenceChart" width="200" height="200" style="margin-top:16px;"></canvas>
      <canvas id="masteryHistoryChart" width="300" height="120" style="margin-top:16px;"></canvas>
      <ul style="list-style: none; padding: 0; text-align: left;">
        <li><strong>Total Questions Attempted:</strong> ${stats.totalQuestions}</li>
        <li><strong>Correct Answers:</strong> ${stats.correctAnswers}</li>
        <li><strong>Incorrect Answers:</strong> ${stats.incorrectAnswers}</li>
        <li><strong>Unanswered Questions:</strong> ${stats.unansweredQuestions}</li>
        <li><strong>Accuracy:</strong> ${stats.accuracy}%</li>
        <li><strong>Current Streak:</strong> ${stats.streak}</li>
        <li><strong>Session Duration:</strong> ${getSessionDuration()}</li>
        <li><strong>Questions Answered This Session:</strong> ${sessionQuestionsAnswered}</li>
        <li><strong>Average Time per Question:</strong> ${avgTime} ms</li>
        <li><strong>Fastest:</strong> ${fastest} ms</li>
        <li><strong>Slowest:</strong> ${slowest} ms</li>
        <li><strong>Next Best Quiz:</strong> ${getSmartRecommendation()}</li>
      </ul>
      <h4 style="margin-top:16px;">Mastery by Topic</h4>
      ${masteryGrid}
      <h4 style="margin-top:16px;">Quiz History</h4>
      <canvas id="historyChart" width="300" height="120"></canvas>
    </div>
  `);

  // Render all charts after modal is open
  requestAnimationFrame(() => {
    renderAccuracyChart(stats.correctAnswers, stats.incorrectAnswers, stats.unansweredQuestions);
    renderHistoryChart();
    renderConfidenceChart();
    renderMasteryHistoryChart();
  });
}

function renderMasteryHistoryChart() {
  const data = JSON.parse(localStorage.getItem("masteryHistory") || "[]");
  const ctxElem = document.getElementById("masteryHistoryChart");
  if (!ctxElem) return;
  if (window.masteryHistoryChart && typeof window.masteryHistoryChart.destroy === "function") {
    window.masteryHistoryChart.destroy();
    window.masteryHistoryChart = null;
  }
  window.masteryHistoryChart = new Chart(ctxElem.getContext("2d"), {
    type: "line",
    data: {
      labels: data.map(d => new Date(d.date).toLocaleDateString()),
      datasets: [{
        label: "Average Mastery (%)",
        data: data.map(d => d.avgMastery),
        borderColor: "#6BCB77",
        fill: false,
      }]
    },
    options: { responsive: true }
  });
}

const masteryHistory = JSON.parse(localStorage.getItem("masteryHistory") || "[]");
const topicStats = getTopicMastery();
const avgMastery = Object.values(topicStats).length
  ? Math.round(Object.values(topicStats).reduce((sum, stat) => sum + (stat.total ? stat.correct / stat.total : 0), 0) / Object.values(topicStats).length * 100)
  : 0;
masteryHistory.push({ date: new Date().toISOString(), avgMastery });
localStorage.setItem("masteryHistory", JSON.stringify(masteryHistory));

/**
 * Reset all user progress and settings.
 */
function resetAll() {
  if (!confirm("Are you sure you want to reset all progress and settings? This cannot be undone.")) return;
  localStorage.clear();
  location.reload();
}

// --- CHARTS ---
function renderChartsOnLoad() {
  const stats = {
    correct: correct,
    incorrect: quiz.length - correct,
    unanswered: quiz.length > 0 ? quiz.length - current : 0
  };
  renderAccuracyChart(stats.correct, stats.incorrect, stats.unanswered);
  renderHistoryChart();
}

function renderAccuracyChart(correct, incorrect, unanswered) {
  const ctxElem = document.getElementById("accuracyChart");
  if (!ctxElem) return;
  if (window.accuracyChart) {
    window.accuracyChart.destroy();
    window.accuracyChart = null;
  }
  const ctx = ctxElem.getContext("2d");
  window.accuracyChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Correct", "Incorrect", "Unanswered"],
      datasets: [{
        data: [correct, incorrect, unanswered],
        backgroundColor: ["#6BCB77", "#FF6B6B", "#FFD93D"],
        hoverBackgroundColor: ["#8FDCA8", "#FF8787", "#FFE066"],
        borderWidth: 1,
        borderColor: "#ffffff",
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom", labels: { font: { size: 14 } } },
      },
      cutout: "85%",
    },
  });
}

function renderHistoryChart() {
  const results = JSON.parse(localStorage.getItem("quizResults")) || [];
  const ctx = document.getElementById("historyChart")?.getContext("2d");
  if (!ctx) return;
  if (window.historyChart) window.historyChart.destroy();
  window.historyChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: results.length ? results.map(r => new Date(r.date).toLocaleDateString()) : ["No Data"],
      datasets: [
        {
          label: "Accuracy (%)",
          data: results.length
            ? results.map(r =>
                r.total > 0 && typeof r.score === "number"
                  ? Math.max(0, Math.round((r.score / r.total) * 100))
                  : 0
              )
            : [0],
          borderColor: "#007bff",
          fill: false,
        },
        {
          label: "Streak",
          data: results.length
            ? results.map(r => typeof r.streak === "number" ? Math.max(0, r.streak) : 0)
            : [0],
          borderColor: "#FFD93D",
          fill: false,
        }
      ]
    },
    options: { responsive: true }
  });
}

function renderConfidenceChart() {
  const ctxElem = document.getElementById("confidenceChart");
  if (!ctxElem) return;
  // Only destroy if it's a Chart instance
  if (window.confidenceChart && typeof window.confidenceChart.destroy === "function") {
    window.confidenceChart.destroy();
    window.confidenceChart = null;
  }
  const confidences = JSON.parse(localStorage.getItem("questionConfidence") || "{}");
  const values = Object.values(confidences);
  const counts = [1,2,3,4,5].map(n => values.filter(v => v === n).length);
  window.confidenceChart = new Chart(ctxElem.getContext("2d"), {
    type: "bar",
    data: {
      labels: ["Not confident", "Slightly", "Neutral", "Confident", "Very confident"],
      datasets: [{
        label: "Number of Answers",
        data: counts,
        backgroundColor: "#6BCB77"
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 } }
      }
    }
  });
}

// --- NOTIFICATIONS ---
/**
 * Show a notification with title, message, and image.
 * @param {string} title
 * @param {string} message
 * @param {string} imageUrl
 */
function showNotification(title, message, imageUrl) {
  let container = document.getElementById("notification-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "notification-container";
    container.className = "notification-container";
    container.setAttribute("role", "alert");
    container.setAttribute("aria-live", "assertive");
    document.body.appendChild(container);
  }
  const notification = document.createElement("div");
  notification.className = "notification";
  notification.innerHTML = `<h3>${title}</h3><p>${message}</p><img src="${imageUrl}" alt="${title}" />`;
  container.appendChild(notification);
  setTimeout(() => {
    notification.remove();
    if (container.children.length === 0) container.remove();
  }, 3000);
}

// --- BADGES ---
 /* Show a modal for a newly earned badge.
 */
function showBadgeModal(badge) {
  openModal("New Achievement Unlocked!", `
    <h3>${badge.name}</h3>
    <p>${badge.description}</p>
    <img src="badges/${badge.id}.png" alt="${badge.name}" style="width: 100px; height: 100px;" />
  `);
}

// --- STORAGE & DATA ---
/**
 * Save user stats to localStorage.
 */
function saveStats() {
  localStorage.setItem("quizStats", JSON.stringify({
    streak,
    correct,
    missedQuestions,

    masteredQuestions: getMasteredQuestionIds(), // <-- now defined
    sessionQuestionsAnswered,
    // add any other stats you want to persist
  }));
}

/**
 * Load user stats from localStorage.
 */
function loadStats() {
  const savedStats = JSON.parse(localStorage.getItem("userStats"));
  if (savedStats) {
    correct = savedStats.correct || 0;
    streak = savedStats.streak || 0;
    current = savedStats.current || 0;
    quiz = quiz.slice(0, savedStats.quizLength || quiz.length);
  }
}

/**
 * Save missed questions to localStorage.
 */
function saveUserData() {
  localStorage.setItem("missedQuestions", JSON.stringify(missedQuestions));
}

/**
 * Load missed questions from localStorage.
 */
function loadUserData() {
  missedQuestions = JSON.parse(localStorage.getItem("missedQuestions")) || [];
}

/**
 * Save quiz result to localStorage and update history chart.
 */
function saveQuizResult() {
  const results = JSON.parse(localStorage.getItem("quizResults")) || [];
  results.push({ streak, total: quiz.length, score: correct, date: new Date().toISOString() });
  localStorage.setItem("quizResults", JSON.stringify(results));
  renderHistoryChart();
}

/**
 * Update question metadata (attempts, correct/incorrect count, last attempt time).
 */
function updateQuestionMeta(qid, isCorrect) {
  const metaMap = JSON.parse(localStorage.getItem("questionMeta") || "{}");
  if (!metaMap[qid]) {
    metaMap[qid] = { attempts: 0, correct: 0, incorrect: 0, lastAttempt: null };
  }
  metaMap[qid].attempts++;
  if (isCorrect) metaMap[qid].correct++;
  else metaMap[qid].incorrect++;
  metaMap[qid].lastAttempt = Date.now();
  localStorage.setItem("questionMeta", JSON.stringify(metaMap));
}

// --- ANALYTICS ---
/**
 * Get mastery stats for each topic.
 * @returns {Object}
 */
function getTopicMastery() {
  const topicStats = {};
  questions.forEach(q => {
    if (!q.topic) return;
    if (!topicStats[q.topic]) topicStats[q.topic] = { correct: 0, incorrect: 0, total: 0 };
    topicStats[q.topic].correct += q.stats?.correct || 0;
    topicStats[q.topic].incorrect += q.stats?.incorrect || 0;
    topicStats[q.topic].total += (q.stats?.correct || 0) + (q.stats?.incorrect || 0);
  });
  return topicStats;
}

/**
 * Get color for topic mastery based on accuracy.
 */
function masteryColor(accuracy) {
  // accuracy: 0.0 (red) to 1.0 (green)
  const r = Math.round(255 * (1 - accuracy));
  const g = Math.round(200 * accuracy + 80 * (1 - accuracy));
  return `rgb(${r},${g},86)`; // Red to green
}

/**
 * Get questions that need smart review (low accuracy or multiple misses).
 * @returns {Array}
 */
function getQuestionsForSmartReview() {
  return questions.filter(q => (q.stats?.incorrect || 0) > 1 || ((q.stats?.correct || 0) / ((q.stats?.correct || 0) + (q.stats?.incorrect || 0))) < 0.7);
}

/**
 * Get accuracy stats for each topic.
 * @returns {Object}
 */
function getAccuracyPerTopic() {
  const stats = {};
  questions.forEach(q => {
    if (!q.topic) return;
    if (!stats[q.topic]) stats[q.topic] = { correct: 0, total: 0 };
    stats[q.topic].correct += q.stats?.correct || 0;
    stats[q.topic].total += (q.stats?.correct || 0) + (q.stats?.incorrect || 0);
  });
  Object.keys(stats).forEach(topic => {
    stats[topic].accuracy = stats[topic].total > 0 ? Math.round((stats[topic].correct / stats[topic].total) * 100) : 0;
  });
  return stats;
}

/**
 * Get questions that have been mastered.
 * @param {number} [threshold=3] - The number of correct answers required to consider a question mastered.
 * @returns {Array}
 */
function getQuestionsMastered(threshold = 3) {
  return questions.filter(q => q.stats?.correct >= threshold);
}

/**
 * Get questions that have been repeated.
 * @returns {Array}
 */
function getQuestionsRepeated() {
  return questions.filter(q => (q.stats?.correct || 0) + (q.stats?.incorrect || 0) > 1);
}

/**
 * Get topics with the lowest accuracy.
 * @param {number} [n=3] - The number of topics to return.
 * @returns {Array}
 */
function getLowestAccuracyTopics(n = 3) {
  const acc = getAccuracyPerTopic();
  return Object.entries(acc)
    .sort((a, b) => a[1].accuracy - b[1].accuracy)
    .slice(0, n)
    .map(([topic]) => topic);
}

/**
 * Get questions with the most errors.
 * @param {number} [n=5] - The number of questions to return.
 * @returns {Array}
 */
function getMostErroredQuestions(n = 5) {
  const errorMap = JSON.parse(localStorage.getItem("errorFrequencyMap") || "{}");
  return Object.entries(errorMap)
    .map(([qid, errors]) => ({
      qid,
      totalErrors: Object.values(errors).reduce((a, b) => a + b, 0)
    }))
    .sort((a, b) => b.totalErrors - a.totalErrors)
    .slice(0, n)
    .map(e => questions.find(q => q.id === e.qid))
    .filter(Boolean);
}

/**
 * Get adaptive quiz questions based on user performance.
 * Focus on most missed and low mastery questions.
 */
function getAdaptiveQuiz() {
  const mostMissed = getMostErroredQuestions(10);
  const lowMastery = questions.filter(q => {
    const stats = q.stats || {};
    const total = (stats.correct || 0) + (stats.incorrect || 0);
    return total > 0 && ((stats.correct || 0) / total) < 0.7;
  });
  const adaptivePool = [...new Set([...mostMissed, ...lowMastery])];
  return adaptivePool.length > 0 ? adaptivePool : questions;
}

/**
 * Get smart quiz questions based on lowest accuracy and least recent attempts.
 * @param {number} [limit=20] - The maximum number of questions to return.
 * @returns {Array}
 */
function getSmartQuizQuestions(limit = 20) {
  const metaMap = JSON.parse(localStorage.getItem("questionMeta") || "{}");
  const sorted = questions
    .map(q => {
      const meta = metaMap[q.id] || {};
      const accuracy = meta.attempts ? (meta.correct || 0) / meta.attempts : 0;
      return { ...q, meta, accuracy };
    })
    .sort((a, b) => {
      if (a.accuracy !== b.accuracy) return a.accuracy - b.accuracy;
      return (a.meta.lastAttempt || 0) - (b.meta.lastAttempt || 0);
    });
  return sorted.slice(0, limit);
}

// Example: Build quiz from selected tags
function buildCustomQuiz(questions, selectedTags, count = 10) {
  const pool = questions.filter(q => q.tags.some(tag => selectedTags.includes(tag)));
  return pool.slice(0, count);
}

function getSmartRecommendation() {
  const lowest = getLowestAccuracyTopics(1)[0];
  if (lowest) {
    return `Focus on <strong>${formatTopicName(lowest)}</strong> for best improvement!`;
  }
  return "Keep practicing to improve your mastery!";
}

function getConfidenceAccuracyCorrelation() {
  const confidences = JSON.parse(localStorage.getItem("questionConfidence") || "{}");
  let confidentAndCorrect = 0, confidentTotal = 0, lowConfAndWrong = 0, lowConfTotal = 0;
  questions.forEach(q => {
    const conf = confidences[q.id];
    if (conf >= 4) { // confident
      confidentTotal++;
      if (q.stats?.correct > q.stats?.incorrect) confidentAndCorrect++;
    } else if (conf && conf <= 2) { // not confident
      lowConfTotal++;
      if ((q.stats?.incorrect || 0) > (q.stats?.correct || 0)) lowConfAndWrong++;
    }
  });
  return {
    confidentAccuracy: confidentTotal ? Math.round(100 * confidentAndCorrect / confidentTotal) : 0,
    lowConfError: lowConfTotal ? Math.round(100 * lowConfAndWrong / lowConfTotal) : 0
  };
}

// --- BOOKMARKS ---
/**
 * Toggle bookmark state for a question.
 */
function toggleBookmark(questionId) {
  let bookmarks = JSON.parse(localStorage.getItem("bookmarkedQuestions")) || [];
  if (bookmarks.includes(questionId)) bookmarks = bookmarks.filter(id => id !== questionId);
  else bookmarks.push(questionId);
  localStorage.setItem("bookmarkedQuestions", JSON.stringify(bookmarks));
}

/**
 * Get all bookmarked questions from the full question list.
 */
function getBookmarkedQuestions(allQuestions) {
  const bookmarks = JSON.parse(localStorage.getItem("bookmarkedQuestions")) || [];
  return allQuestions.filter(q => bookmarks.includes(q.id));
}

// --- TOPIC DROPDOWN ---
// Example: Group questions by unit (top-level folder)
function groupQuestionsByUnit(manifest) {
  const units = {};
  manifest.forEach(path => {
    // Extract the unit name (first folder after 'questions/')
    const match = path.match(/^questions\/([^/]+)\//);
    if (match) {
      const unit = match[1];
      if (!units[unit]) units[unit] = [];
      units[unit].push(path);
    }
  });
  return units;
}

// --- FIREBASE HELPERS ---
async function submitSuggestionToFirestore(suggestion) {
  try {
    await addDoc(collection(db, "suggestedQuestions"), suggestion);
  } catch (error) {
    showNotification("Error", "Failed to submit suggestion. Try again later.", "badges/summary.png");
    console.error("Error submitting suggestion:", error);
  }
}

async function submitReportToFirestore(report) {
  try {
    await addDoc(collection(db, "reportedQuestions"), report);
  } catch (error) {
    showNotification("Error", "Failed to submit report. Try again later.", "badges/summary.png");
    console.error("Error submitting report:", error);
  }
}

async function saveUserProfile(uid, data) {
  try {
    await setDoc(doc(db, "users", uid), data, { merge: true });
    showNotification("Success", "Your progress was saved!", "badges/summary.png");
  } catch (error) {
    showNotification("Error", "Failed to save your progress. Please try again.", "badges/summary.png");
    console.error("Error saving user profile:", error);
  }
}

async function loadUserProfile(uid) {
  const statusElem = document.querySelector("#status");
  try {
    if (statusElem) statusElem.innerText = "Loading your profile...";
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      // Merge Firestore data into your app state as needed
      showNotification("Loaded", "Your profile was loaded.", "badges/summary.png");
    } else {
      showNotification("Info", "No profile found. Start practicing to save your progress!", "badges/summary.png");
    }
  } catch (error) {
    showNotification("Error", "Failed to load your profile. Please try again.", "badges/summary.png");
    console.error("Error loading user profile:", error);
  } finally {
    if (statusElem) statusElem.innerText = "";
  }
}

// Sign in with Google (global sign-in button)
document.getElementById("signInBtn")?.addEventListener("click", async () => {
  console.log("Sign-in button clicked"); // Debug: confirm handler fires
  const provider = new GoogleAuthProvider();
  try {
    if (isMobile()) {
      console.log("Using signInWithRedirect");
      await signInWithRedirect(auth, provider);
    } else {
      console.log("Using signInWithPopup");
      await signInWithPopup(auth, provider);
    }
  } catch (error) {
    console.error("Google sign-in error:", error); // Debug: log errors
    alert("Sign-in failed: " + (error && error.message ? error.message : error));
  }
});

// Sign out
const signOutBtn = document.getElementById("signOutBtn");
if (signOutBtn) signOutBtn.addEventListener("click", async () => {
  await signOut(auth);
});
const signoutBtn = document.getElementById("signout-btn");
if (signoutBtn) signoutBtn.onclick = () => signOut(auth);

// Update UI on auth state change
const profileAvatar = document.getElementById("profileAvatar");
onAuthStateChanged(auth, user => {
  if (user) {
    if (profileAvatar) profileAvatar.src = user.photoURL || "default-avatar.png";
    document.getElementById("signout-btn").style.display = "block";
  } else {
    if (profileAvatar) profileAvatar.src = "default-avatar.png";
    document.getElementById("signout-btn").style.display = "none";
  }
});

// Try to load earnedBadges from Firestore (if signed in), else from localStorage
let earnedBadges = [];

onAuthStateChanged(auth, async user => {
  if (user) {
    // Try to load from Firestore
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists() && Array.isArray(userDoc.data().earnedBadges)) {
      earnedBadges = userDoc.data().earnedBadges;
    } else {
      earnedBadges = [];
    }
  } else {
    // Fallback to localStorage if not signed in
    earnedBadges = JSON.parse(localStorage.getItem("earnedBadges") || "[]");
  }
});

export { saveUserProfile, loadUserProfile, showNotification, getStreak };

/**
 * Get streak data from localStorage.
 * @returns {Object}
 */
function getStreak() {
  let progress;
  try {
    progress = JSON.parse(localStorage.getItem("dailyProgress") || "{}");
  } catch (e) {
    progress = {};
  }
  const todayStr = new Date().toISOString().slice(0, 10);
  const days = Object.keys(progress)
    .filter(date => date <= todayStr) // Ignore future dates
    .sort()
    .reverse();
  let streak = 0;
  let d = new Date();
  for (let i = 0; i < days.length; i++) {
    if (days[i] === d.toISOString().slice(0, 10)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

/**
 * Get IDs of mastered questions (3+ correct by default).
 * @returns {Array}
 */
function getMasteredQuestionIds(threshold = 3) {
  return questions.filter(q => q.stats?.correct >= threshold).map(q => q.id);
}

// --- END OF FILE ---

// Collect answer stats as users answer questions
// Then render with Chart.js as a bar chart

function getSpacedRepetitionQuestions() {
  const now = Date.now();
  return questions.filter(q => {
    const review = JSON.parse(localStorage.getItem("review_" + q.id) || "{}");
    return !review.lastMissed || now > (review.lastMissed + (review.interval || 86400000));
  });
}

document.getElementById("soundFeedbackToggle")?.addEventListener("change", (e) => {
  localStorage.setItem("soundFeedback", e.target.checked ? "on" : "off");
});
document.getElementById("darkModeToggle")?.addEventListener("change", (e) => {
  const enabled = e.target.checked;
  localStorage.setItem("darkMode", enabled ? "on" : "off");
  document.body.classList.toggle("dark-mode", enabled);
});

if (localStorage.getItem("darkMode") === "on") {
  document.body.classList.add("dark-mode");
}

document.getElementById("questionSearchBtn")?.addEventListener("click", () => {
  const query = document.getElementById("questionSearchInput").value.trim().toLowerCase();
  const resultsDiv = document.getElementById("searchResults");
  if (!query) {
    resultsDiv.innerHTML = "";
    return;
  }
  const results = questions.filter(q =>
    q.question.toLowerCase().includes(query) ||
    (q.topic && q.topic.toLowerCase().includes(query)) ||
    (q.answers && q.answers.some(a => a.toLowerCase().includes(query)))
  );
  if (results.length === 0) {
    resultsDiv.innerHTML = "<p>No questions found.</p>";
    return;
  }
  resultsDiv.innerHTML = results.map(q => `
    <div class="search-result" style="margin-bottom:12px;">
      <strong>${formatTopicName(q.topic)}</strong><br>
      <span>${q.question}</span>
      <button class="modal-btn" onclick="startSingleQuestion('${q.id}')">Review</button>
    </div>
  `).join("");
});

// Helper to start a review of a single question
window.startSingleQuestion = function(qid) {
  const q = questions.find(q => q.id === qid);
  if (!q) return;
  quiz = [q];
  current = 0; correct = 0; streak = 0;
  document.querySelector(".quiz-card").classList.remove("hidden");
  renderQuestion();
  document.getElementById("searchResults").innerHTML = "";
};

function updateMasteryStatus() {
  const mastered = getQuestionsMastered().length;
  const total = questions.length;
  document.getElementById("masteryStatus").innerHTML = `
    <strong>Mastery:</strong> ${mastered}/${total}
  `;
}

// --- END OF FILE ---

function showProfileModal() {
  const user = auth.currentUser;
  openModal("Profile", `
    <div style="text-align:center;">
      <img src="${user?.photoURL || 'default-avatar.png'}" alt="Avatar" style="width:80px;height:80px;border-radius:50%;margin-bottom:12px;">
      <h3>${user?.displayName || "User"}</h3>
      <p><strong>Email:</strong> ${user?.email || "Not signed in"}</p>
      <div style="margin:16px 0;">
        <button class="modal-btn" id="smartLearningBtn">Smart Learning</button>
        <button class="modal-btn" id="viewAnalyticsBtn">View Analytics</button>
      </div>
      <div style="margin:16px 0;">
        <label style="margin-right:12px;">
          <input type="checkbox" id="profileDarkModeToggle" ${document.body.classList.contains("dark-mode") ? "checked" : ""}>
          Dark Mode
        </label>
        <label>
          <input type="checkbox" id="profileSoundToggle" ${localStorage.getItem("soundFeedback") === "on" ? "checked" : ""}>
          Sound Feedback
        </label>
      </div>
      <div style="margin-top:16px;">
        ${user
          ? `<button class="modal-btn" onclick="signOut()">Sign Out</button>`
          : `<button class="modal-btn" onclick="document.getElementById('signInBtn').click()">Sign In with Google</button>`
        }
      </div>
    </div>
  `);

  setTimeout(() => {
    document.getElementById("smartLearningBtn")?.addEventListener("click", showSmartLearningModal);
    document.getElementById("viewAnalyticsBtn")?.addEventListener("click", showAnalyticsModal);
    document.getElementById("profileDarkModeToggle")?.addEventListener("change", (e) => {
      const enabled = e.target.checked;
      localStorage.setItem("darkMode", enabled ? "on" : "off");
      document.body.classList.toggle("dark-mode", enabled);
    });
    document.getElementById("profileSoundToggle")?.addEventListener("change", (e) => {
      localStorage.setItem("soundFeedback", e.target.checked ? "on" : "off");
    });
  }, 0);
}
window.showProfileModal = showProfileModal;

/**
 * Record a wrong answer for analytics or review purposes.
 * @param {string} qid - The question ID.
 * @param {string} answer - The given answer.
 */
function recordWrongAnswer(q) {
  // Optionally log or store wrong answers here
  // Example: missedQuestions.push(q);
}

document.getElementById("profileBtn")?.addEventListener("click", showProfileModal);

// --- FIRESTORE STATS ---

async function saveStatsToFirestore() {
  if (!auth.currentUser) return;
  const stats = {
    streak,
    correct,
    missedQuestions,
    masteredQuestions: getMasteredQuestionIds(),
    sessionQuestionsAnswered,
    quizResults: JSON.parse(localStorage.getItem("quizResults") || "[]"),
    questionConfidence: JSON.parse(localStorage.getItem("questionConfidence") || "{}"),
    masteryHistory: JSON.parse(localStorage.getItem("masteryHistory") || "[]"),
    lastUpdated: new Date().toISOString()
  };
  await setDoc(doc(db, "users", auth.currentUser.uid), { stats }, { merge: true });
}

/**
 * Merge Firestore stats with local stats and update localStorage.
 * Call this after login to ensure all progress is preserved.
 */
function mergeStats(local, remote) {
  // Merge arrays and deduplicate by unique keys (e.g., date or id)
  function mergeArray(localArr, remoteArr, key = "date") {
    const map = {};
    [...(localArr || []), ...(remoteArr || [])].forEach(item => {
      if (item && item[key]) map[item[key]] = item;
    });
    return Object.values(map);
  }

  // Merge objects (e.g., confidence ratings)
  function mergeObject(localObj, remoteObj) {
    return { ...(localObj || {}), ...(remoteObj || {}) };
  }

  // Merge numbers (take max or sum as needed)
  function mergeNumber(localNum, remoteNum, mode = "max") {
    if (mode === "sum") return (localNum || 0) + (remoteNum || 0);
    return Math.max(localNum || 0, remoteNum || 0);
  }

  return {
    streak: mergeNumber(local.streak, remote.streak, "max"),
    correct: mergeNumber(local.correct, remote.correct, "sum"),
    missedQuestions: Array.from(new Set([...(local.missedQuestions || []), ...(remote.missedQuestions || [])])),
    masteredQuestions: Array.from(new Set([...(local.masteredQuestions || []), ...(remote.masteredQuestions || [])])),
    sessionQuestionsAnswered: mergeNumber(local.sessionQuestionsAnswered, remote.sessionQuestionsAnswered, "sum"),
    quizResults: mergeArray(local.quizResults, remote.quizResults, "date"),
    questionConfidence: mergeObject(local.questionConfidence, remote.questionConfidence),
    masteryHistory: mergeArray(local.masteryHistory, remote.masteryHistory, "date"),
    exp: mergeNumber(local.exp, remote.exp, "sum"),
    earnedBadges: Array.from(new Set([...(local.earnedBadges || []), ...(remote.earnedBadges || [])])),
    // Add more fields as needed
  };
}

/**
 * Load and merge stats from Firestore with localStorage.
 */
async function loadStatsFromFirestore() {
  if (!auth.currentUser) return;
  const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
  if (userDoc.exists() && userDoc.data().stats) {
    const remote = userDoc.data().stats;
    const local = {
      streak: parseInt(localStorage.getItem("streak") || "0", 10),
      correct: parseInt(localStorage.getItem("correct") || "0", 10),
      missedQuestions: JSON.parse(localStorage.getItem("missedQuestions") || "[]"),
      masteredQuestions: JSON.parse(localStorage.getItem("masteredQuestions") || "[]"),
      sessionQuestionsAnswered: parseInt(localStorage.getItem("sessionQuestionsAnswered") || "0", 10),
      quizResults: JSON.parse(localStorage.getItem("quizResults") || "[]"),
      questionConfidence: JSON.parse(localStorage.getItem("questionConfidence") || "{}"),
      masteryHistory: JSON.parse(localStorage.getItem("masteryHistory") || "[]"),
      exp: parseInt(localStorage.getItem("exp") || "0", 10),
      earnedBadges: JSON.parse(localStorage.getItem("earnedBadges") || "[]"),
    };
    const merged = mergeStats(local, remote);

    // Save merged stats back to localStorage
    localStorage.setItem("streak", merged.streak);
    localStorage.setItem("correct", merged.correct);
    localStorage.setItem("missedQuestions", JSON.stringify(merged.missedQuestions));
    localStorage.setItem("masteredQuestions", JSON.stringify(merged.masteredQuestions));
    localStorage.setItem("sessionQuestionsAnswered", merged.sessionQuestionsAnswered);
    localStorage.setItem("quizResults", JSON.stringify(merged.quizResults));
    localStorage.setItem("questionConfidence", JSON.stringify(merged.questionConfidence));
    localStorage.setItem("masteryHistory", JSON.stringify(merged.masteryHistory));
    localStorage.setItem("exp", merged.exp);
    localStorage.setItem("earnedBadges", JSON.stringify(merged.earnedBadges));
  }
}

onAuthStateChanged(auth, async user => {
  if (user) {
    await loadStatsFromFirestore(); // <-- Add this line
    // ...rest of your logic
  }
});

let exp = parseInt(localStorage.getItem("exp") || "0", 10);

async function checkBadges() {
  // ...existing code...
  exp += 10; // or whatever logic you want for EXP per question
  localStorage.setItem("exp", exp);
  if (auth.currentUser) {
    await setDoc(doc(db, "users", auth.currentUser.uid), { earnedBadges, exp }, { merge: true });
  }
}
// Before signOut(auth)
await saveStatsToFirestore();

document.getElementById("accuracyChart")
document.getElementById("confidenceChart")
document.getElementById("masteryHistoryChart")
document.getElementById("historyChart")
localStorage.getItem("quizResults")
localStorage.getItem("questionConfidence")
localStorage.getItem("masteryHistory")

window.onerror = function(message, source, lineno, colno, error) {
  alert("Error: " + message + "\n" + source + ":" + lineno);
};


