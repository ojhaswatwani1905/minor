import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppNavigator } from './navigation/AppNavigator';

// Keep the splash screen visible while assets & authentication state initialize
SplashScreen.preventAutoHideAsync().catch(() => {});

export const App = () => {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ThemeProvider>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </ThemeProvider>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F17',
  },
});

export default App;

