import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { getSystemHealth, getLicenseStats, getActivatedDevices, getSettings, updateSettings } from '../api/client';
import Button from '../components/Button';
import Skeleton from '../components/Skeleton';
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
  Wrench,
  Palette,
  Layout,
  Cpu,
  History,
  Activity
} from 'lucide-react';

export default function Settings() {
  const { darkMode, toggleDarkMode, fontFamily, setFontFamily } = useStore();

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
  const [selectedTab, setSelectedTab] = useState('general');
  const [tabLoadingStates, setTabLoadingStates] = useState<Record<string, boolean>>({});

  const queryClient = useQueryClient();

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  } as const;

  const tabVariants: Variants = {
    hidden: { opacity: 0, x: -10 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3 }
    },
    exit: {
      opacity: 0,
      x: 10,
      transition: { duration: 0.2 }
    }
  } as const;

  // Queries
  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: getSystemHealth,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: licenseStats } = useQuery({
    queryKey: ['license-stats'],
    queryFn: getLicenseStats,
    refetchInterval: 60000, // Refetch every minute
  });

  const { data: devices } = useQuery({
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

  if (settingsLoading) {
    return (
      <div className="space-y-8 p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="space-y-2">
            <Skeleton width={250} height={32} />
            <Skeleton width={300} height={20} />
          </div>
          <Skeleton width={150} height={45} variant="rectangular" className="rounded-xl" />
        </div>
        <div className="flex gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} width={100} height={30} />
          ))}
        </div>
        <div className="space-y-4">
          <Skeleton height={400} variant="rectangular" className="rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300">
            إعدادات النظام
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">
            إدارة إعدادات المسؤول، المظهر، وحالة النظام بشكل كامل
          </p>
        </div>
        <Button
          onClick={handleUpdateSettings}
          isLoading={isUpdating}
          className="px-8 py-3 rounded-2xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-blue-500/20 w-full sm:w-auto"
        >
          <SettingsIcon className="h-5 w-5" />
          حفظ جميع الإعدادات
        </Button>
      </header>

      {/* Tabs */}
      <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl p-1.5 border border-slate-200 dark:border-slate-800 inline-flex flex-wrap gap-1 max-w-full overflow-x-auto custom-scrollbar">
        {tabs.map((tab) => {
          const isActive = selectedTab === tab.id;
          const isLoading = tabLoadingStates[tab.id] || false;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              disabled={isLoading}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2.5 transition-all duration-300 relative ${isActive
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-1 ring-blue-500/20'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                } ${isLoading ? 'opacity-70 cursor-wait' : ''}`}
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <tab.icon className={`h-4.5 w-4.5 ${isActive ? 'text-blue-100' : 'text-slate-400'}`} />
              )}
              {tab.name}
              {isActive && (
                <motion.div
                  layoutId="tab-active"
                  className="absolute inset-0 bg-blue-600 rounded-xl -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="relative min-h-[400px]">
        <AnimatePresence mode="wait">
          {!tabLoadingStates[selectedTab] && (
            <motion.div
              key={selectedTab}
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-8"
            >
              {selectedTab === 'general' && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  <div className="glass-card p-8 space-y-8 border border-white/20 shadow-xl">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <Palette className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black dark:text-white">إعدادات المظهر</h3>
                        <p className="text-sm font-medium text-slate-500">تخصيص واجهة المستخدم</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 group hover:border-blue-500/30 transition-all duration-300">
                        <div className="flex items-center gap-4">
                          <div className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-500 ${darkMode ? 'bg-slate-800 text-yellow-400 shadow-inner' : 'bg-yellow-100 text-yellow-600 shadow-sm'}`}>
                            {darkMode ? <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg> : <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" /></svg>}
                          </div>
                          <div>
                            <span className="text-sm font-black dark:text-white block">الوضع الداكن (Dark Mode)</span>
                            <span className="text-xs font-medium text-slate-500">تمكين المظهر الليلي للنظام</span>
                          </div>
                        </div>
                        <div
                          onClick={handleToggleDarkMode}
                          className={`relative inline-flex h-7 w-14 cursor-pointer items-center rounded-full transition-all duration-300 px-1 ${darkMode ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                          dir="ltr"
                        >
                          <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-all duration-300 ${darkMode ? 'translate-x-7' : 'translate-x-0'}`} />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="text-sm font-black text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <Layout className="h-4 w-4 text-blue-500" />
                          اختيار الخط (Display Font)
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {[
                            { id: 'cairo', name: 'Cairo', sub: 'كايرو العصري' },
                            { id: 'tajawal', name: 'Tajawal', sub: 'تجوال الأنيق' },
                            { id: 'outfit', name: 'Default', sub: 'الخط الافتراضي' }
                          ].map((f) => (
                            <button
                              key={f.id}
                              onClick={() => setFontFamily(f.id as any)}
                              className={`p-4 rounded-2xl border-2 transition-all text-right group ${fontFamily === f.id
                                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20'
                                : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-slate-300'
                                }`}
                            >
                              <span className={`block text-sm font-black ${fontFamily === f.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-white'}`}>{f.name}</span>
                              <span className="text-[10px] font-medium text-slate-500">{f.sub}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="glass-card p-8 space-y-8 border border-white/20 shadow-xl">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="h-12 w-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <Globe className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black dark:text-white">إعدادات API والبريد</h3>
                        <p className="text-sm font-medium text-slate-500">الربط الأساسي للنظام</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-black text-slate-700 dark:text-slate-300">عنوان خادم الـ API</label>
                        <input
                          type="text"
                          value={apiUrl}
                          onChange={(e) => setApiUrl(e.target.value)}
                          className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold dark:text-white"
                          placeholder="http://api.example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-black text-slate-700 dark:text-slate-300">البريد الإلكتروني للإدارة</label>
                        <input
                          type="email"
                          value={adminEmail}
                          onChange={(e) => setAdminEmail(e.target.value)}
                          className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold dark:text-white"
                          placeholder="admin@sukna.com"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedTab === 'system' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {[
                      {
                        label: 'حالة الاتصال',
                        value: health?.status === 'OK' ? 'متصل ومستقر' : 'مشكلة في الاتصال',
                        color: health?.status === 'OK' ? 'emerald' : 'red',
                        icon: Activity,
                        sub: health?.version ? `إصدار ${health.version}` : 'جاري الفحص...'
                      },
                      {
                        label: 'مدة تشغيل الخادم',
                        value: health?.uptime ? formatUptime(health.uptime) : 'غير متوفر',
                        color: 'blue',
                        icon: History,
                        sub: 'منذ آخر عملية إعادة تشغيل'
                      },
                      {
                        label: 'استهلاك الذاكرة',
                        value: health?.memory ? formatBytes(health.memory.rss) : '0 بايت',
                        color: 'purple',
                        icon: Cpu,
                        sub: 'الاستهلاك الحالي المباشر'
                      },
                      {
                        label: 'إجمالي التراخيص',
                        value: licenseStats?.total || 0,
                        color: 'indigo',
                        icon: Key,
                        sub: `${licenseStats?.active || 0} تراخيص نشطة حالياً`
                      },
                      {
                        label: 'الأجهزة المتصلة',
                        value: devices?.length || 0,
                        color: 'emerald',
                        icon: Users,
                        sub: 'إجمالي الأجهزة التي تم تفعيلها'
                      }
                    ].map((stat, i) => (
                      <div key={i} className="glass-card p-6 border border-white/20 hover:border-blue-500/30 hover:-translate-y-1 transition-all duration-300">
                        <div className={`h-12 w-12 bg-${stat.color}-100 dark:bg-${stat.color}-900/30 rounded-xl flex items-center justify-center text-${stat.color}-600 dark:text-${stat.color}-400 mb-4`}>
                          <stat.icon className="h-6 w-6" />
                        </div>
                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                        <h4 className={`text-lg font-black dark:text-white truncate ${stat.color === 'red' ? 'text-red-500' : ''}`}>{stat.value}</h4>
                        <p className="text-[10px] font-bold text-slate-400 mt-2">{stat.sub}</p>
                      </div>
                    ))}
                  </div>

                  <div className="glass-card p-8 border border-white/20 shadow-xl">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="h-12 w-12 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400">
                        <Wrench className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black dark:text-white">أدوات الصيانة</h3>
                        <p className="text-sm font-medium text-slate-500">إجراءات صيانة النظام الفورية</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <button
                        onClick={handleClearCache}
                        disabled={clearCacheMutation.isPending}
                        className="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-amber-500/50 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-all group"
                      >
                        <div className="h-14 w-14 bg-white dark:bg-slate-800 rounded-2xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <Database className={`h-7 w-7 ${clearCacheMutation.isPending ? 'animate-spin text-amber-500' : 'text-slate-600 dark:text-slate-300'}`} />
                        </div>
                        <span className="text-sm font-black dark:text-white">مسح الذاكرة المؤقتة</span>
                        <span className="text-[10px] font-medium text-slate-500 mt-1">تنظيف كاش Redis والمتصفح</span>
                      </button>

                      <button
                        onClick={() => queryClient.invalidateQueries()}
                        className="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-blue-500/50 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group"
                      >
                        <div className="h-14 w-14 bg-white dark:bg-slate-800 rounded-2xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <RefreshCw className="h-7 w-7 text-slate-600 dark:text-slate-300" />
                        </div>
                        <span className="text-sm font-black dark:text-white">تحديث البيانات</span>
                        <span className="text-[10px] font-medium text-slate-500 mt-1">إعادة جلب جميع البيانات الحية</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {selectedTab === 'security' && (
                <div className="max-w-3xl space-y-8">
                  <div className="glass-card p-8 border border-white/20 shadow-xl">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="h-12 w-12 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center text-red-600 dark:text-red-400">
                        <Lock className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black dark:text-white">إعدادات الأمان</h3>
                        <p className="text-sm font-medium text-slate-500">حماية حسابك وبيانات النظام</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {[
                        {
                          id: '2fa',
                          label: 'المصادقة الثنائية (2FA)',
                          sub: 'تأمين تسجيل الدخول بخطوة تحقق إضافية',
                          enabled: security.twoFactorAuth,
                          toggle: () => setSecurity(prev => ({ ...prev, twoFactorAuth: !prev.twoFactorAuth }))
                        },
                        {
                          id: 'secure-login',
                          label: 'تسجيل الدخول الآمن',
                          sub: 'فرض بروتوكولات حماية إضافية على الجلسات',
                          enabled: security.secureLogin,
                          toggle: () => setSecurity(prev => ({ ...prev, secureLogin: !prev.secureLogin }))
                        }
                      ].map((sec) => (
                        <div key={sec.id} className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                          <div>
                            <span className="text-sm font-black dark:text-white block">{sec.label}</span>
                            <span className="text-xs font-medium text-slate-500">{sec.sub}</span>
                          </div>
                          <div
                            onClick={sec.toggle}
                            className={`relative inline-flex h-7 w-14 cursor-pointer items-center rounded-full transition-all duration-300 px-1 ${sec.enabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                            dir="ltr"
                          >
                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-all duration-300 ${sec.enabled ? 'translate-x-7' : 'translate-x-0'}`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selectedTab === 'notifications' && (
                <div className="max-w-3xl space-y-8">
                  <div className="glass-card p-8 border border-white/20 shadow-xl">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="h-12 w-12 bg-pink-100 dark:bg-pink-900/30 rounded-2xl flex items-center justify-center text-pink-600 dark:text-pink-400">
                        <Bell className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black dark:text-white">إعدادات الإشعارات</h3>
                        <p className="text-sm font-medium text-slate-500">تحكم بكيفية استلام التنبيهات</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {[
                        {
                          id: 'email',
                          label: 'إشعارات البريد الإلكتروني',
                          sub: 'استلام تنبيهات النظام الهامة في صندوق بريدك',
                          enabled: notifications.email,
                          toggle: () => setNotifications(prev => ({ ...prev, email: !prev.email }))
                        },
                        {
                          id: 'browser',
                          label: 'إشعارات المتصفح',
                          sub: 'تفعيل التنبيهات اللحظية عبر المتصفح',
                          enabled: notifications.browser,
                          toggle: () => setNotifications(prev => ({ ...prev, browser: !prev.browser }))
                        },
                        {
                          id: 'errors',
                          label: 'تنبيهات الأخطاء',
                          sub: 'إبلاغ المسؤول فور حدوث أخطاء فادحة في النظام',
                          enabled: notifications.errors,
                          toggle: () => setNotifications(prev => ({ ...prev, errors: !prev.errors }))
                        }
                      ].map((notif) => (
                        <div key={notif.id} className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                          <div>
                            <span className="text-sm font-black dark:text-white block">{notif.label}</span>
                            <span className="text-xs font-medium text-slate-500">{notif.sub}</span>
                          </div>
                          <div
                            onClick={notif.toggle}
                            className={`relative inline-flex h-7 w-14 cursor-pointer items-center rounded-full transition-all duration-300 px-1 ${notif.enabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                            dir="ltr"
                          >
                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-all duration-300 ${notif.enabled ? 'translate-x-7' : 'translate-x-0'}`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selectedTab === 'advanced' && (
                <div className="max-w-4xl space-y-8">
                  <div className="glass-card p-8 border border-white/20 shadow-xl">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center text-red-600 dark:text-red-400">
                          <Wrench className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black dark:text-white">إعدادات متقدمة</h3>
                          <p className="text-sm font-medium text-slate-500">خاصة بالمطورين ومديري النظام</p>
                        </div>
                      </div>
                      <div
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className={`relative inline-flex h-7 w-14 cursor-pointer items-center rounded-full transition-all duration-300 px-1 ${showAdvanced ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                        dir="ltr"
                      >
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-all duration-300 ${showAdvanced ? 'translate-x-7' : 'translate-x-0'}`} />
                      </div>
                    </div>

                    <AnimatePresence>
                      {showAdvanced && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
                            <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
                              <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                                  <Monitor className="h-4 w-4" />
                                  سجل النظام المباشر (System Logs)
                                </span>
                                <button
                                  onClick={() => setShowSystemLogs(!showSystemLogs)}
                                  className="text-[10px] font-black bg-slate-800 text-slate-400 px-3 py-1 rounded-full uppercase hover:text-white transition-colors"
                                >
                                  {showSystemLogs ? 'إيقاف البث' : 'عرض السجل'}
                                </button>
                              </div>

                              {showSystemLogs ? (
                                <div className="font-mono text-[11px] text-slate-300 space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-4">
                                  <div className="opacity-50">[2024-03-15 14:30:05] <span className="text-blue-400">INFO</span>: خادم API جاهز للاستقبال على المنفذ 3002</div>
                                  <div>[2024-03-15 14:30:08] <span className="text-emerald-400">SUCCESS</span>: تم الاتصال بقاعدة البيانات بنجاح</div>
                                  <div>[2024-03-15 14:31:12] <span className="text-blue-400">INFO</span>: جلسة جديدة للمشرف admin@sukna.com</div>
                                  <div className="opacity-50">[2024-03-15 14:32:45] <span className="text-amber-400">WARN</span>: طلب موارد زائد من عنوان IP: 192.168.1.45</div>
                                  <div>[2024-03-15 14:33:01] <span className="text-blue-400">INFO</span>: تم تحديث إعدادات النظام عالمياً</div>
                                </div>
                              ) : (
                                <div className="h-20 flex items-center justify-center text-slate-600 font-bold text-xs">
                                  سجل النظام مخفي لأسباب تتعلق بالأداء
                                </div>
                              )}
                            </div>

                            <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-3xl">
                              <h4 className="text-sm font-black text-red-600 dark:text-red-400 flex items-center gap-2 mb-2">
                                <Shield className="h-4 w-4" />
                                منطقة الخطر
                              </h4>
                              <p className="text-xs font-medium text-red-500/80 mb-4">هذه الإعدادات قد تؤثر على استقرار النظام بالكامل. يرجى الحذر عند استخدامه.</p>
                              <Button variant="secondary" className="bg-red-500 text-white hover:bg-red-600 border-none font-black text-xs px-6 py-2.5 rounded-xl">
                                إعادة تهيئة النظام بالكامل
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}