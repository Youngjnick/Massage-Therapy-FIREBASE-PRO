import React from 'react';

interface QuizBookmarkItemProps {
  question: { id: string; text: string };
  bookmarked: boolean;
  onToggleBookmark: (id: string) => void;
  onReportError: (id: string) => void;
}

const QuizBookmarkItem: React.FC<QuizBookmarkItemProps> = ({ question, bookmarked, onToggleBookmark, onReportError }) => (
  <li style={{ marginBottom: 12, display: 'flex', alignItems: 'center' }}>
    <span style={{ flex: 1 }}>{question.text}</span>
    <button onClick={() => onToggleBookmark(question.id)} style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer' }}>
      {bookmarked ? 'Remove' : 'Bookmark'}
    </button>
    <button onClick={() => onReportError(question.id)} style={{ marginLeft: 4, background: 'none', border: 'none', cursor: 'pointer' }}>
      Report Error
    </button>
  </li>
);

export default QuizBookmarkItem;
