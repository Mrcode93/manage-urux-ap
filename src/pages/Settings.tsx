import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSystemHealth, getLicenseStats, getActivatedDevices, getSettings, updateSettings } from '../api/client';
import Button from '../components/Button';
import { useStore } from '../store/useStore';
import { toast } from 'react-hot-toast';
import { 
  Settings as SettingsIcon,
  Server,
  Shield,
  Key,
  Database,
  RefreshCw,
  Users,
  Monitor,
  Globe,
  Lock,
  Bell,
  Wrench
} from 'lucide-react';

export default function Settings() {
  const { darkMode, toggleDarkMode } = useStore();
  
  const handleToggleDarkMode = () => {
    toggleDarkMode();
    toast.success(
      darkMode ? 'تم إيقاف الوضع الداكن' : 'تم تفعيل الوضع الداكن',
      {
        icon: darkMode ? '☀️' : '🌙',
        duration: 2000,
      }
    );
  };


  const [isUpdating, setIsUpdating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSystemLogs, setShowSystemLogs] = useState(false);
  const [selectedTab, setSelectedTab] = useState('general');
  const [tabLoadingStates, setTabLoadingStates] = useState<Record<string, boolean>>({});
  const [adminEmail, setAdminEmail] = useState('admin@example.com');
  const [apiUrl, setApiUrl] = useState(import.meta.env.VITE_API_URL || 'http://localhost:3002');
  const [notifications, setNotifications] = useState({
    email: true,
    browser: true,
    errors: true,
    warnings: false
  });
  const [security, setSecurity] = useState({
    twoFactorAuth: false,
    secureLogin: true
  });

  const queryClient = useQueryClient();

  // Queries
  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ['health'],
    queryFn: getSystemHealth,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: licenseStats, isLoading: licenseLoading } = useQuery({
    queryKey: ['license-stats'],
    queryFn: getLicenseStats,
    refetchInterval: 60000, // Refetch every minute
  });

  const { data: devices, isLoading: devicesLoading } = useQuery({
    queryKey: ['devices'],
    queryFn: getActivatedDevices,
    refetchInterval: 120000, // Refetch every 2 minutes
  });

  // Load settings from backend
  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  });

  // Update local state when settings are loaded
  useEffect(() => {
    if (settingsData) {
      setAdminEmail(settingsData.adminEmail || 'admin@example.com');
      setApiUrl(settingsData.apiUrl || import.meta.env.VITE_API_URL || 'http://localhost:3002');
      setNotifications(settingsData.notifications || {
        email: true,
        browser: true,
        errors: true,
        warnings: false
      });
      setSecurity(settingsData.security || {
        twoFactorAuth: false,
        secureLogin: true
      });
      setShowAdvanced(settingsData.advanced?.developerMode || false);
      setShowSystemLogs(settingsData.advanced?.showSystemLogs || false);
    }
  }, [settingsData]);

  // Mutations
  const updateSettingsMutation = useMutation({
    mutationFn: async (settingsData: any) => {
      return await updateSettings(settingsData);
    },
    onSuccess: () => {
      toast.success('تم تحديث الإعدادات بنجاح');
      setIsUpdating(false);
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (error: any) => {
      toast.error(error?.message || 'فشل في تحديث الإعدادات');
      setIsUpdating(false);
    }
  });

  const clearCacheMutation = useMutation({
    mutationFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      queryClient.clear();
    },
    onSuccess: () => {
      toast.success('تم مسح الذاكرة المؤقتة بنجاح');
    },
    onError: () => {
      toast.error('فشل في مسح الذاكرة المؤقتة');
    }
  });

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    updateSettingsMutation.mutate({
      adminEmail,
      apiUrl,
      notifications,
      security,
      advanced: {
        developerMode: showAdvanced,
        showSystemLogs: showSystemLogs
      }
    });
  };

  // Handle tab change with loading state
  const handleTabChange = (tabId: string) => {
    setSelectedTab(tabId);
    // Set loading state for the new tab
    setTabLoadingStates(prev => ({ ...prev, [tabId]: true }));
    
    // Simulate loading time for tab content
    setTimeout(() => {
      setTabLoadingStates(prev => ({ ...prev, [tabId]: false }));
    }, 300);
  };

  const handleClearCache = () => {
    if (confirm('هل أنت متأكد من مسح الذاكرة المؤقتة؟')) {
      clearCacheMutation.mutate();
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 بايت';
    const k = 1024;
    const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days} يوم, ${hours} ساعة, ${minutes} دقيقة`;
  };

  const tabs = [
    { id: 'general', name: 'عام', icon: SettingsIcon },
    { id: 'system', name: 'النظام', icon: Server },
    { id: 'security', name: 'الأمان', icon: Shield },
    { id: 'notifications', name: 'الإشعارات', icon: Bell },
    { id: 'advanced', name: 'متقدم', icon: Wrench },
  ];

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'general':
        return (
          <div className="space-y-6">
            {/* Appearance Settings */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                إعدادات المظهر
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                      darkMode 
                        ? 'bg-gray-800 text-yellow-400' 
                        : 'bg-yellow-100 text-yellow-600'
                    }`}>
                      {darkMode ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-900 dark:text-white">
                        الوضع الداكن
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {darkMode ? 'مفعل - الوضع الداكن نشط' : 'معطل - الوضع الفاتح نشط'}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        اختصار لوحة المفاتيح: Ctrl+D
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleToggleDarkMode}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                      darkMode 
                        ? 'bg-primary-600 shadow-lg shadow-primary-600/30' 
                        : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                    dir='ltr'
                    title={darkMode ? 'إيقاف الوضع الداكن' : 'تفعيل الوضع الداكن'}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-all duration-300 ease-in-out ${
                        darkMode ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* API Configuration */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Globe className="h-5 w-5" />
                إعدادات API
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    عنوان API
                  </label>
                  <input
                    type="text"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                    placeholder="http://localhost:3002"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    البريد الإلكتروني للمسؤول
                  </label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                    placeholder="admin@example.com"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'system':
        return (
          <div className="space-y-6">
            {/* System Health */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Server className="h-5 w-5" />
                حالة النظام
              </h3>
              {healthLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-3 w-3 rounded-full ${
                          health?.status === 'OK' ? 'bg-green-400' : 'bg-red-400'
                        }`}
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {health?.status === 'OK' ? 'متصل' : 'غير متصل'}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {health?.timestamp && new Date(health.timestamp).toLocaleString('ar-SA')}
                    </span>
                  </div>
                  {health?.version && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      الإصدار: {health.version}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* System Statistics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  إحصائيات التراخيص
                </h3>
                {licenseLoading ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">إجمالي التراخيص:</span>
                      <span className="font-medium">{licenseStats?.total || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">التراخيص النشطة:</span>
                      <span className="font-medium text-green-600">{licenseStats?.active || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">المنتهية:</span>
                      <span className="font-medium text-red-600">{licenseStats?.expired || 0}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  الأجهزة المتصلة
                </h3>
                {devicesLoading ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">إجمالي الأجهزة:</span>
                      <span className="font-medium">{devices?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">الأجهزة النشطة:</span>
                      <span className="font-medium text-green-600">
                        {devices?.filter(d => d.license?.is_active).length || 0}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* System Actions */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                إجراءات النظام
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button
                  onClick={handleClearCache}
                  variant="secondary"
                  className="flex items-center gap-2"
                  disabled={clearCacheMutation.isPending}
                >
                  <Database className="h-4 w-4" />
                  {clearCacheMutation.isPending ? 'جاري المسح...' : 'مسح الذاكرة المؤقتة'}
                </Button>
                <Button
                  onClick={() => queryClient.invalidateQueries()}
                  variant="secondary"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  تحديث البيانات
                </Button>
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            {/* Security Settings */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                إعدادات الأمان
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      تفعيل المصادقة الثنائية
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      إضافة طبقة أمان إضافية
                    </p>
                  </div>
                  <button
                    onClick={() => setSecurity(prev => ({ ...prev, twoFactorAuth: !prev.twoFactorAuth }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      security.twoFactorAuth ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                    dir='ltr'
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        security.twoFactorAuth ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      تسجيل الدخول الآمن
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      تشفير جلسات المستخدمين
                    </p>
                  </div>
                  <button
                    onClick={() => setSecurity(prev => ({ ...prev, secureLogin: !prev.secureLogin }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      security.secureLogin ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                    dir='ltr'
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        security.secureLogin ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Access Logs */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Lock className="h-5 w-5" />
                سجل الوصول
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">آخر تسجيل دخول:</span>
                  <span className="font-medium">منذ 5 دقائق</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">عنوان IP:</span>
                  <span className="font-mono text-xs">192.168.1.100</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">المتصفح:</span>
                  <span className="font-medium">Chrome 120.0</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            {/* Notification Settings */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Bell className="h-5 w-5" />
                إعدادات الإشعارات
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      إشعارات البريد الإلكتروني
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      استلام إشعارات عبر البريد الإلكتروني
                    </p>
                  </div>
                  <button
                    onClick={() => setNotifications(prev => ({ ...prev, email: !prev.email }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notifications.email ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                    dir='ltr'
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notifications.email ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      إشعارات المتصفح
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      إشعارات فورية في المتصفح
                    </p>
                  </div>
                  <button
                    onClick={() => setNotifications(prev => ({ ...prev, browser: !prev.browser }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notifications.browser ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                     dir='ltr'
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notifications.browser ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      إشعارات الأخطاء
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      إشعارات عند حدوث أخطاء في النظام
                    </p>
                  </div>
                  <button
                    onClick={() => setNotifications(prev => ({ ...prev, errors: !prev.errors }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notifications.errors ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                     dir='ltr'
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notifications.errors ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'advanced':
        return (
          <div className="space-y-6">
            {/* Advanced Settings */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                الإعدادات المتقدمة
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      وضع المطور
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      تفعيل أدوات المطور والإعدادات المتقدمة
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      showAdvanced ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                     dir='ltr'
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        showAdvanced ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                {showAdvanced && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">عرض سجلات النظام:</span>
                      <button
                        onClick={() => setShowSystemLogs(!showSystemLogs)}
                        className="text-primary-600 hover:text-primary-700 text-sm"
                      >
                        {showSystemLogs ? 'إخفاء' : 'عرض'}
                      </button>
                    </div>
                    {showSystemLogs && (
                      <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono max-h-32 overflow-y-auto">
                        <div>[2024-01-15 10:30:15] INFO: System started successfully</div>
                        <div>[2024-01-15 10:30:16] INFO: Database connection established</div>
                        <div>[2024-01-15 10:30:17] INFO: API server listening on port 3002</div>
                        <div>[2024-01-15 10:35:22] INFO: User login: admin@example.com</div>
                        <div>[2024-01-15 10:40:15] WARN: High memory usage detected</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">الإعدادات</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            إدارة إعدادات المسؤول وعرض حالة النظام.
          </p>
        </div>
        <div className="flex justify-center lg:justify-end">
          <Button
            onClick={handleUpdateSettings}
            isLoading={isUpdating}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <SettingsIcon className="h-4 w-4" />
            حفظ الإعدادات
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex flex-wrap gap-4 lg:gap-8 overflow-x-auto">
          {tabs.map((tab) => {
            const isLoading = tabLoadingStates[tab.id] || false;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                disabled={isLoading}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  selectedTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                } ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
              >
                {isLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-primary-600"></div>
                ) : (
                  <tab.icon className="h-4 w-4" />
                )}
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {/* Show loading skeleton for current tab or settings loading */}
        {(tabLoadingStates[selectedTab] || settingsLoading) && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
        )}

        {/* Actual tab content */}
        {!tabLoadingStates[selectedTab] && !settingsLoading && renderTabContent()}
      </div>
    </div>
  );
}