import { useEffect, lazy, Suspense } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster, toast } from 'react-hot-toast';
import DashboardLayout from './layouts/DashboardLayout';
import DarkModeToggle from './components/DarkModeToggle';
import Loader from './components/Loader';
import { useStore } from './store/useStore';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ProtectedRouteWithPermissions,
  DashboardRoute,
  FeaturesRoute,
  UpdatesRoute,
  PlansRoute,
  LogsRoute,
  LicenseVerificationRoute,
  ProfileRoute
} from './components/ProtectedRouteWithPermissions';

// Pages - Lazy loaded for better performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Users = lazy(() => import('./pages/Users'));
const Settings = lazy(() => import('./pages/Settings'));
const ActivationCodes = lazy(() => import('./pages/ActivationCodes'));
const Features = lazy(() => import('./pages/Features'));
const LicenseVerification = lazy(() => import('./pages/LicenseVerification'));
const Updates = lazy(() => import('./pages/Updates'));
const Plans = lazy(() => import('./pages/Plans'));
const Backups = lazy(() => import('./pages/Backups'));
const Login = lazy(() => import('./pages/Login'));
const Profile = lazy(() => import('./pages/Profile'));
const ManageUsers = lazy(() => import('./pages/ManageUsers'));
const Logs = lazy(() => import('./pages/Logs'));
const Accountant = lazy(() => import('./pages/Accountant'));
const Apps = lazy(() => import('./pages/Apps'));
const Notifications = lazy(() => import('./pages/Notifications'));

// Components
import PWARegistration from './components/PWARegistration';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes - data is considered fresh for 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes - cache is kept for 10 minutes (formerly cacheTime)
      refetchOnMount: false, // Don't refetch on mount if data is fresh
    },
  },
});

// Component to handle initial route
function AppRoutes() {
  const location = useLocation();
  const { darkMode, toggleDarkMode, isLoading: isGlobalLoading } = useStore();
  const { isLoading } = useAuth();

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

  // Page transition loader
  const { setIsLoading } = useStore();
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, [location.pathname, setIsLoading]);

  return (
    <>
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            key="initial-loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000]"
          >
            <Loader message="جاري تجهيز النظام..." />
          </motion.div>
        )}
        {isGlobalLoading && (
          <motion.div
            key="global-loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999]"
          >
            <Loader />
          </motion.div>
        )}
      </AnimatePresence>

      <Suspense fallback={<Loader />}>
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

          <Route path="/notifications" element={
            <ProtectedRouteWithPermissions requiredResource="apps" requiredAction="read">
              <DashboardLayout>
                <Notifications />
              </DashboardLayout>
            </ProtectedRouteWithPermissions>
          } />

          {/* Fallback: redirect any unknown routes to dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
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
