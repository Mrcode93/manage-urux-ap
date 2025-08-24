import { useAuth } from '../contexts/AuthContext';

export interface Permission {
  resource: string;
  action: string;
}

export const usePermissions = () => {
  const { admin } = useAuth();

  const hasPermission = (resource: string, action: string): boolean => {
    if (!admin || !admin.permissions) return false;
    
    const requiredPermission = `${resource}:${action}`;
    return admin.permissions.includes(requiredPermission);
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!admin || !admin.permissions) return false;
    return permissions.some(permission => admin.permissions.includes(permission));
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!admin || !admin.permissions) return false;
    return permissions.every(permission => admin.permissions.includes(permission));
  };

  const canReadUsers = (): boolean => hasPermission('users', 'read');
  const canWriteUsers = (): boolean => hasPermission('users', 'write');
  const canDeleteUsers = (): boolean => hasPermission('users', 'delete');

  const canReadLicenses = (): boolean => hasPermission('licenses', 'read');
  const canWriteLicenses = (): boolean => hasPermission('licenses', 'write');
  const canDeleteLicenses = (): boolean => hasPermission('licenses', 'delete');

  const canReadActivationCodes = (): boolean => hasPermission('activation_codes', 'read');
  const canWriteActivationCodes = (): boolean => hasPermission('activation_codes', 'write');
  const canDeleteActivationCodes = (): boolean => hasPermission('activation_codes', 'delete');

  const canReadBackups = (): boolean => hasPermission('backups', 'read');
  const canWriteBackups = (): boolean => hasPermission('backups', 'write');
  const canDeleteBackups = (): boolean => hasPermission('backups', 'delete');

  const canReadSettings = (): boolean => hasPermission('settings', 'read');
  const canWriteSettings = (): boolean => hasPermission('settings', 'write');

  const canReadAnalytics = (): boolean => hasPermission('analytics', 'read');
  const canReadDashboard = (): boolean => hasPermission('dashboard', 'read');

  // Features Management
  const canReadFeatures = (): boolean => hasPermission('features', 'read');
  const canWriteFeatures = (): boolean => hasPermission('features', 'write');
  const canDeleteFeatures = (): boolean => hasPermission('features', 'delete');

  // Plans Management
  const canReadPlans = (): boolean => hasPermission('plans', 'read');
  const canWritePlans = (): boolean => hasPermission('plans', 'write');
  const canDeletePlans = (): boolean => hasPermission('plans', 'delete');

  // Updates Management
  const canReadUpdates = (): boolean => hasPermission('updates', 'read');
  const canWriteUpdates = (): boolean => hasPermission('updates', 'write');
  const canDeleteUpdates = (): boolean => hasPermission('updates', 'delete');

  // Customers Management
  const canReadCustomers = (): boolean => hasPermission('customers', 'read');
  const canWriteCustomers = (): boolean => hasPermission('customers', 'write');
  const canDeleteCustomers = (): boolean => hasPermission('customers', 'delete');

  // System Logs
  const canReadLogs = (): boolean => hasPermission('logs', 'read');

  // License Verification
  const canReadLicenseVerification = (): boolean => hasPermission('license_verification', 'read');
  const canWriteLicenseVerification = (): boolean => hasPermission('license_verification', 'write');

  // Cloud Backups
  const canReadCloudBackups = (): boolean => hasPermission('cloud_backups', 'read');
  const canWriteCloudBackups = (): boolean => hasPermission('cloud_backups', 'write');
  const canDeleteCloudBackups = (): boolean => hasPermission('cloud_backups', 'delete');

  // System Health
  const canReadSystemHealth = (): boolean => hasPermission('system_health', 'read');

  // Profile Management
  const canReadProfile = (): boolean => hasPermission('profile', 'read');
  const canWriteProfile = (): boolean => hasPermission('profile', 'write');

  const isSuperAdmin = (): boolean => admin?.role === 'super_admin';
  const isAdmin = (): boolean => admin?.role === 'admin' || admin?.role === 'super_admin';
  const isManager = (): boolean => admin?.role === 'manager' || admin?.role === 'admin' || admin?.role === 'super_admin';

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canReadUsers,
    canWriteUsers,
    canDeleteUsers,
    canReadLicenses,
    canWriteLicenses,
    canDeleteLicenses,
    canReadActivationCodes,
    canWriteActivationCodes,
    canDeleteActivationCodes,
    canReadBackups,
    canWriteBackups,
    canDeleteBackups,
    canReadSettings,
    canWriteSettings,
    canReadAnalytics,
    canReadDashboard,
    canReadFeatures,
    canWriteFeatures,
    canDeleteFeatures,
    canReadPlans,
    canWritePlans,
    canDeletePlans,
    canReadUpdates,
    canWriteUpdates,
    canDeleteUpdates,
    canReadCustomers,
    canWriteCustomers,
    canDeleteCustomers,
    canReadLogs,
    canReadLicenseVerification,
    canWriteLicenseVerification,
    canReadCloudBackups,
    canWriteCloudBackups,
    canDeleteCloudBackups,
    canReadSystemHealth,
    canReadProfile,
    canWriteProfile,
    isSuperAdmin,
    isAdmin,
    isManager,
    userRole: admin?.role,
    userPermissions: admin?.permissions || []
  };
};
