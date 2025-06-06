import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/auth.context';
import { ToastProviderWrapper } from './contexts/toast.context';
import { ThemeProvider, useTheme } from './contexts/theme.context';
import Layout from './components/layout/Layout';
import './i18n';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import DashboardPage from './pages/Dashboard';
import AdminPage from './pages/Admin';
import UpgradeToProPage from './pages/UpgradeToPro';
import VerifyEmailPage from './pages/VerifyEmail';
import RequestPasswordResetPage from './pages/RequestPasswordReset';
import VerifyPasswordResetPage from './pages/VerifyPasswordReset';
import { requireAuth } from './utils/auth';
import './index.css';

// Protected route component
const ProtectedRoute = ({ children }) => {
  if (!requireAuth()) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// AppContent component to use the theme context
function AppContent() {
  return (
    <Router>
      <AuthProvider>
        <ToastProviderWrapper>
          <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
            <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/reset-password" element={<RequestPasswordResetPage />} />
            <Route path="/reset-password/verify" element={<VerifyPasswordResetPage />} />
            
            {/* Protected routes with layout */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              
              <Route 
                path="dashboard" 
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="admin" 
                element={
                  <ProtectedRoute>
                    <AdminPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="upgrade" 
                element={
                  <ProtectedRoute>
                    <UpgradeToProPage />
                  </ProtectedRoute>
                } 
              />
            </Route>
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          </Suspense>
        </ToastProviderWrapper>
      </AuthProvider>
    </Router>
  );
}

// Main App component with providers
function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
