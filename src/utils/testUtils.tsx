// src/utils/testUtils.ts

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuizProvider } from '../context/QuizContext';
import { ThemeProvider } from '../context/ThemeContext';
import { ToastProvider } from '../context/ToastContext';
import { FeatureFlagProvider } from '../context/FeatureFlagContext';

export function renderWithProviders(ui: React.ReactElement) {
  return render(
    <FeatureFlagProvider>
      <ThemeProvider>
        <QuizProvider>
          <ToastProvider>
            {ui}
          </ToastProvider>
        </QuizProvider>
      </ThemeProvider>
    </FeatureFlagProvider>
  );
}

export { renderWithProviders as render };
export { screen, fireEvent };
