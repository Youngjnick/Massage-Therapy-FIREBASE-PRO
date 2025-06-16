import React from 'react';
import { FaBookmark } from 'react-icons/fa';

interface QuizBookmarksPanelProps {
  show: boolean;
  bookmarks: string[];
  quizQuestions: any[];
  onToggleBookmark: (_id: string) => void;
  onClose: () => void;
}

const QuizBookmarksPanel: React.FC<QuizBookmarksPanelProps> = ({
  show,
  bookmarks,
  quizQuestions,
  onToggleBookmark,
  onClose,
}) => {
  if (!show) return null;
  return (
    <div style={{ position: 'absolute', top: 56, right: 16, background: 'rgba(255,255,255,0.95)', borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.12)', padding: 20, minWidth: 320, zIndex: 20 }}>
      <h3 style={{ marginTop: 0 }}>Bookmarked Questions</h3>
      {bookmarks.length === 0 ? (
        <div style={{ color: '#64748b' }}>No bookmarks yet.</div>
      ) : (
        <ul style={{ maxHeight: 300, overflowY: 'auto', padding: 0, margin: 0, listStyle: 'none' }}>
          {quizQuestions.filter(q => bookmarks.includes(q.id)).map(q => (
            <li key={q.id} style={{ marginBottom: 12, display: 'flex', alignItems: 'center' }}>
              <span style={{ flex: 1 }}>{q.text}</span>
              <button onClick={() => onToggleBookmark(q.id)} style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer' }}>
                <FaBookmark color="#f59e42" /> Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      <button onClick={onClose} style={{ marginTop: 12 }}>Close</button>
    </div>
  );
};

export default QuizBookmarksPanel;
