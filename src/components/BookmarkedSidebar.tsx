import React, { useRef, useEffect } from "react";
import { useBookmarks } from "./BookmarkContext.jsx";

export default function BookmarkedSidebar({ questions, open, setOpen }) {
  const { bookmarks, removeBookmarkById } = useBookmarks();
  const sidebarRef = useRef();

  // Map bookmark IDs to question objects (if available)
  const bookmarkedQuestions = (bookmarks || [])
    .map((id) => (questions || []).find((q) => q.id === id))
    .filter(Boolean)
    .reverse(); // Show most recent first

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (
        open &&
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target)
      ) {
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

  // Focus trap for accessibility
  useEffect(() => {
    if (!open) return;
    const focusable = sidebarRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable?.[0];
    const last = focusable?.[focusable.length - 1];
    function handleKey(e) {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
      } else if (e.key === "Tab" && focusable && focusable.length > 1) {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", handleKey);
    setTimeout(() => {
      first?.focus();
    }, 0);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, setOpen]);

  return (
    <div
      className="modal-overlay bookmarked-sidebar-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bookmarked-sidebar-title"
      aria-describedby="bookmarked-sidebar-desc"
      aria-hidden={!open}
      tabIndex={-1}
      onClick={() => setOpen(false)}
      style={{
        display: open ? "flex" : "none",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        className="modal bookmarked-sidebar-content"
        ref={sidebarRef}
        onClick={(e) => e.stopPropagation()}
        style={{ outline: "2px solid #FFD93D" }}
      >
        <button
          className="app-btns close-modal"
          aria-label="Close bookmarks list"
          onClick={() => setOpen(false)}
          data-testid="close-bookmarked-sidebar-modal"
        >
          &times;
        </button>
        <div className="modal-header">
          <h2 id="bookmarked-sidebar-title">Bookmarked Questions</h2>
        </div>
        <div className="modal-body" id="bookmarked-sidebar-desc">
          {bookmarkedQuestions.length === 0 ? (
            <div className="empty-message">
              No bookmarks yet. Bookmark questions to see them here.
            </div>
          ) : (
            <ul className="bookmarked-questions-list">
              {bookmarkedQuestions.map((q) => (
                <li key={q.id} className="bookmarked-question-item">
                  <div className="question-text">
                    {q.question ? q.question.slice(0, 120) : "Untitled"}
                  </div>
                  {q.answer && <div className="answer-text">{q.answer}</div>}
                  <div className="question-meta">
                    <span className="topic">{q.topic}</span>
                    {q.tags && q.tags.length > 0 && (
                      <span className="tags">{q.tags.join(", ")}</span>
                    )}
                  </div>
                  <button
                    className="app-btns"
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
