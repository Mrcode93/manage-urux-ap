import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  getAdminActivities, 
  getAdminActivityStats, 
  getAvailableActions,
  type AdminActivity,
  type ActivityStats 
} from '../api/client';
import { usePermissions } from '../hooks/usePermissions';
import { LogsReadGuard } from '../components/PermissionGuard';
import Table, { type Column } from '../components/Table';
import Button from '../components/Button';
import { toast } from 'react-hot-toast';
import { 
  CalendarIcon,
  ClockIcon,
  UserIcon,
  ChartBarIcon,
  FunnelIcon,
  ArrowPathIcon,
  EyeIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

export default function Logs() {
  const { canReadLogs } = usePermissions();
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    adminId: '',
    action: '',
    startDate: '',
    endDate: ''
  });

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
  const { data: stats, isLoading: statsLoading } = useQuery({
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

  const translateAction = (action: string): string => {
    const actionTranslations: Record<string, string> = {
      'LOGIN_SUCCESS': 'تسجيل دخول ناجح',
      'LOGIN_FAILED': 'فشل تسجيل دخول',
      'LOGOUT': 'تسجيل خروج',
      'PROFILE_UPDATE': 'تحديث الملف الشخصي',
      'USER_CREATED': 'إنشاء مستخدم جديد',
      'USER_UPDATED': 'تحديث مستخدم',
      'USER_DELETED': 'حذف مستخدم',
      'USER_STATUS_CHANGED': 'تغيير حالة مستخدم',
      'BACKUP_CREATED': 'إنشاء نسخة احتياطية',
      'BACKUP_DELETED': 'حذف نسخة احتياطية',
      'BACKUP_RESTORED': 'استعادة نسخة احتياطية',
      'ACTIVATION_CODE_CREATED': 'إنشاء رمز تفعيل',
      'ACTIVATION_CODE_DELETED': 'حذف رمز تفعيل',
      'FEATURE_CREATED': 'إنشاء ميزة جديدة',
      'FEATURE_UPDATED': 'تحديث ميزة',
      'FEATURE_DELETED': 'حذف ميزة',
      'PLAN_CREATED': 'إنشاء خطة جديدة',
      'PLAN_UPDATED': 'تحديث خطة',
      'PLAN_DELETED': 'حذف خطة',
      'UPDATE_CREATED': 'إنشاء تحديث جديد',
      'UPDATE_DELETED': 'حذف تحديث'
    };
    return actionTranslations[action] || action;
  };

  const getActionIcon = (action: string) => {
    if (action.includes('LOGIN')) return <CheckCircleIcon className="h-4 w-4" />;
    if (action.includes('LOGOUT')) return <XCircleIcon className="h-4 w-4" />;
    if (action.includes('CREATE') || action.includes('CREATED')) return <CheckCircleIcon className="h-4 w-4" />;
    if (action.includes('UPDATE') || action.includes('UPDATED')) return <InformationCircleIcon className="h-4 w-4" />;
    if (action.includes('DELETE') || action.includes('DELETED')) return <ExclamationTriangleIcon className="h-4 w-4" />;
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
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {row.original.description || '-'}
        </span>
      )
    },
    {
      header: 'عنوان IP',
      accessorKey: 'ipAddress',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600 dark:text-gray-300 font-mono">
          {row.original.ipAddress || '-'}
        </span>
      )
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
    }
  ];

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
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              canReadLogs() ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
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
                  {activitiesData?.activities[0] ? formatDate(activitiesData.activities[0].timestamp) : 'لا يوجد'}
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
              <span className="text-sm text-gray-500 dark:text-gray-400">
                الصفحة {activitiesData?.pagination.page || 1} من {activitiesData?.pagination.pages || 1}
              </span>
            </div>
          </div>
          
        <Table
          columns={columns}
            data={activitiesData?.activities || []}
            isLoading={activitiesLoading}
            emptyMessage="لا توجد أنشطة"
          />

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