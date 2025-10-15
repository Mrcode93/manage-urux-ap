import React from 'react';
import { usePermissions } from '../hooks/usePermissions';

interface PermissionGuardProps {
  children: React.ReactNode;
  resource: string;
  action: string;
  fallback?: React.ReactNode;
  requireAll?: boolean;
  permissions?: string[];
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  resource,
  action,
  fallback = null,
  requireAll = false,
  permissions = []
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  // If specific permissions array is provided, use that
  if (permissions.length > 0) {
    const hasAccess = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
    
    return hasAccess ? <>{children}</> : <>{fallback}</>;
  }

  // Otherwise use resource:action format
  const hasAccess = hasPermission(resource, action);
  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

// Convenience components for common permission checks
export const UsersReadGuard: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <PermissionGuard resource="users" action="read" fallback={fallback}>
    {children}
  </PermissionGuard>
);

export const UsersWriteGuard: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <PermissionGuard resource="users" action="write" fallback={fallback}>
    {children}
  </PermissionGuard>
);

export const UsersDeleteGuard: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <PermissionGuard resource="users" action="delete" fallback={fallback}>
    {children}
  </PermissionGuard>
);

export const LicensesReadGuard: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <PermissionGuard resource="licenses" action="read" fallback={fallback}>
    {children}
  </PermissionGuard>
);

export const LicensesWriteGuard: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <PermissionGuard resource="licenses" action="write" fallback={fallback}>
    {children}
  </PermissionGuard>
);

export const LicensesDeleteGuard: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <PermissionGuard resource="licenses" action="delete" fallback={fallback}>
    {children}
  </PermissionGuard>
);

export const ActivationCodesReadGuard: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <PermissionGuard resource="activation_codes" action="read" fallback={fallback}>
    {children}
  </PermissionGuard>
);

export const ActivationCodesWriteGuard: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <PermissionGuard resource="activation_codes" action="write" fallback={fallback}>
    {children}
  </PermissionGuard>
);

export const ActivationCodesDeleteGuard: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <PermissionGuard resource="activation_codes" action="delete" fallback={fallback}>
    {children}
  </PermissionGuard>
);

export const BackupsReadGuard: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <PermissionGuard resource="backups" action="read" fallback={fallback}>
    {children}
  </PermissionGuard>
);

export const BackupsWriteGuard: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <PermissionGuard resource="backups" action="write" fallback={fallback}>
    {children}
  </PermissionGuard>
);

export const BackupsDeleteGuard: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <PermissionGuard resource="backups" action="delete" fallback={fallback}>
    {children}
  </PermissionGuard>
);

export const SettingsReadGuard: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <PermissionGuard resource="settings" action="read" fallback={fallback}>
    {children}
  </PermissionGuard>
);

export const SettingsWriteGuard: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <PermissionGuard resource="settings" action="write" fallback={fallback}>
    {children}
  </PermissionGuard>
);

export const AnalyticsReadGuard: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <PermissionGuard resource="analytics" action="read" fallback={fallback}>
    {children}
  </PermissionGuard>
);

export const DashboardReadGuard: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <PermissionGuard resource="dashboard" action="read" fallback={fallback}>
    {children}
  </PermissionGuard>
);

// Features Management Guards
export const FeaturesReadGuard: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <PermissionGuard resource="features" action="read" fallback={fallback}>
    {children}
  </PermissionGuard>
);

export const FeaturesWriteGuard: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <PermissionGuard resource="features" action="write" fallback={fallback}>
    {children}
  </PermissionGuard>
);

export const FeaturesDeleteGuard: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <PermissionGuard resource="features" action="delete" fallback={fallback}>
    {children}
  </PermissionGuard>
);

// Plans Management Guards
export const PlansReadGuard: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <PermissionGuard resource="plans" action="read" fallback={fallback}>
    {children}
  </PermissionGuard>
);

export const PlansWriteGuard: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <PermissionGuard resource="plans" action="write" fallback={fallback}>
    {children}
  </PermissionGuard>
);

export const PlansDeleteGuard: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <PermissionGuard resource="plans" action="delete" fallback={fallback}>
    {children}
  </PermissionGuard>
);

// Updates Management Guards
export const UpdatesReadGuard: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <PermissionGuard resource="updates" action="read" fallback={fallback}>
    {children}
  </PermissionGuard>
);

export const UpdatesWriteGuard: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <PermissionGuard resource="updates" action="write" fallback={fallback}>
    {children}
  </PermissionGuard>
);

export const UpdatesDeleteGuard: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <PermissionGuard resource="updates" action="delete" fallback={fallback}>
    {children}
  </PermissionGuard>
);

// Customers Management Guards
export const CustomersReadGuard: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <PermissionGuard resource="customers" action="read" fallback={fallback}>
    {children}
  </PermissionGuard>
);

export const CustomersWriteGuard: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <PermissionGuard resource="customers" action="write" fallback={fallback}>
    {children}
  </PermissionGuard>
);

export const CustomersDeleteGuard: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <PermissionGuard resource="customers" action="delete" fallback={fallback}>
    {children}
  </PermissionGuard>
);

// System Logs Guards
export const LogsReadGuard: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <PermissionGuard resource="logs" action="read" fallback={fallback}>
    {children}
  </PermissionGuard>
);

// License Verification Guards
export const LicenseVerificationReadGuard: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <PermissionGuard resource="license_verification" action="read" fallback={fallback}>
    {children}
  </PermissionGuard>
);

export const LicenseVerificationWriteGuard: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <PermissionGuard resource="license_verification" action="write" fallback={fallback}>
    {children}
  </PermissionGuard>
);

// Cloud Backups Guards
export const CloudBackupsReadGuard: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <PermissionGuard resource="cloud_backups" action="read" fallback={fallback}>
    {children}
  </PermissionGuard>
);

export const CloudBackupsWriteGuard: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <PermissionGuard resource="cloud_backups" action="write" fallback={fallback}>
    {children}
  </PermissionGuard>
);

export const CloudBackupsDeleteGuard: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <PermissionGuard resource="cloud_backups" action="delete" fallback={fallback}>
    {children}
  </PermissionGuard>
);

// System Health Guards
export const SystemHealthReadGuard: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <PermissionGuard resource="system_health" action="read" fallback={fallback}>
    {children}
  </PermissionGuard>
);

// Profile Management Guards
export const ProfileReadGuard: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <PermissionGuard resource="profile" action="read" fallback={fallback}>
    {children}
  </PermissionGuard>
);

export const ProfileWriteGuard: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <PermissionGuard resource="profile" action="write" fallback={fallback}>
    {children}
  </PermissionGuard>
);

// Apps Management Guards
export const AppsReadGuard: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <PermissionGuard resource="apps" action="read" fallback={fallback}>
    {children}
  </PermissionGuard>
);

export const AppsWriteGuard: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <PermissionGuard resource="apps" action="write" fallback={fallback}>
    {children}
  </PermissionGuard>
);

export const AppsDeleteGuard: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <PermissionGuard resource="apps" action="delete" fallback={fallback}>
    {children}
  </PermissionGuard>
);
