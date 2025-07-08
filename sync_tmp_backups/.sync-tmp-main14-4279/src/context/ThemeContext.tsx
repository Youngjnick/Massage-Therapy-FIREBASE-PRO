import React, { createContext, useContext, useState } from 'react';

interface ThemeContextProps {
  colorPrimary: string;
  colorSecondary: string;
  borderRadius: number;
  // Add more theme variables as needed
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // You can load these from a config or allow user overrides
  const [theme] = useState<ThemeContextProps>({
    colorPrimary: '#3b82f6',
    colorSecondary: '#6ee7b7',
    borderRadius: 8,
  });
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
