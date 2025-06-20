// questionUtils.js
// Shared normalization logic for all question scripts

export function normalizeQuestionFields(q) {
  // Normalize answer_options to options
  if (!q.options && Array.isArray(q.answer_options)) {
    q.options = q.answer_options;
  }
  // Auto-generate abcd if missing and options exists
  if (!q.abcd && Array.isArray(q.options)) {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    q.abcd = q.options.map((opt, idx) => `${letters[idx] || '?'}${opt.startsWith('.') ? '' : '. '} ${opt}`.trim());
  }
  return q;
}
