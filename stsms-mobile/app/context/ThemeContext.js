import React, { createContext, useContext, useState } from 'react';
import { COLORS } from '../constants/colors';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Default to false for the flagship Pastel Pink & Warm Cream consumer theme
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => setIsDark(prev => !prev);

  const colors = isDark ? COLORS.dark : COLORS.light;

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
