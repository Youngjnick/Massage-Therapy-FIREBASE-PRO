import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BookmarksToggleButton from '../components/Quiz/BookmarksToggleButton';
import * as bookmarksApi from '../bookmarks';

jest.mock('../bookmarks');

const mockBookmark = { id: 'q1', questionId: 'q1', userId: 'user1' };

describe('BookmarksToggleButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should add a bookmark when not bookmarked', async () => {
    (bookmarksApi.getBookmarks as jest.Mock).mockResolvedValue([]);
    (bookmarksApi.addBookmark as jest.Mock).mockResolvedValue(undefined);
    render(<BookmarksToggleButton questionId="q1" userId="user1" />);
    const btn = await screen.findByRole('button', { name: /bookmark/i });
    fireEvent.click(btn);
    await waitFor(() => {
      expect(bookmarksApi.addBookmark).toHaveBeenCalledWith('user1', { questionId: 'q1' });
    });
  });

  it('should remove a bookmark when already bookmarked', async () => {
    (bookmarksApi.getBookmarks as jest.Mock).mockResolvedValue([mockBookmark]);
    (bookmarksApi.deleteBookmark as jest.Mock).mockResolvedValue(undefined);
    render(<BookmarksToggleButton questionId="q1" userId="user1" />);
    const btn = await screen.findByRole('button', { name: /bookmarked/i });
    fireEvent.click(btn);
    await waitFor(() => {
      expect(bookmarksApi.deleteBookmark).toHaveBeenCalledWith('q1');
    });
  });

  it('should display as bookmarked if already bookmarked', async () => {
    (bookmarksApi.getBookmarks as jest.Mock).mockResolvedValue([mockBookmark]);
    render(<BookmarksToggleButton questionId="q1" userId="user1" />);
    expect(await screen.findByRole('button', { name: /bookmarked/i })).toBeInTheDocument();
  });

  it('should display as not bookmarked if not bookmarked', async () => {
    (bookmarksApi.getBookmarks as jest.Mock).mockResolvedValue([]);
    render(<BookmarksToggleButton questionId="q1" userId="user1" />);
    expect(await screen.findByRole('button', { name: /bookmark/i })).toBeInTheDocument();
  });
});
