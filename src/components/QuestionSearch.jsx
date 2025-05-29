import React, { useState } from "react";
import { useBookmarks } from "./BookmarkContext.jsx";

/**
 * QuestionSearch - React version of the question search bar and results.
 * Props:
 *   questions: array - all questions to search
 */
export default function QuestionSearch({ questions }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const { addBookmark, isBookmarked } = useBookmarks();

  function doSearch(e) {
    e && e.preventDefault();
    const q = query.trim().toLowerCase();
    if (!q) { setResults([]); return; }
    const matches = questions.filter(qn =>
      (qn.question && qn.question.toLowerCase().includes(q)) ||
      (qn.answers && qn.answers.some(a => a.toLowerCase().includes(q)))
    );
    setResults(matches);
  }

  return (
    <div style={{ margin: "16px 0" }}>
      <form onSubmit={doSearch} style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          placeholder="Search questions..."
          style={{ width: "80%", padding: 6 }}
          value={query}
          onChange={e => setQuery(e.target.value)}
          data-testid="question-search-input"
          id="questionSearchInput"
        />
        <button type="submit" className="modal-btn" data-testid="question-search-btn" id="questionSearchBtn">Search</button>
      </form>
      <div id="searchResults" data-testid="search-results">
        {results.length === 0 && query && <div className="search-result" data-testid="search-no-results">No results found.</div>}
        {results.map((q, i) => (
          <div className="search-result" key={i} style={{ margin: "8px 0" }}>
            <b>{q.question}</b><br />
            <small>{(q.answers || []).join(", ")}</small>
            <br />
            <button
              style={{ marginTop: 4, background: isBookmarked(q.id) ? '#aaa' : '#6BCB77', color: '#fff', border: 'none', borderRadius: 6, padding: '2px 10px', cursor: isBookmarked(q.id) ? 'not-allowed' : 'pointer', fontSize: 14 }}
              onClick={() => !isBookmarked(q.id) && addBookmark(q.id)}
              disabled={isBookmarked(q.id)}
              data-testid={`bookmark-search-btn-${q.id}`}
            >
              {isBookmarked(q.id) ? 'Bookmarked' : 'Add to Bookmarks'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
