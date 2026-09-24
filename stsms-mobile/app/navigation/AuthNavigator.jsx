import React, { useState } from 'react';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';

export const AuthNavigator = () => {
  const [screen, setScreen] = useState('login');

  if (screen === 'register') {
    return <RegisterScreen onNavigateLogin={() => setScreen('login')} />;
  }

  if (screen === 'forgot') {
    return <ForgotPasswordScreen onNavigateLogin={() => setScreen('login')} />;
  }

  return (
    <LoginScreen
      onNavigateRegister={() => setScreen('register')}
      onNavigateForgot={() => setScreen('forgot')}
    />
  );
};
