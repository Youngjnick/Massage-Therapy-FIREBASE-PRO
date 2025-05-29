import React, { useRef, useEffect } from "react";
import { useBookmarks } from "./BookmarkContext.jsx";

export default function BookmarkedSidebar({ questions, open, setOpen }) {
  const { bookmarks, removeBookmarkById } = useBookmarks();
  const sidebarRef = useRef();

  // Map bookmark IDs to question objects (if available)
  const bookmarkedQuestions = (bookmarks || [])
    .map(id => (questions || []).find(q => q.id === id))
    .filter(Boolean)
    .reverse(); // Show most recent first

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (open && sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, setOpen]);

  // Clear on close
  useEffect(() => {
    if (!open) {
      // Optionally clear any sidebar state here
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className={`bookmarked-sidebar-modal modal-overlay${open ? ' open' : ''}`} onClick={() => setOpen(false)}>
      <div
        className="modal-content bookmarked-sidebar-content"
        ref={sidebarRef}
        style={{
          maxWidth: 420,
          margin: '8vh auto',
          background: '#23272f',
          borderRadius: 18,
          padding: '32px 32px 24px 32px',
          position: 'relative',
          minHeight: 220,
          color: '#f3f6fa',
          boxShadow: '0 8px 32px #0008',
          fontSize: 17,
          lineHeight: 1.7,
        }}
        onClick={e => e.stopPropagation()}
        aria-label="Bookmarks List"
      >
        <button
          className="modal-close"
          style={{
            position: 'absolute',
            top: 14,
            right: 18,
            fontSize: 28,
            background: 'none',
            border: 'none',
            color: '#aaa',
            cursor: 'pointer',
            fontWeight: 700,
            transition: 'color 0.2s',
          }}
          aria-label="Close bookmarks list"
          onClick={() => setOpen(false)}
          onMouseOver={e => (e.currentTarget.style.color = '#fff')}
          onMouseOut={e => (e.currentTarget.style.color = '#aaa')}
        >
          &times;
        </button>
        <h2 className="modal-title" style={{ fontSize: 24, margin: '0 0 18px 0', fontWeight: 700, letterSpacing: 0.5 }}>Bookmarked Questions</h2>
        <div className="bookmarked-list">
          {bookmarkedQuestions.length === 0 ? (
            <div className="empty-message" style={{ marginTop: 16, fontStyle: "italic", color: "#888", fontSize: 17 }}>No bookmarks yet. Bookmark questions to see them here.</div>
          ) : (
            <ul className="bookmarked-questions-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {bookmarkedQuestions.map(q => (
                <li key={q.id} className="bookmarked-question-item" style={{ marginBottom: 18, borderBottom: '1px solid #333', paddingBottom: 12 }}>
                  <div className="question-text" style={{ fontWeight: 600, fontSize: 18, color: '#fff', marginBottom: 2 }}>{q.question ? q.question.slice(0, 120) : "Untitled"}</div>
                  {q.answer && <div className="answer-text" style={{ color: '#b3b8c7', marginTop: 2 }}>{q.answer}</div>}
                  <div className="question-meta" style={{ fontSize: 15, color: '#b3b8c7', marginTop: 2 }}>
                    <span className="topic">{q.topic}</span>
                    {q.tags && q.tags.length > 0 && (
                      <span className="tags">{q.tags.join(', ')}</span>
                    )}
                  </div>
                  <button
                    style={{ marginTop: 8, background: '#FF6B6B', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 15 }}
                    onClick={() => removeBookmarkById(q.id)}
                    aria-label="Delete bookmark"
                    data-testid={`delete-bookmark-btn-${q.id}`}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
