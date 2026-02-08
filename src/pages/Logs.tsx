import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAdminActivities,
  getAdminActivityStats,
  getAvailableActions,
  clearAllActivities,
  type AdminActivity
} from '../api/client';
import { usePermissions } from '../hooks/usePermissions';
import Button from '../components/Button';
import Loader from '../components/Loader';
import Table, { type Column } from '../components/Table';
import {
  ClockIcon,
  UserIcon,
  ChartBarIcon,
  FunnelIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronDownIcon,
  DocumentTextIcon,
  ComputerDesktopIcon,
  GlobeAltIcon,
  TrashIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { confirm } from '../components/toastifyConfirm';

export default function Logs() {
  const { canReadLogs, isSuperAdmin } = usePermissions();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    adminId: '',
    action: '',
    startDate: '',
    endDate: ''
  });
  const [selectedActivity, setSelectedActivity] = useState<AdminActivity | null>(null);

  // Page-level permission check
  if (!canReadLogs()) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                لا توجد صلاحية للوصول
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>ليس لديك صلاحية لقراءة سجلات النظام. مطلوب صلاحية: <strong>logs:read</strong></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fetch activities
  const { data: activitiesData, isLoading: activitiesLoading } = useQuery({
    queryKey: ['admin-activities', filters],
    queryFn: () => getAdminActivities(filters),
    enabled: canReadLogs()
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['activity-stats', filters.startDate, filters.endDate],
    queryFn: () => getAdminActivityStats({
      startDate: filters.startDate,
      endDate: filters.endDate
    }),
    enabled: canReadLogs()
  });

  // Fetch available actions
  const { data: availableActions = [] } = useQuery({
    queryKey: ['available-actions'],
    queryFn: getAvailableActions,
    enabled: canReadLogs()
  });

  // Sort activities by timestamp (newest first) - ensure they're always sorted
  const sortedActivities = useMemo(() => {
    if (!activitiesData?.activities) return [];
    return [...activitiesData.activities].sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return dateB - dateA; // Newest first (descending order)
    });
  }, [activitiesData?.activities]);

  // Clear all activities mutation
  const clearAllActivitiesMutation = useMutation({
    mutationFn: clearAllActivities,
    onSuccess: (data) => {
      toast.success(`تم حذف جميع الأنشطة بنجاح (${data.affectedAdmins} مستخدم)`);
      // Invalidate and refetch activities
      queryClient.invalidateQueries({ queryKey: ['admin-activities'] });
      queryClient.invalidateQueries({ queryKey: ['activity-stats'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'فشل في حذف الأنشطة');
    }
  });

  const handleClearAllActivities = async () => {
    const confirmed = await confirm({
      message: 'هل أنت متأكد من حذف جميع أنشطة جميع المستخدمين؟ لا يمكن التراجع عن هذا الإجراء.',
      confirmText: 'حذف',
      cancelText: 'إلغاء'
    });

    if (confirmed) {
      clearAllActivitiesMutation.mutate();
    }
  };

  const openActivityModal = (activity: AdminActivity) => {
    setSelectedActivity(activity);
  };

  const closeActivityModal = () => {
    setSelectedActivity(null);
  };

  const translateAction = (action: string): string => {
    // Handle generic actions (CREATED, UPDATED, DELETED, VIEWED)
    if (action.endsWith('_CREATED')) {
      const resource = action.replace('_CREATED', '').toLowerCase().replace(/_/g, '-');
      const resourceTranslations: Record<string, string> = {
        'activation-codes': 'رموز التفعيل',
        'activation-code': 'رمز التفعيل',
        'features': 'الميزات',
        'plans': 'الخطط',
        'updates': 'التحديثات',
        'backups': 'النسخ الاحتياطية',
        'expenses': 'المصروفات',
        'apps': 'التطبيقات',
        'users': 'المستخدمين',
        'customers': 'العملاء',
        'licenses': 'التراخيص',
        'sales': 'المبيعات'
      };
      const resourceName = resourceTranslations[resource] || resource.replace(/-/g, ' ');
      return `إضافة ${resourceName}`;
    }

    if (action.endsWith('_UPDATED')) {
      const resource = action.replace('_UPDATED', '').toLowerCase().replace(/_/g, '-');
      const resourceTranslations: Record<string, string> = {
        'activation-codes': 'رموز التفعيل',
        'activation-code': 'رمز التفعيل',
        'features': 'الميزات',
        'plans': 'الخطط',
        'updates': 'التحديثات',
        'backups': 'النسخ الاحتياطية',
        'expenses': 'المصروفات',
        'apps': 'التطبيقات',
        'users': 'المستخدمين',
        'customers': 'العملاء',
        'licenses': 'التراخيص',
        'sales': 'المبيعات'
      };
      const resourceName = resourceTranslations[resource] || resource.replace(/-/g, ' ');
      return `تعديل ${resourceName}`;
    }

    if (action.endsWith('_DELETED')) {
      const resource = action.replace('_DELETED', '').toLowerCase().replace(/_/g, '-');
      const resourceTranslations: Record<string, string> = {
        'activation-codes': 'رموز التفعيل',
        'activation-code': 'رمز التفعيل',
        'features': 'الميزات',
        'plans': 'الخطط',
        'updates': 'التحديثات',
        'backups': 'النسخ الاحتياطية',
        'expenses': 'المصروفات',
        'apps': 'التطبيقات',
        'users': 'المستخدمين',
        'customers': 'العملاء',
        'licenses': 'التراخيص',
        'sales': 'المبيعات'
      };
      const resourceName = resourceTranslations[resource] || resource.replace(/-/g, ' ');
      return `حذف ${resourceName}`;
    }

    if (action.endsWith('_VIEWED')) {
      const resource = action.replace('_VIEWED', '').toLowerCase().replace(/_/g, '-');
      // Special case for activation codes page
      if (resource === 'activation-codes' || resource === 'activation_codes') {
        return 'عرض صفحة رموز التفعيل';
      }
      const resourceTranslations: Record<string, string> = {
        'activation-codes': 'رموز التفعيل',
        'activation-code': 'رمز التفعيل',
        'features': 'الميزات',
        'plans': 'الخطط',
        'updates': 'التحديثات',
        'backups': 'النسخ الاحتياطية',
        'expenses': 'المصروفات',
        'apps': 'التطبيقات',
        'users': 'المستخدمين',
        'customers': 'العملاء',
        'licenses': 'التراخيص',
        'sales': 'المبيعات'
      };
      const resourceName = resourceTranslations[resource] || resource.replace(/-/g, ' ');
      return `عرض ${resourceName}`;
    }

    const actionTranslations: Record<string, string> = {
      // Authentication Actions
      'LOGIN_SUCCESS': 'تسجيل دخول ناجح',
      'LOGIN_FAILED': 'فشل تسجيل دخول',
      'LOGOUT': 'تسجيل خروج',
      'PROFILE_UPDATE': 'تحديث الملف الشخصي',
      'PASSWORD_CHANGE': 'تغيير كلمة المرور',

      // User Management Actions
      'USER_CREATED': 'إنشاء مستخدم جديد',
      'USER_UPDATED': 'تحديث مستخدم',
      'USER_DELETED': 'حذف مستخدم',
      'USER_STATUS_CHANGED': 'تغيير حالة مستخدم',
      'USER_PASSWORD_RESET': 'إعادة تعيين كلمة مرور المستخدم',

      // License Management Actions
      'LICENSE_CREATED': 'إنشاء ترخيص',
      'LICENSE_UPDATED': 'تحديث ترخيص',
      'LICENSE_DELETED': 'حذف ترخيص',
      'LICENSE_REVOKED': 'إلغاء ترخيص',
      'LICENSE_EXTENDED': 'تمديد ترخيص',

      // Activation Code Actions
      'ACTIVATION_CODE_CREATED': 'إنشاء رمز تفعيل',
      'ACTIVATION_CODES_BULK_CREATED': 'إنشاء رموز تفعيل متعددة',
      'ACTIVATION_CODE_DELETED': 'حذف رمز تفعيل',
      'ACTIVATION_CODE_UPDATED': 'تحديث رمز تفعيل',
      'ACTIVATION_CODES_VIEWED': 'عرض صفحة رموز التفعيل',
      'ACTIVATION-CODES_VIEWED': 'عرض صفحة رموز التفعيل',

      // Feature Management Actions
      'FEATURE_CREATED': 'إنشاء ميزة جديدة',
      'FEATURE_UPDATED': 'تحديث ميزة',
      'FEATURE_DELETED': 'حذف ميزة',
      'FEATURE_TOGGLED': 'تفعيل/إلغاء ميزة',

      // Plan Management Actions
      'PLAN_CREATED': 'إنشاء خطة جديدة',
      'PLAN_UPDATED': 'تحديث خطة',
      'PLAN_DELETED': 'حذف خطة',

      // Update Management Actions
      'UPDATE_CREATED': 'إنشاء تحديث جديد',
      'UPDATE_UPDATED': 'تحديث التحديث',
      'UPDATE_DELETED': 'حذف تحديث',
      'UPDATE_PUBLISHED': 'نشر تحديث',

      // Backup Actions
      'BACKUP_CREATED': 'إنشاء نسخة احتياطية',
      'BACKUP_DELETED': 'حذف نسخة احتياطية',
      'BACKUP_RESTORED': 'استعادة نسخة احتياطية',
      'BACKUP_DOWNLOADED': 'تحميل نسخة احتياطية',

      // Cloud Backup Actions
      'CLOUD_BACKUP_CREATED': 'إنشاء نسخة احتياطية سحابية',
      'CLOUD_BACKUP_DELETED': 'حذف نسخة احتياطية سحابية',
      'CLOUD_BACKUP_SYNCED': 'مزامنة نسخة احتياطية سحابية',

      // Settings Actions
      'SETTINGS_UPDATED': 'تحديث إعدادات النظام',
      'SETTINGS_RESET': 'إعادة تعيين الإعدادات',

      // Analytics Actions
      'ANALYTICS_EXPORTED': 'تصدير بيانات التحليلات',
      'ANALYTICS_CLEARED': 'مسح بيانات التحليلات',

      // System Actions
      'SYSTEM_RESTARTED': 'إعادة تشغيل النظام',
      'CACHE_CLEARED': 'مسح ذاكرة التخزين المؤقت',
      'SYSTEM_CLEANUP': 'تنظيف النظام',

      // Customer Management Actions
      'CUSTOMER_CREATED': 'إنشاء عميل جديد',
      'CUSTOMER_UPDATED': 'تحديث عميل',
      'CUSTOMER_DELETED': 'حذف عميل',

      // License Verification Actions
      'LICENSE_VERIFIED': 'التحقق من ترخيص',
      'LICENSES_BULK_VERIFIED': 'التحقق من تراخيص متعددة',

      // Logs Actions
      'LOGS_EXPORTED': 'تصدير سجلات النظام',
      'LOGS_CLEARED': 'مسح سجلات النظام'
    };
    return actionTranslations[action] || action;
  };

  const getActionIcon = (action: string) => {
    if (action.includes('LOGIN')) return <CheckCircleIcon className="h-4 w-4" />;
    if (action.includes('LOGOUT')) return <XCircleIcon className="h-4 w-4" />;
    if (action.includes('CREATE') || action.includes('CREATED')) return <CheckCircleIcon className="h-4 w-4" />;
    if (action.includes('UPDATE') || action.includes('UPDATED')) return <InformationCircleIcon className="h-4 w-4" />;
    if (action.includes('DELETE') || action.includes('DELETED')) return <ExclamationTriangleIcon className="h-4 w-4" />;
    if (action.includes('VIEWED') || action.includes('VIEW')) return <DocumentTextIcon className="h-4 w-4" />;
    return <InformationCircleIcon className="h-4 w-4" />;
  };

  const getActionColor = (action: string) => {
    if (action.includes('LOGIN_SUCCESS') || action.includes('CREATE') || action.includes('CREATED')) {
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
    if (action.includes('LOGIN_FAILED') || action.includes('DELETE') || action.includes('DELETED')) {
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    }
    if (action.includes('UPDATE') || action.includes('UPDATED')) {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
    if (action.includes('VIEWED') || action.includes('VIEW')) {
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    }
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ar-IQ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Parse user agent to get browser and device info
  const parseUserAgent = (userAgent: string | undefined): { browser: string; device: string; os: string; full: string } => {
    if (!userAgent || userAgent === 'Unknown') {
      return { browser: 'غير محدد', device: 'غير محدد', os: 'غير محدد', full: 'غير محدد' };
    }

    const ua = userAgent.toLowerCase();
    let browser = 'غير محدد';
    let device = 'غير محدد';
    let os = 'غير محدد';

    // Detect browser
    if (ua.includes('chrome') && !ua.includes('edg') && !ua.includes('opr')) {
      browser = 'Chrome';
    } else if (ua.includes('firefox')) {
      browser = 'Firefox';
    } else if (ua.includes('safari') && !ua.includes('chrome')) {
      browser = 'Safari';
    } else if (ua.includes('edg')) {
      browser = 'Edge';
    } else if (ua.includes('opr') || ua.includes('opera')) {
      browser = 'Opera';
    } else if (ua.includes('msie') || ua.includes('trident')) {
      browser = 'Internet Explorer';
    }

    // Detect device
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone') || ua.includes('ipad')) {
      if (ua.includes('iphone')) {
        device = 'iPhone';
      } else if (ua.includes('ipad')) {
        device = 'iPad';
      } else if (ua.includes('android')) {
        device = 'Android Device';
      } else {
        device = 'Mobile Device';
      }
    } else if (ua.includes('tablet')) {
      device = 'Tablet';
    } else {
      device = 'Desktop';
    }

    // Detect OS
    if (ua.includes('windows')) {
      if (ua.includes('windows nt 10')) {
        os = 'Windows 10/11';
      } else if (ua.includes('windows nt 6.3')) {
        os = 'Windows 8.1';
      } else if (ua.includes('windows nt 6.2')) {
        os = 'Windows 8';
      } else if (ua.includes('windows nt 6.1')) {
        os = 'Windows 7';
      } else {
        os = 'Windows';
      }
    } else if (ua.includes('mac os x') || ua.includes('macintosh')) {
      os = 'macOS';
    } else if (ua.includes('linux')) {
      os = 'Linux';
    } else if (ua.includes('android')) {
      os = 'Android';
    } else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) {
      os = 'iOS';
    }

    return { browser, device, os, full: userAgent };
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const columns: Column<AdminActivity>[] = [
    {
      header: 'المستخدم',
      accessorKey: 'adminName',
      cell: ({ row }) => (
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <UserIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-white text-sm">
              {row.original.adminName}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              @{row.original.adminUsername}
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500">
              {row.original.adminRole}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'الإجراء',
      accessorKey: 'action',
      cell: ({ row }) => (
        <div className="flex items-center space-x-2 space-x-reverse">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(row.original.action)}`}>
            {getActionIcon(row.original.action)}
            <span className="mr-1">{translateAction(row.original.action)}</span>
          </span>
        </div>
      )
    },
    {
      header: 'الوصف',
      accessorKey: 'description',
      cell: ({ row }) => (
        <div className="max-w-xs">
          <span className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
            {row.original.description || '-'}
          </span>
        </div>
      )
    },
    {
      header: 'عنوان IP / المتصفح',
      accessorKey: 'ipAddress',
      cell: ({ row }) => {
        const uaInfo = parseUserAgent(row.original.userAgent);
        return (
          <div className="space-y-1">
            <div className="flex items-center space-x-2 space-x-reverse">
              <GlobeAltIcon className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-300 font-mono">
                {row.original.ipAddress || '-'}
              </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {uaInfo.browser} • {uaInfo.device}
            </div>
          </div>
        );
      }
    },
    {
      header: 'التاريخ والوقت',
      accessorKey: 'timestamp',
      cell: ({ row }) => (
        <div className="flex items-center space-x-2 space-x-reverse">
          <ClockIcon className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {formatDate(row.original.timestamp)}
          </span>
        </div>
      )
    },
    {
      header: 'التفاصيل',
      accessorKey: 'details',
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <button
            onClick={() => openActivityModal(row.original)}
            className="flex items-center space-x-1 space-x-reverse text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          >
            <ChevronDownIcon className="h-4 w-4" />
            <span className="text-xs">عرض</span>
          </button>
        </div>
      )
    }
  ];

  if (activitiesLoading) {
    return <Loader message="جاري تحميل سجلات النظام..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">سجلات النظام</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            عرض أنشطة المستخدمين الإداريين وسجلات النظام
          </p>
          {/* Permission Indicator */}
          <div className="mt-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${canReadLogs() ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
              قراءة السجلات {canReadLogs() ? '✓' : '✗'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <ChartBarIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="mr-3">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">إجمالي الأنشطة</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.totalActivities}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <UserIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="mr-3">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">المستخدمين النشطين</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.totalAdmins}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <FunnelIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <div className="mr-3">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">أنواع الإجراءات</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{Object.keys(stats.actionStats).length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                  <ClockIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              <div className="mr-3">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">آخر نشاط</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {sortedActivities[0] ? formatDate(sortedActivities[0].timestamp) : 'لا يوجد'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              نوع الإجراء
            </label>
            <select
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">جميع الإجراءات</option>
              {availableActions.map(action => (
                <option key={action} value={action}>
                  {translateAction(action)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              من تاريخ
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              إلى تاريخ
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end">
            <Button
              onClick={() => setFilters({
                page: 1,
                limit: 20,
                adminId: '',
                action: '',
                startDate: '',
                endDate: ''
              })}
              variant="secondary"
              className="w-full flex items-center justify-center"
            >
              <ArrowPathIcon className="h-4 w-4 ml-2" />
              إعادة تعيين
            </Button>
          </div>
        </div>
      </div>

      {/* Activities Table */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              الأنشطة ({activitiesData?.pagination.total || 0})
            </h2>
            <div className="flex items-center space-x-2 space-x-reverse">
              {isSuperAdmin() && (
                <Button
                  onClick={handleClearAllActivities}
                  disabled={clearAllActivitiesMutation.isPending}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <TrashIcon className="h-4 w-4 ml-2" />
                  {clearAllActivitiesMutation.isPending ? 'جاري الحذف...' : 'حذف جميع الأنشطة'}
                </Button>
              )}
              <span className="text-sm text-gray-500 dark:text-gray-400">
                الصفحة {activitiesData?.pagination.page || 1} من {activitiesData?.pagination.pages || 1}
              </span>
            </div>
          </div>

          <Table
            columns={columns}
            data={sortedActivities}
            isLoading={activitiesLoading}
            emptyMessage="لا توجد أنشطة"
          />

          {/* Activity Details Modal */}
          {selectedActivity && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div
                  className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                  onClick={closeActivityModal}
                ></div>

                {/* Modal panel */}
                <div className="inline-block align-bottom bg-white dark:bg-gray-900 rounded-lg text-right overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                          <InformationCircleIcon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            تفاصيل النشاط
                          </h3>
                          <p className="text-blue-100 text-sm">
                            {translateAction(selectedActivity.action)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={closeActivityModal}
                        className="text-white hover:text-blue-100 transition-colors duration-200"
                      >
                        <XMarkIcon className="h-6 w-6" />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="px-6 py-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    {/* Show created/updated/deleted item prominently */}
                    {(() => {
                      const responseData = selectedActivity.metadata?.responseData;
                      const isActivationCode = selectedActivity.action.includes('ACTIVATION_CODE') ||
                        selectedActivity.action.includes('GENERATE-CODE') ||
                        selectedActivity.action.includes('GENERATE_CODE');
                      const isDelete = selectedActivity.action.includes('_DELETED');
                      const isCreate = selectedActivity.action.includes('_CREATED');
                      const isUpdate = selectedActivity.action.includes('_UPDATED');

                      // Extract code from response data - check multiple possible locations
                      const code = responseData?.code ||
                        responseData?.data?.code ||
                        (Array.isArray(responseData?.data) && responseData.data[0]?.code) ||
                        (responseData?.codes && Array.isArray(responseData.codes) && responseData.codes[0]);
                      const codes = responseData?.codes ||
                        responseData?.data?.codes ||
                        (Array.isArray(responseData?.data) ? responseData.data.map((item: any) => item.code).filter(Boolean) : null);
                      const quantity = responseData?.quantity ||
                        responseData?.data?.quantity ||
                        (Array.isArray(responseData?.data) ? responseData.data.length : null);

                      // Also check if code is in the description
                      const descriptionCode = selectedActivity.description?.match(/الرمز:\s*([A-Z0-9-]+)/)?.[1];
                      const finalCode = code || descriptionCode;

                      if (finalCode || codes || (isActivationCode && selectedActivity.metadata?.requestBody)) {
                        // Determine title and color based on action type
                        let title = 'رمز التفعيل';
                        let bgColor = 'bg-blue-50 dark:bg-blue-900/20';
                        let borderColor = 'border-blue-200 dark:border-blue-800';
                        let textColor = 'text-blue-900 dark:text-blue-200';
                        let iconColor = 'text-blue-600 dark:text-blue-400';

                        if (isDelete) {
                          title = 'رمز التفعيل المحذوف';
                          bgColor = 'bg-red-50 dark:bg-red-900/20';
                          borderColor = 'border-red-200 dark:border-red-800';
                          textColor = 'text-red-900 dark:text-red-200';
                          iconColor = 'text-red-600 dark:text-red-400';
                        } else if (isUpdate) {
                          title = 'رمز التفعيل المحدث';
                          bgColor = 'bg-yellow-50 dark:bg-yellow-900/20';
                          borderColor = 'border-yellow-200 dark:border-yellow-800';
                          textColor = 'text-yellow-900 dark:text-yellow-200';
                          iconColor = 'text-yellow-600 dark:text-yellow-400';
                        } else if (isCreate) {
                          title = 'رمز التفعيل المُنشأ';
                        }

                        return (
                          <div className={`${bgColor} border ${borderColor} rounded-lg p-4 mb-4`}>
                            <h4 className={`text-sm font-semibold ${textColor} mb-3 flex items-center gap-2`}>
                              <CheckCircleIcon className={`h-5 w-5 ${iconColor}`} />
                              {title}
                            </h4>
                            {finalCode && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between gap-3">
                                  <span className={`text-sm font-medium ${isDelete ? 'text-red-800 dark:text-red-300' : isUpdate ? 'text-yellow-800 dark:text-yellow-300' : 'text-blue-800 dark:text-blue-300'}`}>
                                    {isDelete ? 'الرمز المحذوف:' : isUpdate ? 'الرمز المحدث:' : 'الرمز:'}
                                  </span>
                                  <span className={`text-lg font-mono font-bold ${isDelete ? 'text-red-900 dark:text-red-100 border-red-400 dark:border-red-600' : isUpdate ? 'text-yellow-900 dark:text-yellow-100 border-yellow-400 dark:border-yellow-600' : 'text-blue-900 dark:text-blue-100 border-blue-400 dark:border-blue-600'} bg-white dark:bg-gray-800 px-3 py-2 rounded border-2 text-left break-all`}>
                                    {finalCode}
                                  </span>
                                </div>
                                {(responseData?.type || responseData?.data?.type) && (
                                  <div className="flex items-center justify-between text-sm gap-3">
                                    <span className={isDelete ? 'text-red-700 dark:text-red-300' : isUpdate ? 'text-yellow-700 dark:text-yellow-300' : 'text-blue-700 dark:text-blue-300'}>النوع:</span>
                                    <span className={`${isDelete ? 'text-red-900 dark:text-red-100' : isUpdate ? 'text-yellow-900 dark:text-yellow-100' : 'text-blue-900 dark:text-blue-100'} font-medium text-left`}>
                                      {(responseData?.type || responseData?.data?.type)}
                                    </span>
                                  </div>
                                )}
                                {(responseData?.expires_at || responseData?.data?.expires_at) && (
                                  <div className="flex items-center justify-between text-sm gap-3">
                                    <span className={isDelete ? 'text-red-700 dark:text-red-300' : isUpdate ? 'text-yellow-700 dark:text-yellow-300' : 'text-blue-700 dark:text-blue-300'}>تاريخ الانتهاء:</span>
                                    <span className={`${isDelete ? 'text-red-900 dark:text-red-100' : isUpdate ? 'text-yellow-900 dark:text-yellow-100' : 'text-blue-900 dark:text-blue-100'} text-left`}>
                                      {new Date(responseData?.expires_at || responseData?.data?.expires_at).toLocaleDateString('ar-IQ')}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                            {codes && Array.isArray(codes) && codes.length > 0 && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-blue-800 dark:text-blue-300">الكمية:</span>
                                  <span className="text-lg font-bold text-blue-900 dark:text-blue-100">{quantity || codes.length}</span>
                                </div>
                                <div className="mt-2">
                                  <div className="text-xs text-blue-700 dark:text-blue-300 mb-2">الرموز المُنشأة:</div>
                                  <div className="max-h-32 overflow-y-auto space-y-1">
                                    {codes.slice(0, 10).map((c: string, idx: number) => (
                                      <div key={idx} className="text-xs font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded border border-blue-200 dark:border-blue-700 text-blue-900 dark:text-blue-100">
                                        {c}
                                      </div>
                                    ))}
                                    {codes.length > 10 && (
                                      <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                        ... و {codes.length - 10} رمز آخر
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                            {quantity && !codes && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-blue-800 dark:text-blue-300">الكمية:</span>
                                <span className="text-lg font-bold text-blue-900 dark:text-blue-100">{quantity}</span>
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    })()}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Basic Information */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                          <InformationCircleIcon className="h-4 w-4" />
                          معلومات أساسية
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">نوع الإجراء:</span>
                            <span className="text-gray-900 dark:text-white font-mono">{selectedActivity.action}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">الوصف:</span>
                            <span className="text-gray-900 dark:text-white">{selectedActivity.description || 'غير محدد'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">التاريخ:</span>
                            <span className="text-gray-900 dark:text-white">{formatDate(selectedActivity.timestamp)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Network Information */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                          <GlobeAltIcon className="h-4 w-4" />
                          معلومات الشبكة والجهاز
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500 dark:text-gray-400">عنوان IP:</span>
                            <span className="text-gray-900 dark:text-white font-mono text-left">{selectedActivity.ipAddress || 'غير محدد'}</span>
                          </div>
                          {(() => {
                            const uaInfo = parseUserAgent(selectedActivity.userAgent);
                            return (
                              <>
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-500 dark:text-gray-400">المتصفح:</span>
                                  <span className="text-gray-900 dark:text-white text-left">{uaInfo.browser}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-500 dark:text-gray-400">نوع الجهاز:</span>
                                  <span className="text-gray-900 dark:text-white text-left">{uaInfo.device}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-500 dark:text-gray-400">نظام التشغيل:</span>
                                  <span className="text-gray-900 dark:text-white text-left">{uaInfo.os}</span>
                                </div>
                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">User-Agent الكامل:</div>
                                  <div className="text-xs font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded break-all text-gray-700 dark:text-gray-300" title={uaInfo.full}>
                                    {uaInfo.full}
                                  </div>
                                </div>
                              </>
                            );
                          })()}
                          {selectedActivity.metadata?.referer && (
                            <div className="flex justify-between items-center">
                              <span className="text-gray-500 dark:text-gray-400">المصدر:</span>
                              <span className="text-gray-900 dark:text-white text-xs text-left break-all max-w-[60%]" title={selectedActivity.metadata.referer}>
                                {selectedActivity.metadata.referer}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Request Information */}
                      {selectedActivity.metadata && (
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                            <DocumentTextIcon className="h-4 w-4" />
                            معلومات الطلب
                          </h4>
                          <div className="space-y-2 text-sm">
                            {selectedActivity.metadata.method && (
                              <div className="flex justify-between items-center">
                                <span className="text-gray-500 dark:text-gray-400">الطريقة:</span>
                                <span className="text-gray-900 dark:text-white font-mono text-left">{selectedActivity.metadata.method}</span>
                              </div>
                            )}
                            {selectedActivity.metadata.path && (
                              <div className="flex justify-between items-center">
                                <span className="text-gray-500 dark:text-gray-400">المسار:</span>
                                <span className="text-gray-900 dark:text-white font-mono text-xs text-left break-all max-w-[60%]" title={selectedActivity.metadata.path}>
                                  {selectedActivity.metadata.path}
                                </span>
                              </div>
                            )}
                            {selectedActivity.metadata.statusCode && (
                              <div className="flex justify-between items-center">
                                <span className="text-gray-500 dark:text-gray-400">رمز الاستجابة:</span>
                                <span className={`font-mono text-left ${selectedActivity.metadata.statusCode >= 200 && selectedActivity.metadata.statusCode < 300
                                    ? 'text-green-600 dark:text-green-400'
                                    : selectedActivity.metadata.statusCode >= 400
                                      ? 'text-red-600 dark:text-red-400'
                                      : 'text-gray-900 dark:text-white'
                                  }`}>
                                  {selectedActivity.metadata.statusCode}
                                </span>
                              </div>
                            )}
                            {selectedActivity.metadata.responseTime && (
                              <div className="flex justify-between items-center">
                                <span className="text-gray-500 dark:text-gray-400">وقت الاستجابة:</span>
                                <span className="text-gray-900 dark:text-white font-mono text-left">{selectedActivity.metadata.responseTime}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Response Data */}
                    {selectedActivity.metadata?.responseData && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                          <CheckCircleIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                          بيانات الاستجابة
                        </h4>
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                          <pre className="text-xs bg-white dark:bg-gray-900 p-3 rounded overflow-x-auto border border-gray-200 dark:border-gray-700">
                            {JSON.stringify(selectedActivity.metadata.responseData, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}

                    {/* Request Body and Parameters */}
                    {selectedActivity.metadata && (selectedActivity.metadata.requestBody || selectedActivity.metadata.queryParams || selectedActivity.metadata.pathParams) && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                          <ComputerDesktopIcon className="h-4 w-4" />
                          تفاصيل إضافية
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {selectedActivity.metadata.requestBody && (
                            <div>
                              <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">بيانات الطلب:</h5>
                              <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                                {JSON.stringify(selectedActivity.metadata.requestBody, null, 2)}
                              </pre>
                            </div>
                          )}
                          {selectedActivity.metadata.queryParams && (
                            <div>
                              <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">معاملات الاستعلام:</h5>
                              <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                                {JSON.stringify(selectedActivity.metadata.queryParams, null, 2)}
                              </pre>
                            </div>
                          )}
                          {selectedActivity.metadata.pathParams && (
                            <div>
                              <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">معاملات المسار:</h5>
                              <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                                {JSON.stringify(selectedActivity.metadata.pathParams, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 flex justify-end">
                    <Button
                      onClick={closeActivityModal}
                      variant="secondary"
                      size="sm"
                    >
                      إغلاق
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pagination */}
          {activitiesData && activitiesData.pagination.pages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Button
                  onClick={() => handlePageChange(filters.page - 1)}
                  disabled={filters.page <= 1}
                  variant="secondary"
                  size="sm"
                >
                  السابق
                </Button>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  الصفحة {filters.page} من {activitiesData.pagination.pages}
                </span>
                <Button
                  onClick={() => handlePageChange(filters.page + 1)}
                  disabled={filters.page >= activitiesData.pagination.pages}
                  variant="secondary"
                  size="sm"
                >
                  التالي
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 