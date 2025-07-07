import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import * as userSettingsApi from '../userSettings';
import Profile from '../pages/Profile';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

jest.mock('../userSettings');
jest.mock('firebase/auth');

const mockSettings = {
  showExplanations: true,
  darkMode: false,
  ariaSound: true,
  haptic: false,
};

describe('Profile integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (userSettingsApi.getUserSettings as jest.Mock).mockResolvedValue(mockSettings);
    (userSettingsApi.setUserSettings as jest.Mock).mockResolvedValue(undefined);
    (getAuth as jest.Mock).mockReturnValue({});
    (onAuthStateChanged as jest.Mock).mockImplementation((auth: any, cb: any) => { cb({ uid: 'test-user', displayName: 'Test User', photoURL: '' }); return () => {}; });
  });

  it('loads and displays user settings', async () => {
    render(<Profile />);
    expect(await screen.findByLabelText('Dark Mode')).toBeInTheDocument();
    expect(screen.getByLabelText('Aria Sound')).toBeChecked();
    expect(screen.getByLabelText('Haptic Feedback')).not.toBeChecked();
    expect(screen.getByLabelText('Show Explanations')).toBeChecked();
  });

  it('updates settings and persists changes', async () => {
    render(<Profile />);
    const darkMode = await screen.findByLabelText('Dark Mode');
    fireEvent.click(darkMode);
    await waitFor(() => {
      expect(userSettingsApi.setUserSettings).toHaveBeenCalled();
    });
  });
});
