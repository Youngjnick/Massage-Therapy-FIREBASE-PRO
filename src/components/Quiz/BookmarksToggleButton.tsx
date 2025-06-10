import React from 'react';
import { FaBookOpen } from 'react-icons/fa';

interface BookmarksToggleButtonProps {
  showBookmarks: boolean;
  onClick: () => void;
}

const BookmarksToggleButton: React.FC<BookmarksToggleButtonProps> = ({ showBookmarks, onClick }) => (
  <button
    onClick={onClick}
    style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', zIndex: 10 }}
    title={showBookmarks ? 'Hide Bookmarked Questions' : 'Show Bookmarked Questions'}
    aria-label={showBookmarks ? 'Hide Bookmarked Questions' : 'Show Bookmarked Questions'}
  >
    <FaBookOpen size={28} color={showBookmarks ? '#3b82f6' : '#64748b'} />
  </button>
);

export default BookmarksToggleButton;
