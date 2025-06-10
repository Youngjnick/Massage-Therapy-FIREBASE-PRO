export function formatScore(score: number, total: number) {
  return `${score} / ${total}`;
}

export function formatTime(seconds: number) {
  if (isNaN(seconds)) return '-';
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return min > 0 ? `${min}m ${sec}s` : `${sec}s`;
}
