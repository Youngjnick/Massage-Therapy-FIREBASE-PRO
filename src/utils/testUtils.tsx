// src/utils/testUtils.ts

import { render } from '@testing-library/react';
import { QuizProvider } from '../context/QuizContext';
import { ThemeProvider } from '../context/ThemeContext';

export function renderWithProviders(ui: React.ReactElement) {
  return render(
    <ThemeProvider>
      <QuizProvider>
        {ui}
      </QuizProvider>
    </ThemeProvider>
  );
}
