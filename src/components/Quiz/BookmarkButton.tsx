import React from 'react';

interface BookmarkButtonProps {
  bookmarked: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const BookmarkButton: React.FC<BookmarkButtonProps> = ({ bookmarked, onClick, disabled }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
      style={{
        background: 'none',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        color: bookmarked ? '#f59e42' : '#888',
        fontSize: 22,
        marginLeft: 8,
        verticalAlign: 'middle',
      }}
      data-testid="bookmark-btn"
    >
      {bookmarked ? '★' : '☆'}
    </button>
  );
};

export default BookmarkButton;
