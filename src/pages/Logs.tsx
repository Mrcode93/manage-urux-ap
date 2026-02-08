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
import {
  Clock,
  User,
  BarChart3,
  Filter,
  RefreshCw,
  Info,
  FileText,
  Monitor,
  Trash2,
  X,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { confirm } from '../components/toastifyConfirm';
import ModernLogsTable from '../components/ModernLogsTable';

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

  if (activitiesLoading) {
    return <Loader message="جاري تحميل سجلات النظام..." />;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300">
            سجلات النظام
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">
            عرض ومراقبة كافة أنشطة الإدارة والعمليات الحيوية للنظام
          </p>
        </div>
        <div className="flex gap-3 w-full lg:w-auto">
          <div className={`px-4 py-2 rounded-2xl border flex items-center gap-2 ${canReadLogs() ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
            <div className={`w-2 h-2 rounded-full animate-pulse ${canReadLogs() ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <span className="text-xs font-black uppercase tracking-widest leading-none">
              {canReadLogs() ? 'اتصال حي' : 'وصول مقيد'}
            </span>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'إجمالي الأنشطة', value: stats.totalActivities, icon: BarChart3, color: 'blue' },
            { label: 'الموجهين النشطين', value: stats.totalAdmins, icon: User, color: 'purple' },
            { label: 'أنواع العمليات', value: Object.keys(stats.actionStats).length, icon: Filter, color: 'emerald' },
            { label: 'آخر تفاعل', value: sortedActivities[0] ? new Date(sortedActivities[0].timestamp).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }) : 'لا يوجد', icon: Clock, color: 'indigo' },
          ].map((stat, i) => (
            <div key={i} className="glass-card p-5 border border-white/20 dark:border-white/10 flex items-center justify-between group hover:-translate-y-1 transition-all duration-300">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                <p className="text-xl font-black text-slate-900 dark:text-white leading-none">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-${stat.color}-500/10 flex items-center justify-center text-${stat.color}-500 border border-${stat.color}-500/20`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      {/* Filters Section */}
      <div className="glass-card p-6 border border-white/20 dark:border-white/10 bg-white/5 backdrop-blur-xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">نوع الإجراء</span>
          <div className="relative group">
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              className="w-full pr-10 pl-4 py-2 bg-white/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm appearance-none"
            >
              <option value="">جميع الإجراءات</option>
              {availableActions.map(action => (
                <option key={action} value={action}>
                  {translateAction(action)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">النطاق الزمني (من)</span>
          <div className="relative group">
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full pr-10 pl-4 py-2 bg-white/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">النطاق الزمني (إلى)</span>
          <div className="relative group">
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full pr-10 pl-4 py-2 bg-white/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>
        </div>

        <div className="flex items-end gap-3">
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
            className="flex-1 h-11 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-700 dark:text-white font-black text-xs border border-white/10"
          >
            <RefreshCw className="h-4 w-4 ml-2" />
            تصفير الفلاتر
          </Button>
          {isSuperAdmin() && (
            <Button
              onClick={handleClearAllActivities}
              disabled={clearAllActivitiesMutation.isPending}
              className="flex-1 h-11 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-500 font-black text-xs border border-red-500/20"
            >
              <Trash2 className="h-4 w-4 ml-2" />
              {clearAllActivitiesMutation.isPending ? 'جاري...' : 'مسح السجلات'}
            </Button>
          )}
        </div>
      </div>

      {/* Activities Table Card */}
      <div className="overflow-hidden">
        <ModernLogsTable
          data={sortedActivities}
          isLoading={activitiesLoading}
          onViewDetails={openActivityModal}
        />

        {/* Activity Details Modal */}
        <AnimatePresence>
          {selectedActivity && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={closeActivityModal}
                className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-4xl bg-[#0a0f18]/90 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden relative"
              >
                <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-900 relative">
                  <div className="absolute top-6 right-8 left-8 flex justify-between items-center text-white">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-black">
                        <Info className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black">تفاصيل العملية</h3>
                        <p className="text-xs text-blue-200 uppercase tracking-widest">{translateAction(selectedActivity.action)}</p>
                      </div>
                    </div>
                    <button onClick={closeActivityModal} className="w-10 h-10 rounded-full bg-white/10 hover:bg-red-500 flex items-center justify-center transition-all">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="px-8 py-8 h-[50vh] overflow-y-auto custom-scrollbar space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="glass-card p-6 border-white/5 bg-white/[0.02]">
                      <div className="flex items-center gap-2 mb-4">
                        <User className="w-4 h-4 text-blue-500" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">معلومات المسؤول</span>
                      </div>
                      <div className="space-y-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-500">الاسم</span>
                          <span className="text-sm font-black text-white">{selectedActivity.adminName}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-500">اسم المستخدم</span>
                          <span className="text-sm font-black text-blue-400">@{selectedActivity.adminUsername}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-500">الرتبة</span>
                          <span className="text-xs font-black text-slate-400">{selectedActivity.adminRole}</span>
                        </div>
                      </div>
                    </div>

                    <div className="glass-card p-6 border-white/5 bg-white/[0.02]">
                      <div className="flex items-center gap-2 mb-4">
                        <Monitor className="w-4 h-4 text-purple-500" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">الجهاز والشبكة</span>
                      </div>
                      <div className="space-y-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-500">عنوان الـ IP</span>
                          <span className="text-sm font-mono font-black text-white">{selectedActivity.ipAddress || '0.0.0.0'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-500">نظام التشغيل</span>
                          <span className="text-sm font-black text-slate-300">{parseUserAgent(selectedActivity.userAgent).os}</span>
                        </div>
                      </div>
                    </div>

                    <div className="glass-card p-6 border-white/5 bg-white/[0.02]">
                      <div className="flex items-center gap-2 mb-4">
                        <Clock className="w-4 h-4 text-emerald-500" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">توقيت الحدث</span>
                      </div>
                      <div className="space-y-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-500">التاريخ</span>
                          <span className="text-sm font-black text-white">{new Date(selectedActivity.timestamp).toLocaleDateString('ar-IQ')}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-500">الوقت</span>
                          <span className="text-sm font-black text-emerald-400" dir="ltr">{new Date(selectedActivity.timestamp).toLocaleTimeString('ar-IQ')}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="glass-card p-6 border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-2 mb-4">
                      <FileText className="w-4 h-4 text-indigo-500" />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">بيانات العملية التفصيلية</span>
                    </div>
                    <div className="p-4 rounded-3xl bg-slate-950/50 border border-white/5 font-mono text-xs text-blue-300 overflow-x-auto">
                      <pre>{JSON.stringify(selectedActivity.metadata || {}, null, 2)}</pre>
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-slate-900/50 border-t border-white/5 flex justify-end backdrop-blur-3xl">
                  <Button onClick={closeActivityModal} className="h-12 px-8 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-black text-xs border-none">
                    إغلاق التفاصيل
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Pagination Card */}
        {activitiesData && activitiesData.pagination.pages > 1 && (
          <div className="mt-8 p-6 glass-card border-white/5 bg-white/5 flex items-center justify-between backdrop-blur-xl">
            <div className="text-sm font-black text-slate-400 tracking-widest uppercase">
              الصفحة {filters.page} من {activitiesData.pagination.pages}
            </div>
            <div className="flex gap-4">
              <Button
                onClick={() => handlePageChange(filters.page - 1)}
                disabled={filters.page <= 1}
                variant="secondary"
                className="px-6 h-11 rounded-2xl bg-white/5 hover:bg-white/10 text-white border-white/10"
              >
                السابق
              </Button>
              <Button
                onClick={() => handlePageChange(filters.page + 1)}
                disabled={filters.page >= activitiesData.pagination.pages}
                variant="secondary"
                className="px-6 h-11 rounded-2xl bg-white/10 hover:bg-white/10 text-white border-white/10"
              >
                التالي
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 