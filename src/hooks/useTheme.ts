import { useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import themes, { AppTheme } from '../config/theme';

const THEME_KEY = '@theme_preference';

export const useTheme = () => {
  const systemTheme = useColorScheme();
  const [theme, setTheme] = useState<'light' | 'dark'>(systemTheme || 'light');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_KEY);
      if (savedTheme) {
        setTheme(savedTheme as 'light' | 'dark');
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    try {
      await AsyncStorage.setItem(THEME_KEY, newTheme);
      setTheme(newTheme);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const currentTheme: AppTheme = themes[theme];

  return {
    theme,
    toggleTheme,
    isLoading,
    currentTheme,
  };
}; 