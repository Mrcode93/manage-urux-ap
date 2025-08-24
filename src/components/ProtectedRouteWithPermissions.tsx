import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
// Simple loading spinner component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

interface ProtectedRouteWithPermissionsProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  requiredResource?: string;
  requiredAction?: string;
  requireAll?: boolean;
  fallbackPath?: string;
}

export const ProtectedRouteWithPermissions: React.FC<ProtectedRouteWithPermissionsProps> = ({
  children,
  requiredPermissions = [],
  requiredResource,
  requiredAction,
  requireAll = false,
  fallbackPath = '/'
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check permissions if specified
  if (requiredPermissions.length > 0) {
    const hasAccess = requireAll 
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions);
    
    if (!hasAccess) {
      return <Navigate to={fallbackPath} replace />;
    }
  }

  // Check resource:action permission if specified
  if (requiredResource && requiredAction) {
    if (!hasPermission(requiredResource, requiredAction)) {
      return <Navigate to={fallbackPath} replace />;
    }
  }

  return <>{children}</>;
};

// Convenience components for common route protection
export const UsersRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRouteWithPermissions requiredResource="users" requiredAction="read">
    {children}
  </ProtectedRouteWithPermissions>
);

export const LicensesRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRouteWithPermissions requiredResource="licenses" requiredAction="read">
    {children}
  </ProtectedRouteWithPermissions>
);

export const ActivationCodesRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRouteWithPermissions requiredResource="activation_codes" requiredAction="read">
    {children}
  </ProtectedRouteWithPermissions>
);

export const BackupsRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRouteWithPermissions requiredResource="backups" requiredAction="read">
    {children}
  </ProtectedRouteWithPermissions>
);

export const SettingsRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRouteWithPermissions requiredResource="settings" requiredAction="read">
    {children}
  </ProtectedRouteWithPermissions>
);

export const AnalyticsRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRouteWithPermissions requiredResource="analytics" requiredAction="read">
    {children}
  </ProtectedRouteWithPermissions>
);

export const DashboardRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRouteWithPermissions requiredResource="dashboard" requiredAction="read">
    {children}
  </ProtectedRouteWithPermissions>
);

export const FeaturesRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRouteWithPermissions requiredResource="features" requiredAction="read">
    {children}
  </ProtectedRouteWithPermissions>
);

export const PlansRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRouteWithPermissions requiredResource="plans" requiredAction="read">
    {children}
  </ProtectedRouteWithPermissions>
);

export const UpdatesRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRouteWithPermissions requiredResource="updates" requiredAction="read">
    {children}
  </ProtectedRouteWithPermissions>
);

export const CustomersRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRouteWithPermissions requiredResource="customers" requiredAction="read">
    {children}
  </ProtectedRouteWithPermissions>
);

export const LogsRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRouteWithPermissions requiredResource="logs" requiredAction="read">
    {children}
  </ProtectedRouteWithPermissions>
);

export const LicenseVerificationRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRouteWithPermissions requiredResource="license_verification" requiredAction="read">
    {children}
  </ProtectedRouteWithPermissions>
);

export const CloudBackupsRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRouteWithPermissions requiredResource="cloud_backups" requiredAction="read">
    {children}
  </ProtectedRouteWithPermissions>
);

export const SystemHealthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRouteWithPermissions requiredResource="system_health" requiredAction="read">
    {children}
  </ProtectedRouteWithPermissions>
);

export const ProfileRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRouteWithPermissions requiredResource="profile" requiredAction="read">
    {children}
  </ProtectedRouteWithPermissions>
);
