import React, { createContext, useContext, useState, useEffect } from 'react';

// Create the context
const ThemeContext = createContext();

// Get initial theme from localStorage or system preference
// This runs before the component mounts to prevent flickering
const getInitialTheme = () => {
  // Try to get theme from localStorage
  try {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      return savedTheme === 'dark';
    }
  } catch (error) {
    console.error('Error accessing localStorage:', error);
  }
  
  // If no theme is in localStorage or there was an error, check system preference
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch (error) {
    console.error('Error checking system preference:', error);
  }
  
  // Default fallback
  return false;
};

// Apply theme to document immediately to avoid flickering
const applyTheme = (isDark) => {
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

// Theme provider component
export const ThemeProvider = ({ children }) => {
  // Theme state initialized with the result from getInitialTheme
  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme());
  
  // Initialize theme from localStorage or system preference on mount
  useEffect(() => {
    // Apply theme on first render
    applyTheme(isDarkMode);
    
    try {
      // Save to localStorage
      localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme to localStorage:', error);
    }
  }, []);
  
  // Update document class and localStorage when theme changes
  useEffect(() => {
    try {
      // Apply theme changes
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    } catch (error) {
      console.error('Error updating theme:', error);
    }
    
    // Persist theme in sessionStorage as a fallback (works across page refreshes)
    try {
      sessionStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme to sessionStorage:', error);
    }
  }, [isDarkMode]);
  
  // Toggle theme function
  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      try {
        // Immediately persist the theme change for better user experience
        localStorage.setItem('theme', newMode ? 'dark' : 'light');
        sessionStorage.setItem('theme', newMode ? 'dark' : 'light');
      } catch (error) {
        console.error('Error toggling theme:', error);
      }
      return newMode;
    });
  };

  // Provider value
  const value = {
    isDarkMode,
    toggleTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
