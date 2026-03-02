import React, { createContext, useContext, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme as useDeviceScheme } from 'react-native';
import { useColorScheme as useTailwindScheme } from 'nativewind';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const isDarkMode = useDeviceScheme() === 'dark';
  const { setColorScheme } = useTailwindScheme();

  useEffect(() => {
    if (isDarkMode) {
      setColorScheme('dark');
      console.log('Device theme changed to: dark');
    } else {
      setColorScheme('light');
      console.log('Device theme changed to: light');
    }
  }, [isDarkMode, setColorScheme]);

  const toggleTheme = () => {
    // Optional: implement later if you want manual override
    console.warn('Manual theme toggle not supported in auto mode.');
  };

  return (
    <ThemeContext.Provider value={{ theme: isDarkMode ? 'dark' : 'light', toggleTheme }}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
