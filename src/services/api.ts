// src/services/api.ts

export async function fetchQuestions() {
  const res = await fetch('/api/questions');
  if (!res.ok) throw new Error('Failed to fetch questions');
  return res.json();
}

export async function fetchUserStats(userId: string) {
  const res = await fetch(`/api/user-stats/${userId}`);
  if (!res.ok) throw new Error('Failed to fetch user stats');
  return res.json();
}
// Add more API functions as needed
