import React from 'react';
import { DefaultTheme, Provider as PaperProvider } from 'react-native-paper';

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#FF3B30', // Zomato-like bold red
    accent: '#FFD700',
    background: '#FFFFFF',
    surface: '#FFFFFF',
    text: '#222222'
  }
};

export const ThemeProvider = ({ children }) => {
  return (
    <PaperProvider theme={theme}>
      {children}
    </PaperProvider>
  );
};

export default theme;
