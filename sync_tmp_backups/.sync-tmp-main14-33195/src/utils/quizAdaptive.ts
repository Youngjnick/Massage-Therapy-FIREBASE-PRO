export function getNextQuestionIndex(activeQuestions: any[], current: number, userAnswers: number[], shuffledOptions: { [key: number]: string[] }, questionTimes: number[]) {
  if (!activeQuestions[current]?.difficulty) return current + 1;
  const currentDifficulty = activeQuestions[current].difficulty;
  const allDifficulties = Array.from(new Set(activeQuestions.map(q => q && q.difficulty).filter(Boolean)));
  const difficulties = ['easy', 'medium', 'intermediate', 'hard'].filter(d => allDifficulties.includes(d));
  let idx = difficulties.indexOf(currentDifficulty);
  if (idx === -1) return current + 1;
  let targetIdx = idx;
  // 1. Speed: if user was fast (<15s), try harder; if slow (>30s), try easier
  const lastTime = questionTimes[current] || 0;
  if (lastTime < 15 && idx < difficulties.length - 1) targetIdx++;
  if (lastTime > 30 && idx > 0) targetIdx--;
  // 2. Streak: if on a correct streak >=3, try harder
  let streak = 0;
  for (let i = current; i >= 0; i--) {
    if (userAnswers[i] !== undefined) {
      const q = activeQuestions[i] || { options: [], correctAnswer: undefined };
      const opts = shuffledOptions[i] || q.options || [];
      const correctOpt = opts.indexOf(q.correctAnswer);
      if (userAnswers[i] === correctOpt) streak++;
      else break;
    }
  }
  if (streak >= 3 && targetIdx < difficulties.length - 1) targetIdx++;
  // Clamp
  targetIdx = Math.max(0, Math.min(targetIdx, difficulties.length - 1));
  const targetDifficulty = difficulties[targetIdx];
  const currentTopic = activeQuestions[current] && activeQuestions[current].topic;
  // 1. Find next unanswered question of targetDifficulty and different topic
  for (let i = current + 1; i < activeQuestions.length; i++) {
    if (
      activeQuestions[i] &&
      activeQuestions[i].difficulty === targetDifficulty &&
      userAnswers[i] === undefined &&
      activeQuestions[i].topic !== currentTopic
    ) {
      return i;
    }
  }
  // 2. Next unanswered question of targetDifficulty (any topic)
  for (let i = current + 1; i < activeQuestions.length; i++) {
    if (activeQuestions[i] && activeQuestions[i].difficulty === targetDifficulty && userAnswers[i] === undefined) {
      return i;
    }
  }
  // Adaptive topic mix: increase frequency of weak topics
  // (Optional: can be added here if needed)
  // Fallback: closest available difficulty
  let searchOrder = [];
  for (let offset = 1; offset < difficulties.length; offset++) {
    if (targetIdx + offset < difficulties.length) searchOrder.push(difficulties[targetIdx + offset]);
    if (targetIdx - offset >= 0) searchOrder.push(difficulties[targetIdx - offset]);
  }
  for (const diff of searchOrder) {
    for (let i = current + 1; i < activeQuestions.length; i++) {
      if (activeQuestions[i] && activeQuestions[i].difficulty === diff && userAnswers[i] === undefined) {
        return i;
      }
    }
  }
  for (let i = current + 1; i < activeQuestions.length; i++) {
    if (userAnswers[i] === undefined) return i;
  }
  // No more questions
  return activeQuestions.length;
}
