import React, { useEffect, useState } from 'react';
import { getBookmarks, addBookmark, deleteBookmark } from '../../bookmarks';

interface Props {
  questionId: string;
  userId: string;
}

const BookmarksToggleButton: React.FC<Props> = ({ questionId, userId }) => {
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkId, setBookmarkId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getBookmarks(userId).then((bookmarks: any[]) => {
      const found = bookmarks.find(b => b.questionId === questionId);
      if (mounted) {
        setBookmarked(!!found);
        setBookmarkId(found ? found.id : null);
      }
    });
    return () => { mounted = false; };
  }, [questionId, userId]);

  const handleToggle = async () => {
    if (bookmarked && bookmarkId) {
      await deleteBookmark(bookmarkId);
      setBookmarked(false);
      setBookmarkId(null);
    } else {
      await addBookmark(userId, { questionId });
      setBookmarked(true);
      // In real app, refetch or get new id
    }
  };

  return (
    <button
      aria-label={bookmarked ? 'Bookmarked' : 'Bookmark'}
      aria-pressed={bookmarked}
      onClick={handleToggle}
      type="button"
    >
      {bookmarked ? '★ Bookmarked' : '☆ Bookmark'}
    </button>
  );
};

export default BookmarksToggleButton;
