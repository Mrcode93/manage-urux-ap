import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster, toast } from 'react-hot-toast';
import DashboardLayout from './layouts/DashboardLayout';
import DarkModeToggle from './components/DarkModeToggle';
import { useStore } from './store/useStore';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { 
  ProtectedRouteWithPermissions, 
  UsersRoute, 
  LicensesRoute, 
  ActivationCodesRoute, 
  BackupsRoute, 
  SettingsRoute, 
  AnalyticsRoute,
  DashboardRoute,
  FeaturesRoute,
  PlansRoute,
  UpdatesRoute,
  CustomersRoute,
  LogsRoute,
  LicenseVerificationRoute,
  CloudBackupsRoute,
  SystemHealthRoute,
  ProfileRoute
} from './components/ProtectedRouteWithPermissions';

// HashRouter is used to enable client-side routing with hash-based URLs
// This allows the app to work without server-side routing configuration
// URLs will look like: http://localhost:3000/#/dashboard, http://localhost:3000/#/users, etc.

// Pages
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Settings from './pages/Settings';
import ActivationCodes from './pages/ActivationCodes';
import Features from './pages/Features';
import LicenseVerification from './pages/LicenseVerification';
import Updates from './pages/Updates';
import Plans from './pages/Plans';
import Backups from './pages/Backups';
import CloudBackups from './pages/CloudBackups';
import Login from './pages/Login';
import Profile from './pages/Profile';
import ManageUsers from './pages/ManageUsers';
import Logs from './pages/Logs';
import Accountant from './pages/Accountant';
import Apps from './pages/Apps';
import PWARegistration from './components/PWARegistration';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Component to handle initial route
function AppRoutes() {
  const location = useLocation();
  const { darkMode, toggleDarkMode } = useStore();

  useEffect(() => {
    // Check if the URL is just the base URL without any hash
    const currentHash = window.location.hash;
    const currentPath = window.location.pathname;
    
    // If we're at the root and there's no hash, or if the hash is just '#', redirect to dashboard
    if ((currentPath === '/' && currentHash === '') || currentHash === '#') {
      // Redirect to dashboard
      window.location.hash = '#/';
    }
  }, [location]);

  // Global keyboard shortcut for dark mode toggle (Ctrl/Cmd + D)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
        event.preventDefault();
        toggleDarkMode();
        toast.success(
          darkMode ? 'تم إيقاف الوضع الداكن' : 'تم تفعيل الوضع الداكن',
          {
            icon: darkMode ? '☀️' : '🌙',
            duration: 2000,
          }
        );
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [darkMode, toggleDarkMode]);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      
      {/* Protected routes */}
      <Route path="/" element={
        <DashboardRoute>
          <DashboardLayout>
            <Dashboard />
          </DashboardLayout>
        </DashboardRoute>
      } />
      
      <Route path="/users" element={
        <ProtectedRouteWithPermissions requiredResource="customers" requiredAction="read">
          <DashboardLayout>
            <Users />
          </DashboardLayout>
        </ProtectedRouteWithPermissions>
      } />
      
      <Route path="/manage-users" element={
        <ProtectedRouteWithPermissions requiredResource="users" requiredAction="read">
          <DashboardLayout>
            <ManageUsers />
          </DashboardLayout>
        </ProtectedRouteWithPermissions>
      } />
      
      <Route path="/profile" element={
        <ProfileRoute>
          <DashboardLayout>
            <Profile />
          </DashboardLayout>
        </ProfileRoute>
      } />
      
      <Route path="/activation-codes" element={
        <ProtectedRouteWithPermissions requiredResource="activation_codes" requiredAction="read">
          <DashboardLayout>
            <ActivationCodes />
          </DashboardLayout>
        </ProtectedRouteWithPermissions>
      } />
      
      <Route path="/features" element={
        <FeaturesRoute>
          <DashboardLayout>
            <Features />
          </DashboardLayout>
        </FeaturesRoute>
      } />
      
      <Route path="/verify-license" element={
        <LicenseVerificationRoute>
          <DashboardLayout>
            <LicenseVerification />
          </DashboardLayout>
        </LicenseVerificationRoute>
      } />
      
      <Route path="/settings" element={
        <ProtectedRouteWithPermissions requiredResource="settings" requiredAction="read">
          <DashboardLayout>
            <Settings />
          </DashboardLayout>
        </ProtectedRouteWithPermissions>
      } />
      
      <Route path="/updates" element={
        <UpdatesRoute>
          <DashboardLayout>
            <Updates />
          </DashboardLayout>
        </UpdatesRoute>
      } />
      
      <Route path="/plans" element={
        <PlansRoute>
          <DashboardLayout>
            <Plans />
          </DashboardLayout>
        </PlansRoute>
      } />
      
      <Route path="/backups" element={
        <ProtectedRouteWithPermissions requiredResource="backups" requiredAction="read">
          <DashboardLayout>
            <Backups />
          </DashboardLayout>
        </ProtectedRouteWithPermissions>
      } />
      
      <Route path="/cloud-backups" element={
        <CloudBackupsRoute>
          <DashboardLayout>
            <CloudBackups />
          </DashboardLayout>
        </CloudBackupsRoute>
      } />
      
      <Route path="/logs" element={
        <LogsRoute>
          <DashboardLayout>
            <Logs />
          </DashboardLayout>
        </LogsRoute>
      } />
      
      <Route path="/accountant" element={
        <ProtectedRouteWithPermissions requiredResource="customers" requiredAction="read">
          <DashboardLayout>
            <Accountant />
          </DashboardLayout>
        </ProtectedRouteWithPermissions>
      } />
      
      <Route path="/apps" element={
        <ProtectedRouteWithPermissions requiredResource="apps" requiredAction="read">
          <DashboardLayout>
            <Apps />
          </DashboardLayout>
        </ProtectedRouteWithPermissions>
      } />
      
      {/* Fallback: redirect any unknown routes to dashboard */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <Router>
          <AppRoutes />
          <DarkModeToggle />
        </Router>
        <Toaster 
          position="top-left" 
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
        <PWARegistration />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
