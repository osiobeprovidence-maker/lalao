import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark'; // What is actually applied
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('lalao-theme');
    return (saved as Theme) || 'system';
  });
  
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('lalao-theme', newTheme);
  };

  useEffect(() => {
    const applyTheme = () => {
      let activeTheme: 'light' | 'dark' = 'light';
      if (theme === 'system') {
        const hour = new Date().getHours();
        // Daytime: 6 AM (6) to 6 PM (17:59). Nighttime: 6 PM (18) to 5:59 AM (5)
        activeTheme = (hour >= 18 || hour < 6) ? 'dark' : 'light';
      } else {
        activeTheme = theme;
      }
      
      setResolvedTheme(activeTheme);
      
      if (activeTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
    
    applyTheme();
    
    // Check every minute if the time has crossed the daytime/nighttime threshold
    const intervalId = setInterval(() => {
      if (theme === 'system') applyTheme();
    }, 60000);
    
    return () => clearInterval(intervalId);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
