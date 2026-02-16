import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
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
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  getDnanirStats,
  getDnanirUsers,
  updateDnanirUser,
  type DnanirUser,
  type ProDuration,
} from '../api/client';
import Loader from '../components/Loader';
import Button from '../components/Button';

const PRESET_DURATIONS: { label: string; value: number; unit: ProDuration['unit'] }[] = [
  { label: 'شهر واحد', value: 1, unit: 'month' },
  { label: '٣ أشهر', value: 3, unit: 'month' },
  { label: '٦ أشهر', value: 6, unit: 'month' },
  { label: 'سنة واحدة', value: 1, unit: 'year' },
  { label: 'سنتان', value: 2, unit: 'year' },
];

const Dnanir: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isProFilter, setIsProFilter] = useState<'all' | 'pro' | 'free'>('all');
  const [activateProUser, setActivateProUser] = useState<DnanirUser | null>(null);
  const [customDuration, setCustomDuration] = useState({ value: 1, unit: 'month' as ProDuration['unit'] });

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['dnanir-stats'],
    queryFn: getDnanirStats,
    staleTime: 60 * 1000,
  });

  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['dnanir-users', page, search, isProFilter],
    queryFn: () =>
      getDnanirUsers({
        page,
        limit: 20,
        search: search || undefined,
        isPro: isProFilter === 'all' ? undefined : isProFilter === 'pro',
      }),
    staleTime: 30 * 1000,
  });

  const updateUserMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: { isPro?: boolean; proDuration?: ProDuration };
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

  const refetch = () => {
    refetchStats();
    refetchUsers();
  };

  const pagination = usersData?.pagination ?? { page: 1, limit: 20, total: 0, pages: 0 };
  const users = usersData?.users ?? [];

  const handleActivatePro = (user: DnanirUser) => {
    setActivateProUser(user);
  };

  const handleDeactivatePro = (user: DnanirUser) => {
    updateUserMutation.mutate({ id: user._id, payload: { isPro: false } });
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
  ];

  return (
    <div className="space-y-8">
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

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        {statsLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-200 dark:border-white/10 p-6 bg-slate-50 dark:bg-slate-800/50 animate-pulse h-24"
              />
            ))
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

      {/* Users section */}
      <motion.div
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
                placeholder="بحث بالاسم، البريد أو الهاتف..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
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
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                    isProFilter === filter
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
                          <span className="font-bold text-slate-900 dark:text-white">
                            {user.name || '—'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 text-sm">
                        {user.email || user.phone || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                            user.isPro
                              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {user.isPro ? (
                            <>
                              <Crown className="h-3.5 w-3.5" />
                              برو
                              {user.proExpiresAt && (
                                <span className="font-normal opacity-90">
                                  {' '}
                                  حتى {new Date(user.proExpiresAt).toLocaleDateString('ar-EG', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </span>
                              )}
                            </>
                          ) : (
                            'مجاني'
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {user.isPro ? (
                          <button
                            onClick={() => handleDeactivatePro(user)}
                            disabled={updateUserMutation.isPending}
                            className="px-3 py-1.5 rounded-lg text-sm font-bold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50 transition-colors"
                          >
                            إلغاء برو
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivatePro(user)}
                            disabled={updateUserMutation.isPending}
                            className="px-3 py-1.5 rounded-lg text-sm font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 disabled:opacity-50 transition-colors"
                          >
                            تفعيل برو
                          </button>
                        )}
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
    </div>
  );
};

export default Dnanir;
