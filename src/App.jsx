import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { alertService } from './services/alertService';

import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';

import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { UsersPage } from './pages/UsersPage';
import { TripsPage } from './pages/TripsPage';
import { SafeZonePage } from './pages/SafeZonePage';
import { MonitoringPage } from './pages/MonitoringPage';
import { EmergencyPage } from './pages/EmergencyPage';
import { ReportsPage } from './pages/ReportsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProfilePage } from './pages/ProfilePage';
import { AppQRPage } from './pages/AppQRPage';

const ProtectedLayout = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const knownAlertIds = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const pollAlertsForNotifications = async () => {
      try {
        const res = await alertService.getAlerts();
        if (res.success && Array.isArray(res.alerts)) {
          if (knownAlertIds.current === null) {
            knownAlertIds.current = new Set(res.alerts.map(a => a.id));
          } else {
            res.alerts.forEach((alert) => {
              if (!knownAlertIds.current.has(alert.id)) {
                knownAlertIds.current.add(alert.id);
                toast.error(
                  `🚨 MOBILE SOS DISTRESS RECEIVED! ${alert.userName}: ${alert.message || 'Emergency Beacon Active'}`,
                  {
                    position: 'top-right',
                    autoClose: 8000,
                    hideProgressBar: false,
                  }
                );
              }
            });
          }
        }
      } catch (e) {
        // Silent catch for background poll
      }
    };

    pollAlertsForNotifications();
    const interval = setInterval(pollAlertsForNotifications, 3000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0F17] text-cyan-400 font-bold text-sm">
        Authenticating STSMS Command Center...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen mineral-canvas text-[#192E2A] flex relative overflow-x-hidden font-sans">
      {/* Soft Ambient Backdrop Orbs for Glassmorphism */}
      <div className="fixed top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-honey/8 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[10%] w-[600px] h-[600px] rounded-full bg-pine/5 blur-[140px] pointer-events-none" />

      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <Navbar collapsed={collapsed} />
      <main
        className={`flex-1 transition-all duration-300 pt-28 px-6 md:px-8 pb-12 relative z-10 ${
          collapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        {children}
      </main>
    </div>
  );
};


export const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Auth Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Admin Dashboard Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedLayout>
                  <DashboardPage />
                </ProtectedLayout>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedLayout>
                  <DashboardPage />
                </ProtectedLayout>
              }
            />
            <Route
              path="/app-qr"
              element={
                <ProtectedLayout>
                  <AppQRPage />
                </ProtectedLayout>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedLayout>
                  <UsersPage />
                </ProtectedLayout>
              }
            />
            <Route
              path="/trips"
              element={
                <ProtectedLayout>
                  <TripsPage />
                </ProtectedLayout>
              }
            />
            <Route
              path="/safe-zones"
              element={
                <ProtectedLayout>
                  <SafeZonePage />
                </ProtectedLayout>
              }
            />
            <Route
              path="/monitoring"
              element={
                <ProtectedLayout>
                  <MonitoringPage />
                </ProtectedLayout>
              }
            />
            <Route
              path="/emergency"
              element={
                <ProtectedLayout>
                  <EmergencyPage />
                </ProtectedLayout>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedLayout>
                  <NotificationsPage />
                </ProtectedLayout>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedLayout>
                  <ReportsPage />
                </ProtectedLayout>
              }
            />

            <Route
              path="/settings"
              element={
                <ProtectedLayout>
                  <SettingsPage />
                </ProtectedLayout>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedLayout>
                  <ProfilePage />
                </ProtectedLayout>
              }
            />

            {/* Fallback redirect */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>

        <ToastContainer
          position="bottom-right"
          autoClose={3000}
          theme="dark"
          toastClassName="font-sans text-xs rounded-xl border border-white/15 bg-[#25433E] text-white shadow-2xl"
        />
      </AuthProvider>
    </ThemeProvider>
  );
};
