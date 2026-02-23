import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getDnanirStats,
  getDnanirUsers,
  updateDnanirUser,
  getPushDevices,
  sendNotification,
  type DnanirUser,
  type ProDuration,
  type SendNotificationParams,
} from '../api/client';
import {
  Users,
  Crown,
  UserPlus,
  RefreshCw,
  Search,
  User,
  ChevronLeft,
  ChevronRight,
  X,
  Smartphone,
  Apple,
  Bell,
  Send,
  Zap,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Loader from '../components/Loader';
import Button from '../components/Button';

const PRESET_DURATIONS: { label: string; value: number; unit: ProDuration['unit'] }[] = [
  { label: 'شهر واحد', value: 1, unit: 'month' },
  { label: '٣ أشهر', value: 3, unit: 'month' },
  { label: '٦ أشهر', value: 6, unit: 'month' },
  { label: 'سنة واحدة', value: 1, unit: 'year' },
  { label: 'سنتان', value: 2, unit: 'year' },
];

const PRESET_NOTIFICATIONS = [
  {
    title: '🎁 هدية من نظام دنانير',
    body: 'لقد حصلت على ٧ أيام اشتراك "برو" مجانية! شكراً لاستخدامك تطبيق دنانير.',
  },
  {
    title: '🚀 ميزات البرو بانتظارك',
    body: 'جرب ميزات الذكاء الاصطناعي الآن وحلل مصروفاتك بدقة أكبر. اشترك في برو اليوم!',
  },
  {
    title: '⚠️ تذكير بتسجيل المصاريف',
    body: 'لا تنسَ تسجيل مصاريفك اليوم للحفاظ على ميزانية دقيقة ومتابعة أهدافك المالية.',
  },
  {
    title: '📊 ملخصك الشهري جاهز',
    body: 'تقريرك المالي للشهر الماضي جاهز الآن. اطلع على التحليلات لتعرف أين ذهبت أموالك.',
  },
  {
    title: '🎯 اقتربت من هدفك!',
    body: 'أنت تبلي بلاءً حسناً! لقد حققت ٨٠٪ من هدف الادخار لهذا الشهر. استمر في ذلك!',
  },
  {
    title: '💡 نصيحة مالية سريعة',
    body: 'هل تعلم؟ تقليل المصاريف الصغيرة اليومية قد يوفر لك مبلغاً كبيراً في نهاية العام.',
  },
  {
    title: '🏷️ عرض خاص لفترة محدودة',
    body: 'خصم ٥٠٪ على الاشتراك السنوي في "دنانير برو". لا تفوت الفرصة لتنظيم أموالك كالمحترفين.',
  },
  {
    title: '✨ تحديث جديد متوفر',
    body: 'أضفنا ميزات جديدة لتحسين تجربة استخدامك. حدث التطبيق الآن للحصول على أفضل أداء.',
  }
];

const Dnanir: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isProFilter, setIsProFilter] = useState<'all' | 'pro' | 'free'>('all');
  const [activateProUser, setActivateProUser] = useState<DnanirUser | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'push_devices'>('users');
  const [customDuration, setCustomDuration] = useState({ value: 1, unit: 'month' as ProDuration['unit'] });
  const [notificationUser, setNotificationUser] = useState<DnanirUser | null>(null);
  const [notificationForm, setNotificationForm] = useState({ title: '', body: '' });
  const [aiLimitUser, setAiLimitUser] = useState<DnanirUser | null>(null);

  useEffect(() => {
    const debounceTimer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 400);

    return () => window.clearTimeout(debounceTimer);
  }, [searchInput]);

  const { data: stats, isLoading: statsLoading, isError: statsIsError, error: statsError, refetch: refetchStats } = useQuery({
    queryKey: ['dnanir-stats'],
    queryFn: getDnanirStats,
    staleTime: 60 * 1000,
  });

  const { data: usersData, isLoading: usersLoading, isError: usersIsError, error: usersError, refetch: refetchUsers } = useQuery({
    queryKey: ['dnanir-users', page, debouncedSearch, isProFilter],
    queryFn: () =>
      getDnanirUsers({
        page,
        limit: 20,
        search: debouncedSearch || undefined,
        isPro: isProFilter === 'all' ? undefined : isProFilter === 'pro',
      }),
    staleTime: 30 * 1000,
  });

  const { data: pushDevices, isLoading: pushDevicesLoading, isError: pushDevicesIsError, error: pushDevicesError, refetch: refetchPushDevices } = useQuery({
    queryKey: ['dnanir-push-devices'],
    queryFn: () => getPushDevices({ appId: '69892d29f246fee6edf11f35' }),
    staleTime: 60 * 1000,
    enabled: activeTab === 'push_devices',
  });

  const updateUserMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: { isPro?: boolean; isActive?: boolean; proDuration?: ProDuration; hasUnlimitedAi?: boolean };
    }) => updateDnanirUser(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dnanir-users'] });
      queryClient.invalidateQueries({ queryKey: ['dnanir-stats'] });
      toast.success('تم التحديث');
      setActivateProUser(null);
    },
    onError: (err: Error) => {
      toast.error(err?.message || 'فشل التحديث');
    },
  });

  const sendNotificationMutation = useMutation({
    mutationFn: (params: SendNotificationParams) => sendNotification(params),
    onSuccess: () => {
      toast.success('تم إرسال التنبيه');
      setNotificationUser(null);
      setNotificationForm({ title: '', body: '' });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'فشل إرسال التنبيه');
    },
  });

  const refetch = () => {
    refetchStats();
    if (activeTab === 'users') {
      refetchUsers();
    } else {
      refetchPushDevices();
    }
  };

  const pagination = usersData?.pagination ?? { page: 1, limit: 20, total: 0, pages: 0 };
  const users = usersData?.users ?? [];
  const getErrorMessage = (error: unknown, fallback: string) =>
    error instanceof Error && error.message ? error.message : fallback;

  const handleActivatePro = (user: DnanirUser) => {
    setActivateProUser(user);
  };

  const handleDeactivatePro = (user: DnanirUser) => {
    const userLabel = user.name || user.phone || user.email || 'هذا المستخدم';
    const confirmed = window.confirm(`هل تريد إلغاء اشتراك برو عن ${userLabel}؟`);
    if (!confirmed) return;

    updateUserMutation.mutate({ id: user._id, payload: { isPro: false } });
  };

  const handleToggleActive = (user: DnanirUser) => {
    const userLabel = user.name || user.phone || user.email || 'هذا المستخدم';
    const actionLabel = user.isActive ? 'حظر' : 'إلغاء الحظر';
    const confirmed = window.confirm(`هل تريد ${actionLabel} للمستخدم ${userLabel}؟`);
    if (!confirmed) return;

    updateUserMutation.mutate({
      id: user._id,
      payload: { isActive: !user.isActive },
    });
  };

  const handleToggleUnlimitedAi = (user: DnanirUser) => {
    const userLabel = user.name || user.phone || user.email || 'هذا المستخدم';
    const enableUnlimited = !user.hasUnlimitedAi;
    const actionLabel = enableUnlimited ? 'تفعيل' : 'إلغاء';
    const confirmed = window.confirm(
      `هل تريد ${actionLabel} الوصول اللامحدود للذكاء الاصطناعي للمستخدم ${userLabel}؟`
    );
    if (!confirmed) return;

    updateUserMutation.mutate(
      {
        id: user._id,
        payload: { hasUnlimitedAi: enableUnlimited },
      },
      {
        onSuccess: () => setAiLimitUser(null),
      }
    );
  };

  const handleDurationSubmit = (proDuration: ProDuration | null) => {
    if (!activateProUser) return;
    if (proDuration) {
      updateUserMutation.mutate({
        id: activateProUser._id,
        payload: { proDuration },
      });
    } else {
      updateUserMutation.mutate({
        id: activateProUser._id,
        payload: { isPro: true },
      });
    }
  };

  const statsCards = [
    {
      label: 'إجمالي المستخدمين',
      value: stats?.totalUsers ?? 0,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgLight: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: 'مشتركو برو',
      value: stats?.proUsers ?? 0,
      icon: Crown,
      color: 'from-amber-500 to-amber-600',
      bgLight: 'bg-amber-50 dark:bg-amber-900/20',
    },
    {
      label: 'المجانيون',
      value: stats?.freeUsers ?? 0,
      icon: UserPlus,
      color: 'from-slate-500 to-slate-600',
      bgLight: 'bg-slate-100 dark:bg-slate-800/50',
    },
    {
      label: 'مستخدمو iOS',
      value: stats?.iosUsers ?? 0,
      icon: Apple,
      color: 'from-gray-700 to-gray-900',
      bgLight: 'bg-gray-100 dark:bg-gray-800/50',
    },
    {
      label: 'مستخدمو أندرويد',
      value: stats?.androidUsers ?? 0,
      icon: Smartphone,
      color: 'from-green-500 to-green-600',
      bgLight: 'bg-green-50 dark:bg-green-900/20',
    },
  ];

  return (
    <div className="space-y-8 dnanir-light-weights">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            دنانير
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            إدارة مستخدمي تطبيق دنانير والاشتراكات (برو)
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => refetch()}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          تحديث
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-white/10">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-6 py-3 text-sm font-bold transition-colors relative ${activeTab === 'users'
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
        >
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            المستخدمين
          </div>
          {activeTab === 'users' && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab('push_devices')}
          className={`px-6 py-3 text-sm font-bold transition-colors relative ${activeTab === 'push_devices'
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
        >
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            أجهزة التنبيهات (Push)
          </div>
          {activeTab === 'push_devices' && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
            />
          )}
        </button>
      </div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4"
      >
        {statsLoading
          ? Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-200 dark:border-white/10 p-6 bg-slate-50 dark:bg-slate-800/50 animate-pulse h-24"
            />
          ))
          : statsIsError ? (
            <div className="md:col-span-5 rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50/70 dark:bg-red-500/10 p-5">
              <p className="text-sm text-red-700 dark:text-red-300 mb-2">تعذر تحميل إحصائيات دنانير.</p>
              <p className="text-xs text-red-600 dark:text-red-300/80 mb-4">
                {getErrorMessage(statsError, 'حدث خطأ أثناء تحميل الإحصائيات.')}
              </p>
              <button
                onClick={() => refetchStats()}
                className="px-4 py-2 rounded-lg text-sm bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                إعادة المحاولة
              </button>
            </div>
          )
            : statsCards.map((card) => (
              <div
                key={card.label}
                className={`rounded-2xl border border-slate-200 dark:border-white/10 p-6 ${card.bgLight}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                      {card.label}
                    </p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                      {card.value}
                    </p>
                  </div>
                  <div
                    className={`p-3 rounded-xl bg-gradient-to-br ${card.color} text-white shadow-lg`}
                  >
                    <card.icon className="h-6 w-6" />
                  </div>
                </div>
              </div>
            ))}
      </motion.div>

      {activeTab === 'users' ? (
        <motion.div
          key="users-tab"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/50 overflow-hidden"
        >
          <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-white/10">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              المستخدمون والاشتراكات
            </h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="بحث بالاسم، البريد، الهاتف أو ID المستخدم..."
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                {(['all', 'pro', 'free'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => {
                      setIsProFilter(filter);
                      setPage(1);
                    }}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${isProFilter === filter
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                      }`}
                  >
                    {filter === 'all' ? 'الكل' : filter === 'pro' ? 'برو' : 'مجاني'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {usersLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader />
            </div>
          ) : usersIsError ? (
            <div className="py-16 text-center">
              <p className="text-red-700 dark:text-red-300 mb-2">تعذر تحميل قائمة المستخدمين.</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                {getErrorMessage(usersError, 'حدث خطأ أثناء تحميل المستخدمين.')}
              </p>
              <button
                onClick={() => refetchUsers()}
                className="px-4 py-2 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                إعادة المحاولة
              </button>
            </div>
          ) : users.length === 0 ? (
            <div className="py-16 text-center text-slate-500 dark:text-slate-400">
              لا يوجد مستخدمون
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                      <th className="text-right py-3 px-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase">
                        الاسم
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase">
                        البريد / الهاتف
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase">
                        الاشتراك
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase">
                        الحالة
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase">
                        التحقق
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase">
                        الإحالات
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase">
                        إجراء
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={user._id}
                        className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                              <User className="h-4 w-4 text-slate-500" />
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 dark:text-white">
                                {user.name || '—'}
                              </span>
                              <span className="block text-[11px] text-slate-400 dark:text-slate-500 ltr:text-left rtl:text-right">
                                ID: {user._id}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400 text-sm">
                          {user.email || user.phone || '—'}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${user.isPro
                              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                              }`}
                          >
                            {user.isPro ? (
                              <>
                                <Crown className="h-3.5 w-3.5" />
                                برو
                                {user.proExpiresAt ? (
                                  <span className="font-normal opacity-90">
                                    {' '}
                                    حتى {new Date(user.proExpiresAt).toLocaleDateString('ar-EG', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                                  </span>
                                ) : (
                                  <span className="font-normal opacity-90"> مدى الحياة</span>
                                )}
                              </>
                            ) : (
                              'مجاني'
                            )}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${user.isActive
                              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                              }`}
                          >
                            {user.isActive ? 'نشط' : 'محظور'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${user.isPhoneVerified
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                              }`}
                          >
                            {user.isPhoneVerified ? (
                              <>
                                <ShieldCheck className="h-3 w-3" />
                                مؤكد
                              </>
                            ) : (
                              <>
                                <ShieldAlert className="h-3 w-3" />
                                غير مؤكد
                              </>
                            )}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                              {user.referralCount || 0} إحالة
                            </span>
                            {user.referralCode && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                Code: {user.referralCode}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-2">
                            {user.isPro ? (
                              <button
                                onClick={() => handleDeactivatePro(user)}
                                disabled={updateUserMutation.isPending}
                                className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50 transition-colors"
                              >
                                إلغاء برو
                              </button>
                            ) : (
                              <button
                                onClick={() => handleActivatePro(user)}
                                disabled={updateUserMutation.isPending}
                                className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 disabled:opacity-50 transition-colors"
                              >
                                تفعيل برو
                              </button>
                            )}
                            <button
                              onClick={() => handleToggleActive(user)}
                              disabled={updateUserMutation.isPending}
                              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold disabled:opacity-50 transition-colors ${user.isActive
                                ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
                                : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-800/60'
                                }`}
                            >
                              {user.isActive ? 'حظر' : 'إلغاء الحظر'}
                            </button>
                            <button
                              onClick={() => setAiLimitUser(user)}
                              disabled={updateUserMutation.isPending}
                              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold disabled:opacity-50 transition-colors ${user.hasUnlimitedAi
                                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800/60'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
                                }`}
                              title={user.hasUnlimitedAi ? 'إلغاء الذكاء الاصطناعي اللامحدود' : 'تفعيل الذكاء الاصطناعي اللامحدود'}
                            >
                              {user.hasUnlimitedAi ? 'AI ♾️' : 'AI Limit'}
                            </button>
                            <button
                              onClick={() => setNotificationUser(user)}
                              className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                              title="إرسال تنبيه"
                            >
                              <Bell className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination.pages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-white/10">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {pagination.total} مستخدم
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-50 disabled:pointer-events-none"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      {page} / {pagination.pages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                      disabled={page >= pagination.pages}
                      className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-50 disabled:pointer-events-none"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      ) : (
        <motion.div
          key="push-devices-tab"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/50 overflow-hidden"
        >
          <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              أجهزة التنبيهات المسجلة
            </h2>
          </div>

          {pushDevicesLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader />
            </div>
          ) : pushDevicesIsError ? (
            <div className="py-16 text-center">
              <p className="text-red-700 dark:text-red-300 mb-2">تعذر تحميل أجهزة التنبيهات.</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                {getErrorMessage(pushDevicesError, 'حدث خطأ أثناء تحميل الأجهزة.')}
              </p>
              <button
                onClick={() => refetchPushDevices()}
                className="px-4 py-2 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                إعادة المحاولة
              </button>
            </div>
          ) : !pushDevices || pushDevices.length === 0 ? (
            <div className="py-16 text-center text-slate-500 dark:text-slate-400">
              لا توجد أجهزة مسجلة حالياً
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                    <th className="text-right py-3 px-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase">
                      الجهاز
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase">
                      النظام
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase">
                      التوكن
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase">
                      تاريخ التسجيل
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pushDevices.map((device) => (
                    <tr
                      key={device._id}
                      className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                            <Smartphone className="h-4 w-4 text-slate-500" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {device.userName || device.userId || 'Guest User'}
                            </span>
                            <span className="block text-[11px] text-slate-400 dark:text-slate-500">
                              {device._id}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs font-bold uppercase">
                          {device.platform || 'unknown'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="max-w-[200px] truncate text-xs text-slate-500 font-mono">
                          {device.token}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 text-sm">
                        {new Date(device.createdAt).toLocaleString('ar-EG')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}

      {/* Activate Pro – duration modal */}
      <AnimatePresence>
        {activateProUser && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActivateProUser(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40"
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 shadow-2xl p-6 pointer-events-auto"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    تفعيل برو – مدة الاشتراك
                  </h3>
                  <button
                    onClick={() => setActivateProUser(null)}
                    className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  للمستخدم: {activateProUser.name || activateProUser.email || activateProUser.phone || '—'}
                </p>
                <div className="space-y-2 mb-4">
                  {PRESET_DURATIONS.map((preset) => (
                    <button
                      key={`${preset.value}-${preset.unit}`}
                      onClick={() =>
                        handleDurationSubmit({
                          value: preset.value,
                          unit: preset.unit,
                        })
                      }
                      disabled={updateUserMutation.isPending}
                      className="w-full py-2.5 px-4 rounded-xl text-sm font-bold bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50 transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                  <button
                    onClick={() => handleDurationSubmit(null)}
                    disabled={updateUserMutation.isPending}
                    className="w-full py-2.5 px-4 rounded-xl text-sm font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-800/50 disabled:opacity-50 transition-colors"
                  >
                    مدى الحياة (بدون انتهاء)
                  </button>
                </div>
                <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex gap-2 items-end">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      min={1}
                      max={120}
                      value={customDuration.value}
                      onChange={(e) =>
                        setCustomDuration((d) => ({
                          ...d,
                          value: Math.max(1, Math.min(120, parseInt(e.target.value, 10) || 1)),
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                    <select
                      value={customDuration.unit}
                      onChange={(e) =>
                        setCustomDuration((d) => ({
                          ...d,
                          unit: e.target.value as ProDuration['unit'],
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="day">يوم</option>
                      <option value="month">شهر</option>
                      <option value="year">سنة</option>
                    </select>
                  </div>
                  <button
                    onClick={() =>
                      handleDurationSubmit({
                        value: customDuration.value,
                        unit: customDuration.unit,
                      })
                    }
                    disabled={updateUserMutation.isPending}
                    className="py-2 px-4 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    تطبيق
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Send Notification Modal */}
      <AnimatePresence>
        {notificationUser && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setNotificationUser(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40"
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 shadow-2xl p-6 pointer-events-auto"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Bell className="h-5 w-5 text-blue-500" />
                    إرسال تنبيه للمستخدم
                  </h3>
                  <button
                    onClick={() => setNotificationUser(null)}
                    className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                  إرسال تنبيه دفع (Push Notification) إلى الأجهزة المسجلة للمستخدم:{' '}
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    {notificationUser.name || notificationUser.phone || '—'}
                  </span>
                </p>

                <div className="space-y-4">
                  {/* Presets */}
                  <div>
                    <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                      قوالب جاهزة
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_NOTIFICATIONS.map((preset, idx) => (
                        <button
                          key={idx}
                          onClick={() => setNotificationForm({ title: preset.title, body: preset.body })}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 border border-transparent hover:border-blue-200 dark:hover:border-blue-800/50 transition-all"
                        >
                          {preset.title.split(' ')[0]} {preset.title.split(' ')[1] || ''}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="h-px bg-slate-100 dark:bg-white/5" />
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 font-black">
                      عنوان التنبيه
                    </label>
                    <input
                      type="text"
                      placeholder="أدخل عنوان التنبيه..."
                      value={notificationForm.title}
                      onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 transition-all font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 font-black">
                      نص الرسالة
                    </label>
                    <textarea
                      placeholder="أدخل نص الرسالة هنا..."
                      rows={4}
                      value={notificationForm.body}
                      onChange={(e) => setNotificationForm({ ...notificationForm, body: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 transition-all font-bold resize-none"
                    />
                  </div>

                  <div className="pt-2 flex gap-3">
                    <Button
                      variant="secondary"
                      className="flex-1"
                      onClick={() => setNotificationUser(null)}
                    >
                      إلغاء
                    </Button>
                    <Button
                      variant="primary"
                      className="flex-1 flex items-center justify-center gap-2"
                      disabled={sendNotificationMutation.isPending || !notificationForm.title || !notificationForm.body}
                      onClick={() =>
                        sendNotificationMutation.mutate({
                          title: notificationForm.title,
                          body: notificationForm.body,
                          userId: notificationUser._id,
                          appId: '69892d29f246fee6edf11f35', // Dnanir App ID
                        })
                      }
                    >
                      {sendNotificationMutation.isPending ? (
                        <Loader fullScreen={false} />
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          إرسال الآن
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
        {aiLimitUser && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAiLimitUser(null)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[60]"
            />
            <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[61] p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden pointer-events-auto border border-slate-200 dark:border-white/10"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white">الذكاء الاصطناعي</h2>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">تعديل حدود الاستهلاك</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setAiLimitUser(null)}
                      className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <X className="h-5 w-5 text-slate-400" />
                    </button>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5">
                      <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">المستخدم</p>
                      <p className="text-lg font-black text-slate-900 dark:text-white">{aiLimitUser.name || 'مستخدم بدون اسم'}</p>
                      <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{aiLimitUser.phone}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20">
                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1">تحليلات ذكية</p>
                        <p className="text-xl font-black text-blue-700 dark:text-blue-300">
                          {aiLimitUser.aiInsightsUsedThisMonth || 0}
                        </p>
                        <p className="text-[10px] font-bold text-blue-500/70">مستخدمة هذا الشهر</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20">
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">خطط أهداف</p>
                        <p className="text-xl font-black text-emerald-700 dark:text-emerald-300">
                          {aiLimitUser.aiGoalPlansUsedThisMonth || 0}
                        </p>
                        <p className="text-[10px] font-bold text-emerald-500/70">مستخدمة هذا الشهر</p>
                      </div>
                    </div>

                    {!aiLimitUser.hasUnlimitedAi ? (
                      <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/20 flex items-start gap-3">
                        <div className="mt-0.5">
                          <Zap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-purple-700 dark:text-purple-300">تفعيل الوصول اللامحدود</p>
                          <p className="text-xs text-purple-600 dark:text-purple-400/70 leading-relaxed font-bold">
                            سيتمكن المستخدم من استخدام ميزات الذكاء الاصطناعي دون أي قيود شهرية حتى نهاية الشهر الجاري.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 flex items-start gap-3">
                        <div className="mt-0.5">
                          <AlertCircle className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">إلغاء الوصول اللامحدود</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400/70 leading-relaxed font-bold">
                            سيعود المستخدم للحدود الطبيعية حسب نوع حسابه (Free أو Pro).
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="secondary"
                      className="flex-1"
                      onClick={() => setAiLimitUser(null)}
                    >
                      إلغاء
                    </Button>
                    <Button
                      variant={!aiLimitUser.hasUnlimitedAi ? 'primary' : 'danger'}
                      className="flex-1 flex items-center justify-center gap-2"
                      disabled={updateUserMutation.isPending}
                      onClick={() => handleToggleUnlimitedAi(aiLimitUser)}
                    >
                      {updateUserMutation.isPending ? (
                        <Loader fullScreen={false} />
                      ) : (
                        <>
                          {!aiLimitUser.hasUnlimitedAi ? (
                            <>
                              <Zap className="h-4 w-4" />
                              تفعيل اللامحدود
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-4 w-4" />
                              إلغاء اللامحدود
                            </>
                          )}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dnanir;
