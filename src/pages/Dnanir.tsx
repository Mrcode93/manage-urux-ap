import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getDnanirStats,
  getDnanirUsers,
  updateDnanirUser,
  getPushDevices,
  sendNotification,
  deleteDnanirUser,
  getDnanirAnalytics,
  generateDnanirAiNotifications,
  getSavedDnanirTemplates,
  updateDnanirTemplate,
  deleteDnanirTemplate,
  getDnanirPromoCodes,
  createDnanirPromoCode,
  deleteDnanirPromoCode,
  getDnanirRaffleUsers,
  saveDnanirRaffleWinners,
  getSavedDnanirRaffleWinners,
  deleteDnanirRaffleWinner,
  type DnanirRaffleWinner,
  type DnanirUser,
  type ProDuration,
  type SendNotificationParams,
  type DnanirAiNotificationTemplate,
  type DnanirPromoCode,
} from '../api/client';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
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
  ShieldAlert,
  ShieldCheck,
  AlertCircle,
  Trash2,
  Save,
  History,
  Edit,
  MoreVertical,
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  Globe,
  Award,
  Ticket,
  Plus,
  Calendar,
  Clock,
  Wand2,
  Copy,
  Gift
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
    label: '👋 ترحيب',
    title: 'أهلاً بك في دنانير ✨',
    body: 'يسعدنا انضمامك إلينا! ابدأ الآن بتسجيل مصاريفك وراقب نموك المالي بكل سهولة.',
  },
  {
    label: '🎁 هدية برو',
    title: '🎁 هدية من نظام دنانير',
    body: 'لقد حصلت على ٧ أيام اشتراك "برو" مجانية! استمتع بكافة ميزات الذكاء الاصطناعي الآن.',
  },
  {
    label: '🚀 ميزات برو',
    title: '🚀 ميزات البرو بانتظارك',
    body: 'جرب ميزات الذكاء الاصطناعي الآن وحلل مصروفاتك بدقة أكبر. اشترك في برو اليوم!',
  },
  {
    label: '⚠️ تذكير',
    title: '⚠️ تذكير بتسجيل المصاريف',
    body: 'لا تنسَ تسجيل مصاريفك اليوم للحفاظ على ميزانية دقيقة ومتابعة أهدافك المالية.',
  },
  {
    label: '📊 تقرير',
    title: '📊 ملخصك الشهري جاهز',
    body: 'تقريرك المالي للشهر الماضي جاهز الآن. اطلع على التحليلات لتعرف أين ذهبت أموالك.',
  },
  {
    label: '💎 إلغاء برو',
    title: 'تحديث حالة الاشتراك 💎',
    body: 'تم إلغاء اشتراك البرو الخاص بك. يمكنك العودة والاشتراك مرة أخرى في أي وقت للاستفادة من الميزات المتقدمة.',
  },
  {
    label: '💡 نصيحة',
    title: '💡 نصيحة مالية سريعة',
    body: 'هل تعلم؟ تقليل المصاريف الصغيرة اليومية قد يوفر لك مبلغاً كبيراً في نهاية العام.',
  },
  {
    label: '🏷️ عرض',
    title: '🏷️ عرض خاص لفترة محدودة',
    body: 'خصم ٥٠٪ على الاشتراك السنوي في "دنانير برو". لا تفوت الفرصة لتنظيم أموالك كالمحترفين.',
  },
  {
    label: '✨ تحديث',
    title: '✨ تحديث جديد متوفر',
    body: 'أضفنا ميزات جديدة لتحسين تجربة استخدامك. حدث التطبيق الآن للحصول على أفضل أداء.',
  },
  {
    label: '⏳ تجديد برو',
    title: '⏳ اشتراكك ينتهي قريباً',
    body: 'اشتراكك في "دنانير برو" قارب على الانتهاء. جدد الآن للاستمرار في استخدام ميزات الذكاء الاصطناعي والحفاظ على سجلاتك المالية.',
  }
];

const Dnanir: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isProFilter, setIsProFilter] = useState<'all' | 'pro' | 'free'>('all');
  const [isExpiringSoonFilter, setIsExpiringSoonFilter] = useState(false);
  const [activateProUser, setActivateProUser] = useState<DnanirUser | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'push_devices' | 'analytics' | 'notifications' | 'promo_codes' | 'raffle'>('users');
  const [analyticsPeriod, setAnalyticsPeriod] = useState('30d');
  const [customDuration, setCustomDuration] = useState({ value: 1, unit: 'month' as ProDuration['unit'] });
  const [notificationUser, setNotificationUser] = useState<DnanirUser | null>(null);
  const [notificationForm, setNotificationForm] = useState({ title: '', body: '' });
  const [aiLimitUser, setAiLimitUser] = useState<DnanirUser | null>(null);
  const [editUser, setEditUser] = useState<DnanirUser | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '' });
  const [openActionId, setOpenActionId] = useState<string | null>(null);

  const [aiTopic, setAiTopic] = useState('');
  const [aiCount, setAiCount] = useState(5);
  const [aiTemplates, setAiTemplates] = useState<DnanirAiNotificationTemplate[]>([]);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({ title: '', body: '' });
  const [editingTemplate, setEditingTemplate] = useState<DnanirAiNotificationTemplate | null>(null);
  const [editTemplateForm, setEditTemplateForm] = useState({ label: '', title: '', body: '' });

  // Promo Codes State
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [promoForm, setPromoForm] = useState({
    code: '',
    rewardDays: 30,
    maxUses: 1,
    expiresAt: '',
  });

  // Raffle State
  const [raffleUsers, setRaffleUsers] = useState<DnanirUser[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [raffleWinners, setRaffleWinners] = useState<DnanirUser[]>([]);
  const [raffleLimit, setRaffleLimit] = useState(100);
  const [raffleParticipantType, setRaffleParticipantType] = useState<'all' | 'pro' | 'specific'>('all');
  const [raffleWinnerCount, setRaffleWinnerCount] = useState(1);
  const [raffleSelectedParticipants, setRaffleSelectedParticipants] = useState<DnanirUser[]>([]);
  const [participantSearchText, setParticipantSearchText] = useState('');
  const [isSearchingParticipants, setIsSearchingParticipants] = useState(false);
  const [participationSearchResults, setParticipationSearchResults] = useState<DnanirUser[]>([]);

  useEffect(() => {
    const handleClickOutside = () => setOpenActionId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    const debounceTimer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 400);

    return () => window.clearTimeout(debounceTimer);
  }, [searchInput]);

  const { data: stats, isLoading: statsLoading, isError: statsIsError, refetch: refetchStats } = useQuery({
    queryKey: ['dnanir-stats'],
    queryFn: getDnanirStats,
    staleTime: 60 * 1000,
  });

  const { data: usersData, isLoading: usersLoading, isError: usersIsError, error: usersError, refetch: refetchUsers } = useQuery({
    queryKey: ['dnanir-users', page, debouncedSearch, isProFilter, isExpiringSoonFilter],
    queryFn: () =>
      getDnanirUsers({
        page,
        limit: 20,
        search: debouncedSearch || undefined,
        isPro: isProFilter === 'all' ? undefined : isProFilter === 'pro',
        expiringSoon: isExpiringSoonFilter || undefined,
      }),
    staleTime: 30 * 1000,
  });

  const { data: pushDevices, isLoading: pushDevicesLoading, isError: pushDevicesIsError, error: pushDevicesError, refetch: refetchPushDevices } = useQuery({
    queryKey: ['dnanir-push-devices'],
    queryFn: () => getPushDevices({ appId: '69892d29f246fee6edf11f35' }),
    staleTime: 60 * 1000,
    enabled: activeTab === 'push_devices',
  });

  const { data: analytics, isLoading: analyticsLoading, isError: analyticsIsError, error: analyticsError, refetch: refetchAnalytics } = useQuery({
    queryKey: ['dnanir-analytics', analyticsPeriod],
    queryFn: () => getDnanirAnalytics({ period: analyticsPeriod }),
    staleTime: 5 * 60 * 1000,
    enabled: activeTab === 'analytics',
  });

  const { data: savedTemplates, isLoading: templatesLoading, refetch: refetchTemplates } = useQuery({
    queryKey: ['dnanir-templates'],
    queryFn: () => getSavedDnanirTemplates(),
    staleTime: 2 * 60 * 1000,
    enabled: activeTab === 'notifications',
  });

  const { data: promoCodes, isLoading: promosLoading, refetch: refetchPromos } = useQuery<DnanirPromoCode[]>({
    queryKey: ['dnanir-promos'],
    queryFn: () => getDnanirPromoCodes(),
    staleTime: 60 * 1000,
    enabled: activeTab === 'promo_codes',
  });

  const { data: savedRaffleWinners, isLoading: savedRaffleWinnersLoading } = useQuery<DnanirRaffleWinner[]>({
    queryKey: ['dnanir-raffle-winners'],
    queryFn: () => getSavedDnanirRaffleWinners(),
    staleTime: 60 * 1000,
    enabled: activeTab === 'raffle',
  });

  const saveRaffleWinnersMutation = useMutation({
    mutationFn: (payload: any) => saveDnanirRaffleWinners(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dnanir-raffle-winners'] });
      toast.success('تم حفظ الفائزين بنجاح!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'فشل في حفظ الفائزين');
    }
  });

  const deleteRaffleWinnerMutation = useMutation({
    mutationFn: (id: string) => deleteDnanirRaffleWinner(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dnanir-raffle-winners'] });
      toast.success('تم حذف السجل بنجاح');
    },
    onError: (error: any) => {
      toast.error(error.message || 'فشل في حذف السجل');
    }
  });

  const createPromoMutation = useMutation({
    mutationFn: (payload: any) => createDnanirPromoCode(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dnanir-promos'] });
      toast.success('تم إنشاء كود البرومو بنجاح');
      setIsPromoModalOpen(false);
      setPromoForm({ code: '', rewardDays: 30, maxUses: 1, expiresAt: '' });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'فشل إنشاء كود البرومو');
    },
  });

  const deletePromoMutation = useMutation({
    mutationFn: (id: string) => deleteDnanirPromoCode(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dnanir-promos'] });
      toast.success('تم حذف الكود');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'فشل حذف الكود');
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id: string) => deleteDnanirTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dnanir-templates'] });
      toast.success('تم حذف القالب');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'فشل حذف القالب');
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<DnanirAiNotificationTemplate> }) =>
      updateDnanirTemplate(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dnanir-templates'] });
      toast.success('تم تحديث القالب');
      setEditingTemplate(null);
    },
    onError: (err: any) => {
      toast.error(err?.message || 'فشل تحديث القالب');
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: {
        isPro?: boolean;
        isActive?: boolean;
        proDuration?: ProDuration;
        hasUnlimitedAi?: boolean;
        name?: string;
        email?: string;
        phone?: string;
      };
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

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => deleteDnanirUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dnanir-users'] });
      queryClient.invalidateQueries({ queryKey: ['dnanir-stats'] });
      toast.success('تم حذف المستخدم بنجاح');
    },
    onError: (err: Error) => {
      toast.error(err?.message || 'فشل حذف المستخدم');
    },
  });

  const refetch = () => {
    refetchStats();
    if (activeTab === 'users') {
      refetchUsers();
    } else if (activeTab === 'push_devices') {
      refetchPushDevices();
    } else if (activeTab === 'analytics') {
      refetchAnalytics();
    } else if (activeTab === 'notifications') {
      refetchTemplates();
    } else if (activeTab === 'promo_codes') {
      refetchPromos();
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

  const handleEditUser = (user: DnanirUser) => {
    setEditUser(user);
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;

    updateUserMutation.mutate({
      id: editUser._id,
      payload: {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
      },
    }, {
      onSuccess: () => setEditUser(null)
    });
  };

  const handleAiGenerateTemplates = async () => {
    try {
      setIsGeneratingAi(true);
      const templates = await generateDnanirAiNotifications({
        topic: aiTopic || undefined,
        count: aiCount,
      });
      setAiTemplates(templates);
      queryClient.invalidateQueries({ queryKey: ['dnanir-templates'] });
      toast.success('تم توليد القوالب بنجاح');
    } catch (error: any) {
      toast.error(error?.message || 'فشل توليد القوالب');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleBroadcastSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastForm.title || !broadcastForm.body) {
      toast.error('يرجى إدخال العنوان والنص');
      return;
    }

    sendNotificationMutation.mutate({
      title: broadcastForm.title,
      body: broadcastForm.body,
      appId: '69892d29f246fee6edf11f35', // Dnanir App ID
    });
  };

  const handleDeleteUser = (user: DnanirUser) => {
    const userLabel = user.name || user.phone || user.email || 'هذا المستخدم';
    if (window.confirm(`⚠️ تحذير: هل أنت متأكد من رغبتك في حذف المستخدم "${userLabel}"؟ هذا الإجراء لا يمكن التراجع عنه وسيتم حذف كافة بياناته.`)) {
      deleteUserMutation.mutate(user._id);
    }
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
      <div className="flex border-b border-slate-200 dark:border-white/10 overflow-x-auto scrollbar-hide -mx-4 sm:mx-0 px-4 sm:px-0">
        <div className="flex flex-nowrap min-w-max">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 text-sm font-bold transition-colors relative flex-shrink-0 ${activeTab === 'users'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
          >
            <div className="flex items-center gap-2 whitespace-nowrap">
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
            className={`px-6 py-3 text-sm font-bold transition-colors relative flex-shrink-0 ${activeTab === 'push_devices'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
          >
            <div className="flex items-center gap-2 whitespace-nowrap">
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
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-6 py-3 text-sm font-bold transition-colors relative flex-shrink-0 ${activeTab === 'analytics'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
          >
            <div className="flex items-center gap-2 whitespace-nowrap">
              <BarChart3 className="h-4 w-4" />
              التحليلات
            </div>
            {activeTab === 'analytics' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-6 py-3 text-sm font-bold transition-colors relative flex-shrink-0 ${activeTab === 'notifications'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
          >
            <div className="flex items-center gap-2 whitespace-nowrap">
              <Bell className="h-4 w-4" />
              مركز الإشعارات
            </div>
            {activeTab === 'notifications' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('promo_codes')}
            className={`px-6 py-3 text-sm font-bold transition-colors relative flex-shrink-0 ${activeTab === 'promo_codes'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
          >
            <div className="flex items-center gap-2 whitespace-nowrap">
              <Ticket className="h-4 w-4" />
              أكواد البرومو
            </div>
            {activeTab === 'promo_codes' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('raffle')}
            className={`px-6 py-3 text-sm font-bold transition-colors relative flex-shrink-0 ${activeTab === 'raffle'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
          >
            <div className="flex items-center gap-2 whitespace-nowrap">
              <Gift className="h-4 w-4" />
              عجلة الحظ
            </div>
            {activeTab === 'raffle' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
              />
            )}
          </button>
        </div>
      </div>



      {activeTab === 'users' && (
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
                <button
                  onClick={() => {
                    setIsExpiringSoonFilter(!isExpiringSoonFilter);
                    setPage(1);
                    if (!isExpiringSoonFilter) {
                      setIsProFilter('pro');
                    }
                  }}
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${isExpiringSoonFilter
                    ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 border border-transparent'
                    }`}
                >
                  <Clock className="h-4 w-4" />
                  ينتهي قريباً
                </button>

                {(['all', 'pro', 'free'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => {
                      setIsProFilter(filter);
                      setIsExpiringSoonFilter(false);
                      setPage(1);
                    }}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${isProFilter === filter && !isExpiringSoonFilter
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
                                {user.name || "—"}
                              </span>
                              <span className="block text-[11px] text-slate-400 dark:text-slate-500 ltr:text-left rtl:text-right">
                                ID: {user._id}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400 text-sm">
                          {user.email || user.phone || "—"}
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
                                    {" "}
                                    حتى {new Date(user.proExpiresAt).toLocaleDateString("ar-EG", {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </span>
                                ) : (
                                  <span className="font-normal opacity-90"> مدى الحياة</span>
                                )}
                              </>
                            ) : (
                              "مجاني"
                            )}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${user.isActive
                              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-amber-300'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                              }`}
                          >
                            {user.isActive ? "نشط" : "محظور"}
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
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenActionId(openActionId === user._id ? null : user._id);
                              }}
                              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 transition-colors"
                            >
                              <MoreVertical className="h-5 w-5" />
                            </button>

                            <AnimatePresence mode="wait">
                              {openActionId === user._id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                  className="absolute left-0 top-full mt-2 w-56 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 shadow-2xl z-20 overflow-hidden py-2"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    onClick={() => {
                                      handleEditUser(user);
                                      setOpenActionId(null);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                                  >
                                    <div className="w-8 h-8 rounded-lg bg-yellow-50 dark:bg-yellow-500/10 flex items-center justify-center">
                                      <Edit className="h-4 w-4 text-yellow-500" />
                                    </div>
                                    تعديل البيانات
                                  </button>

                                  {user.isPro ? (
                                    <button
                                      onClick={() => {
                                        handleDeactivatePro(user);
                                        setOpenActionId(null);
                                      }}
                                      className="w-full flex items-center gap-3 px-4 py-2 text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                                    >
                                      <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                                        <Crown className="h-4 w-4" />
                                      </div>
                                      إلغاء اشتراك برو
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        handleActivatePro(user);
                                        setOpenActionId(null);
                                      }}
                                      className="w-full flex items-center gap-3 px-4 py-2 text-sm font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors"
                                    >
                                      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                                        <Crown className="h-4 w-4" />
                                      </div>
                                      تفعيل اشتراك برو
                                    </button>
                                  )}

                                  <button
                                    onClick={() => {
                                      handleToggleUnlimitedAi(user);
                                      setOpenActionId(null);
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-bold transition-colors ${user.hasUnlimitedAi
                                      ? "text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/10"
                                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                                      }`}
                                  >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${user.hasUnlimitedAi ? "bg-purple-50 dark:bg-purple-500/10" : "bg-slate-50 dark:bg-white/5"
                                      }`}>
                                      <Zap className="h-4 w-4 text-purple-500" />
                                    </div>
                                    {user.hasUnlimitedAi ? "إلغاء AI اللامحدود" : "تفعيل AI اللامحدود"}
                                  </button>

                                  <button
                                    onClick={() => {
                                      handleToggleActive(user);
                                      setOpenActionId(null);
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-bold transition-colors ${user.isActive
                                      ? "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                                      : "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/10"
                                      }`}
                                  >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${user.isActive ? "bg-slate-50 dark:bg-white/5" : "bg-emerald-50 dark:bg-emerald-500/10"
                                      }`}>
                                      <ShieldAlert className="h-4 w-4 text-slate-400" />
                                    </div>
                                    {user.isActive ? "حظر المستخدم" : "إلغاء حظر المستخدم"}
                                  </button>

                                  <button
                                    onClick={() => {
                                      setNotificationUser(user);
                                      setOpenActionId(null);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                                  >
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                                      <Bell className="h-4 w-4 text-blue-500" />
                                    </div>
                                    إرسال تنبيه
                                  </button>

                                  <div className="my-1 border-t border-slate-100 dark:border-white/5" />

                                  <button
                                    onClick={() => {
                                      handleDeleteUser(user);
                                      setOpenActionId(null);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                                  >
                                    <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                                      <Trash2 className="h-4 w-4" />
                                    </div>
                                    حذف الحساب نهائياً
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
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
      )}

      {activeTab === 'push_devices' && (
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

      {activeTab === 'analytics' && (
        <motion.div
          key="analytics-tab"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="space-y-6"
        >
          {analyticsLoading ? (
            <div className="flex items-center justify-center py-32 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-white/10">
              <Loader />
            </div>
          ) : analyticsIsError ? (
            <div className="p-12 text-center bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-white/10">
              <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">فشل تحميل التحليلات</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-sm mx-auto">
                {getErrorMessage(analyticsError, 'حدث خطأ أثناء الاتصال بالسيرفر.')}
              </p>
              <Button onClick={() => refetchAnalytics()}>إعادة المحاولة</Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stats Cards (consolidated from top) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {statsLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="rounded-2xl border border-slate-200 dark:border-white/10 p-6 bg-slate-50 dark:bg-slate-800/50 animate-pulse h-24"
                    />
                  ))
                  : statsIsError ? (
                    <div className="lg:col-span-5 rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50/70 dark:bg-red-500/10 p-5">
                      <p className="text-sm text-red-700 dark:text-red-300">خطأ في الإحصائيات</p>
                    </div>
                  )
                    : statsCards.map((card) => (
                      <div
                        key={card.label}
                        className={`rounded-3xl border border-slate-200 dark:border-white/10 p-5 flex items-center justify-between gap-4 ${card.bgLight} bg-white dark:bg-slate-800/50 shadow-sm`}
                      >
                        <div className="flex-1 text-right">
                          <p className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                            {card.label}
                          </p>
                          <p className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                            {card.value}
                          </p>
                        </div>
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg shadow-black/10`}>
                          <card.icon className="h-7 w-7 text-white" />
                        </div>
                      </div>
                    ))}
              </div>

              {/* Analytics Header & Period Selector */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-white/10">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    تحليلات مستخدمي دنانير
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-bold">
                    نظرة شاملة على نمو المستخدمين والاشتراكات والنشاط
                  </p>
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                  {[
                    { label: '٧ أيام', value: '7d' },
                    { label: '٣٠ يوم', value: '30d' },
                    { label: '٩٠ يوم', value: '90d' },
                    { label: 'سنة', value: '1y' },
                  ].map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setAnalyticsPeriod(p.value)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${analyticsPeriod === p.value
                        ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Growth Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-white/10">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                      نمو المستخدمين الجدد
                    </h3>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analytics?.growth || []}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                        <XAxis
                          dataKey="_id"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fontWeight: 700 }}
                          dy={10}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fontWeight: 700 }}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                            direction: 'rtl',
                            textAlign: 'right'
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="count"
                          name="مستخدم جديد"
                          stroke="#3B82F6"
                          strokeWidth={4}
                          dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                          activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Pro vs Free Distribution */}
                <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-white/10">
                  <h3 className="font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                    <PieIcon className="h-4 w-4 text-amber-500" />
                    اشتراكات برو
                  </h3>
                  <div className="h-[200px] w-full mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'برو', value: analytics?.proStats.pro || 0 },
                            { name: 'مجاني', value: analytics?.proStats.free || 0 }
                          ]}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          <Cell fill="#F59E0B" />
                          <Cell fill="#94A3B8" />
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20">
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-300">برو</span>
                      <span className="text-sm font-black text-amber-900 dark:text-white">{analytics?.proStats.pro}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-white/5">
                      <span className="text-xs font-bold text-slate-500">مجاني</span>
                      <span className="text-sm font-black text-slate-700 dark:text-white">{analytics?.proStats.free}</span>
                    </div>
                  </div>
                </div>

                {/* Referrals & AI Usage */}
                <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-white/10">
                  <h3 className="font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                    <Award className="h-4 w-4 text-purple-500" />
                    أفضل المحيلين
                  </h3>
                  <div className="space-y-4">
                    {analytics?.referrals.top.map((u, i) => (
                      <div key={i} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-xs font-black">
                            {i + 1}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                              {u.name || u.phone || 'Guest'}
                            </p>
                            <p className="text-[10px] text-slate-500">{u.referralCount} إحالة</p>
                          </div>
                        </div>
                        <div className="h-2 w-16 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${(u.referralCount / (analytics.referrals.top[0]?.referralCount || 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-white/10">
                  <h3 className="font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-blue-500" />
                    أكثر مستخدمي SMART AI
                  </h3>
                  <div className="space-y-4">
                    {analytics?.aiUsage.top.map((u, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 font-black text-xs">
                            {i + 1}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">
                              {u.name || u.phone || 'Guest'}
                            </p>
                            <p className="text-[10px] text-slate-500">{u.smartAddUsedTotal} مرة</p>
                          </div>
                        </div>
                        <Zap className="h-4 w-4 text-yellow-500 opacity-50" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-white/10">
                  <h3 className="font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-slate-500" />
                    توزيع الدول
                  </h3>
                  <div className="space-y-4">
                    {analytics?.countries.map((c, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-xs font-black">
                            {c._id === 'IQ' ? '🇮🇶' : c._id}
                          </div>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {c._id === 'IQ' ? 'العراق' : c._id}
                          </span>
                        </div>
                        <span className="text-xs font-black bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded-lg">
                          {c.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {activeTab === 'notifications' && (
        <motion.div
          key="notifications-tab"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="space-y-6"
        >
          {/* BroadCast Form */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Bell className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">إرسال تنبيه عام</h2>
                  <p className="text-sm font-bold text-slate-500">إرسال لجميع مستخدمي دنانير النشطين</p>
                </div>
              </div>

              <form onSubmit={handleBroadcastSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 font-black">
                    عنوان التنبيه
                  </label>
                  <input
                    type="text"
                    placeholder="أدخل عنواناً جذاباً..."
                    value={broadcastForm.title}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-bold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 font-black">
                    نص الرسالة
                  </label>
                  <textarea
                    rows={4}
                    placeholder="اكتب نص التنبيه هنا..."
                    value={broadcastForm.body}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, body: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-bold resize-none"
                  />
                </div>
                <Button
                  variant="primary"
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3"
                  disabled={sendNotificationMutation.isPending}
                >
                  {sendNotificationMutation.isPending ? (
                    <Loader fullScreen={false} />
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      إرسال للجميع الآن
                    </>
                  )}
                </Button>
              </form>
            </div>

            {/* AI Generator Tools */}
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">مولد الإشعارات بالذكاء الاصطناعي</h2>
                  <p className="text-sm font-bold text-slate-500">استخدم Gemini لكتابة إشعارات إبداعية</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 font-black">
                    الموضوع (اختياري)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="مثلاً: توفير، نهاية الشهر، ميزة برو..."
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent font-bold"
                    />
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={aiCount}
                      onChange={(e) => setAiCount(parseInt(e.target.value) || 5)}
                      className="w-16 px-2 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-center"
                    />
                    <Button
                      variant="primary"
                      onClick={handleAiGenerateTemplates}
                      disabled={isGeneratingAi}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {isGeneratingAi ? <Loader fullScreen={false} /> : <RefreshCw className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {aiTemplates.length === 0 ? (
                    <div className="py-12 text-center border-2 border-dashed border-slate-200 dark:border-white/5 rounded-2xl">
                      <p className="text-sm text-slate-400 font-bold">اضغط على الزر لتوليد قوالب ذكية</p>
                    </div>
                  ) : (
                    aiTemplates.map((template, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 hover:border-purple-200 dark:hover:border-purple-900/40 transition-all cursor-pointer group"
                        onClick={() => setBroadcastForm({ title: template.title, body: template.body })}
                      >
                        <p className="text-xs font-black text-purple-600 dark:text-purple-400 mb-1 uppercase">
                          {template.label}
                        </p>
                        <h4 className="font-black text-slate-900 dark:text-white text-sm mb-1">{template.title}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{template.body}</p>
                        <div className="mt-2 text-[10px] font-black text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          اضغط للتطبيق على النموذج
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Saved Templates History */}
          <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-white/10">
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-blue-500" />
              تاريخ القوالب المحفوظة
            </h3>

            {templatesLoading ? (
              <div className="py-12 flex justify-center">
                <Loader fullScreen={false} />
              </div>
            ) : !savedTemplates || savedTemplates.length === 0 ? (
              <div className="py-12 text-center text-slate-500 font-bold border-2 border-dashed border-slate-100 dark:border-white/5 rounded-2xl">
                لا توجد قوالب محفوظة بعد
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedTemplates.map((template) => (
                  <div
                    key={template._id}
                    className="p-4 rounded-xl border border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all group relative"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-black bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded text-slate-500 uppercase">
                        {template.category || 'عام'}
                      </span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTemplate(template);
                            setEditTemplateForm({
                              label: template.label || '',
                              title: template.title,
                              body: template.body,
                            });
                          }}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-all"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (template._id) deleteTemplateMutation.mutate(template._id);
                          }}
                          className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div
                      className="cursor-pointer"
                      onClick={() => setBroadcastForm({ title: template.title, body: template.body })}
                    >
                      <h4 className="font-black text-slate-900 dark:text-white text-sm mb-1">{template.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{template.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {activeTab === 'promo_codes' && (
        <motion.div
          key="promo-codes-tab"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Ticket className="h-5 w-5 text-blue-500" />
              إدارة أكواد البرومو
            </h2>
            <Button
              onClick={() => setIsPromoModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              إنشاء كود جديد
            </Button>
          </div>

          <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
            {promosLoading ? (
              <div className="py-16 flex justify-center">
                <Loader fullScreen={false} />
              </div>
            ) : !promoCodes || promoCodes.length === 0 ? (
              <div className="py-16 text-center text-slate-500 font-bold">
                لا توجد أكواد برومو حالياً
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                      <th className="text-right py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-wider">الكود</th>
                      <th className="text-right py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-wider">المكافأة</th>
                      <th className="text-right py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-wider">الاستخدام</th>
                      <th className="text-right py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-wider">الحالة</th>
                      <th className="text-right py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-wider">تنتهي في</th>
                      <th className="text-right py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-wider">إجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {promoCodes.map((promo) => (
                      <tr key={promo._id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded-lg text-sm tracking-wider">
                              {promo.code}
                            </span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(promo.code);
                                toast.success('تم نسخ الكود بنجاح');
                              }}
                              className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                              title="نسخ الكود"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
                            <Award className="h-4 w-4 text-amber-500" />
                            {promo.rewardDays} يوم برو
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
                              {promo.usedCount} / {promo.maxUses}
                            </span>
                            <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500"
                                style={{ width: `${Math.min(100, (promo.usedCount / promo.maxUses) * 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex px-2 py-1 rounded-lg text-[10px] font-black uppercase ${promo.isActive
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                            {promo.isActive ? 'نشط' : 'غير نشط / منتهي'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm text-slate-500 font-bold">
                          {promo.expiresAt ? new Date(promo.expiresAt).toLocaleDateString('ar-EG') : 'بدون انتهاء'}
                        </td>
                        <td className="py-4 px-6">
                          <button
                            onClick={() => {
                              if (window.confirm('هل أنت متأكد من حذف هذا الكود؟')) {
                                deletePromoMutation.mutate(promo._id);
                              }
                            }}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {activeTab === 'raffle' && (
        <motion.div
          key="raffle-tab"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Gift className="h-5 w-5 text-purple-500" />
              عجلة الحظ للقرعة
            </h2>
          </div>

          <div className="bg-white dark:bg-slate-800/50 rounded-[2rem] border border-slate-200 dark:border-white/10 p-6 md:p-10 shadow-sm relative overflow-hidden">
            {/* Background Decorative Element */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-fuchsia-500/5 dark:bg-fuchsia-500/10 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none" />

            <div className="max-w-3xl mx-auto space-y-10 relative z-10">

              <div className="text-center space-y-2">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-fuchsia-100 dark:from-purple-900/40 dark:to-fuchsia-900/40 rounded-2xl mx-auto flex items-center justify-center shadow-inner border border-purple-200/50 dark:border-purple-500/20">
                  <Gift className="h-7 w-7 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">إعدادات القرعة</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs max-w-md mx-auto">
                  حدد معايير الاختيار ودع النظام يختار الفائزين لك بشكل عشوائي ومنصف.
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-5 md:p-6 border border-slate-100 dark:border-white/5 space-y-6 shadow-inner">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="flex flex-col text-sm font-black text-slate-700 dark:text-slate-300">
                      <span>عدد الفائزين</span>
                      <span className="text-[10px] font-normal text-slate-500 mt-1">كم رابح سيتم اختياره</span>
                    </label>
                    <div className="relative">
                      <Award className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-500" />
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={raffleWinnerCount}
                        onChange={(e) => setRaffleWinnerCount(parseInt(e.target.value) || 1)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl pr-12 pl-4 py-3 focus:ring-2 focus:ring-purple-500 font-bold text-slate-900 dark:text-white transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="flex flex-col text-sm font-black text-slate-700 dark:text-slate-300">
                      <span>حجم العينة العشوائية</span>
                      <span className="text-[10px] font-normal text-slate-500 mt-1">عدد الأشخاص اللي راح تدخلهم بفرز القرعة</span>
                    </label>
                    <div className="relative">
                      <Users className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        type="number"
                        min={raffleWinnerCount}
                        max={10000}
                        value={raffleLimit}
                        onChange={(e) => setRaffleLimit(Math.max(raffleWinnerCount, parseInt(e.target.value) || 10))}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl pr-12 pl-4 py-3 focus:ring-2 focus:ring-purple-500 font-bold text-slate-900 dark:text-white transition-all shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="flex flex-col text-sm font-black text-slate-700 dark:text-slate-300">
                    <span>منو يشترك بالقرعة؟</span>
                    <span className="text-[10px] font-normal text-slate-500 mt-1">اختار الفئة المستهدفة للسحب</span>
                  </label>

                  <div className="flex flex-wrap gap-2 p-1.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
                    {[
                      { id: 'all', label: 'الكل', icon: Users },
                      { id: 'pro', label: 'المشتركين برو', icon: Crown },
                      { id: 'specific', label: 'أشخاص محددين', icon: Search },
                    ].map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setRaffleParticipantType(type.id as any)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${raffleParticipantType === type.id
                          ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-md shadow-purple-500/20'
                          : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                          }`}
                      >
                        <type.icon className="h-4 w-4" />
                        {type.label}
                      </button>
                    ))}
                  </div>

                  {raffleParticipantType === 'specific' && (
                    <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="relative group">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
                        <input
                          type="text"
                          placeholder="ابحث عن مستخدم بالاسم، الهوية، أو الهاتف..."
                          value={participantSearchText}
                          onChange={async (e) => {
                            const val = e.target.value;
                            setParticipantSearchText(val);
                            if (val.trim().length > 2) {
                              setIsSearchingParticipants(true);
                              try {
                                const results = await getDnanirUsers({ search: val, limit: 10 });
                                setParticipationSearchResults(results.users);
                              } catch (err) {
                                console.error(err);
                              } finally {
                                setIsSearchingParticipants(false);
                              }
                            } else {
                              setParticipationSearchResults([]);
                            }
                          }}
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl pr-12 pl-4 py-3 focus:ring-2 focus:ring-purple-500 text-sm shadow-sm transition-all text-slate-900 dark:text-white"
                        />
                        {isSearchingParticipants && (
                          <div className="absolute left-4 top-1/2 -translate-y-1/2">
                            <div className="h-4 w-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}

                        {participationSearchResults.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl shadow-xl z-50 overflow-hidden max-h-52 overflow-y-auto">
                            {participationSearchResults.map(user => (
                              <button
                                key={user._id}
                                onClick={() => {
                                  if (!raffleSelectedParticipants.find(u => u._id === user._id)) {
                                    setRaffleSelectedParticipants([...raffleSelectedParticipants, user]);
                                  }
                                  setParticipantSearchText('');
                                  setParticipationSearchResults([]);
                                }}
                                className="w-full px-4 py-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b last:border-0 border-slate-100 dark:border-white/5"
                              >
                                <div className="text-right">
                                  <div className="text-xs font-bold text-slate-900 dark:text-white">{user.name || 'مستخدم بدون اسم'}</div>
                                  <div className="text-[9px] text-slate-500">{user.phone || user.email || user._id}</div>
                                </div>
                                {user.isPro && <Crown className="h-2.5 w-2.5 text-amber-500" />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {raffleSelectedParticipants.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {raffleSelectedParticipants.map(user => (
                            <div key={user._id} className="inline-flex items-center gap-1.5 bg-purple-50 dark:bg-purple-900/30 border border-purple-100 dark:border-purple-500/20 px-2.5 py-1 rounded-full">
                              <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300">{user.name || user.phone || 'مستخدم'}</span>
                              <button
                                onClick={() => setRaffleSelectedParticipants(raffleSelectedParticipants.filter(u => u._id !== user._id))}
                                className="p-0.5 hover:bg-purple-200 dark:hover:bg-purple-700 rounded-full transition-colors"
                              >
                                <X className="h-2.5 w-2.5 text-purple-400" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Button
                  onClick={async () => {
                    try {
                      setIsSpinning(true);
                      setRaffleWinners([]);

                      let users: DnanirUser[] = [];

                      if (raffleParticipantType === 'specific') {
                        if (raffleSelectedParticipants.length === 0) {
                          toast.error('يرجى اختيار مستخدمين للسحب');
                          setIsSpinning(false);
                          return;
                        }
                        users = [...raffleSelectedParticipants];
                      } else {
                        users = await getDnanirRaffleUsers({
                          limit: raffleLimit,
                          isPro: raffleParticipantType === 'pro' ? true : undefined,
                        });
                      }

                      setRaffleUsers(users);

                      if (users.length > 0) {
                        // Simulate spinning delay
                        setTimeout(() => {
                          if (users.length <= raffleWinnerCount) {
                            setRaffleWinners(users);
                          } else {
                            // shuffle array and pick `raffleWinnerCount` winners
                            const shuffled = [...users].sort(() => 0.5 - Math.random());
                            setRaffleWinners(shuffled.slice(0, raffleWinnerCount));
                          }

                          setIsSpinning(false);
                          toast.success('تم اختيار الفائزين بالقرعة!');
                        }, 3000);
                      } else {
                        toast.error('لم يتم العثور على مستخدمين للقرعة');
                        setIsSpinning(false);
                      }
                    } catch {
                      toast.error('حدث خطأ أثناء تحميل المستخدمين');
                      setIsSpinning(false);
                    }
                  }}
                  disabled={isSpinning}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white font-black text-base rounded-xl shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2"
                >
                  <Gift className={`h-4 w-4 ${isSpinning ? 'animate-spin' : ''}`} />
                  {isSpinning ? 'جاري السحب...' : 'ابدأ القرعة الآن'}
                </Button>
              </div>

              {raffleWinners.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="relative group"
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 rounded-[2.5rem] blur-lg opacity-40 group-hover:opacity-60 transition duration-1000 animate-gradient-xy" />

                  <div className="relative bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[1.8rem] p-0.5 border border-white/20 dark:border-white/10 shadow-2xl">
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-slate-900 dark:to-slate-800/90 rounded-[1.6rem] p-6 md:p-8 text-center relative overflow-hidden">
                      {/* Decorative elements */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
                      <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl -ml-16 -mb-16 pointer-events-none" />
                      <svg className="absolute top-8 right-8 w-6 h-6 text-amber-500/20 animate-spin-slow" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /></svg>
                      <svg className="absolute bottom-12 left-10 w-4 h-4 text-orange-500/30 animate-pulse" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /></svg>

                      <div className="relative z-10">
                        <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-xl shadow-orange-500/30 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                          <Crown className="h-10 w-10 text-white drop-shadow-md" />
                        </div>

                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100/50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-bold text-xs mb-6 border border-amber-200/50 dark:border-amber-500/20">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                          </span>
                          {raffleWinners.length > 1 ? `مبارك للـ ${raffleWinners.length} فائزين!` : 'مبارك للفائز بالقرعة!'}
                        </div>

                        <div className={`grid gap-4 ${raffleWinners.length > 1 ? (raffleWinners.length > 2 ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-2') : 'grid-cols-1 max-w-xs mx-auto'}`}>
                          {raffleWinners.map((winner, idx) => (
                            <div key={winner._id} className="bg-slate-50 dark:bg-slate-800/80 rounded-xl p-3.5 border border-slate-100 dark:border-white/5 shadow-sm text-center">
                              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 font-black text-xs flex items-center justify-center mx-auto mb-2">
                                {idx + 1}
                              </div>
                              <p className="text-base font-black text-slate-900 dark:text-white mb-1 truncate">
                                {winner.name || 'مستخدم بدون اسم'}
                              </p>
                              <div className="flex flex-col text-xs font-bold text-slate-500">
                                <span className="truncate">{winner.email || winner.phone || 'بدون اتصال'}</span>
                                <span className="opacity-60 truncate font-mono mt-1">ID: {winner._id}</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-8 pt-8 border-t border-amber-500/20">
                          <div className="max-w-md mx-auto">
                            <h4 className="text-slate-700 dark:text-slate-300 font-bold mb-4 text-sm">حفظ نتائج السحب في السجل</h4>
                            <div className="space-y-4">
                              <div className="relative">
                                <Gift className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-500/50" />
                                <input
                                  type="text"
                                  id="raffle-reward-input"
                                  placeholder="اسم الجائزة (اختياري، مثلاً: شهر برو)"
                                  className="w-full bg-white dark:bg-slate-900 border border-amber-500/30 rounded-xl pr-12 pl-4 py-3.5 focus:ring-2 focus:ring-amber-500 text-amber-900 dark:text-amber-100 placeholder-amber-500/50 font-bold shadow-sm transition-all"
                                />
                              </div>
                              <div className="grid grid-cols-3 gap-3 mb-4">
                                {[
                                  { label: '7 أيام', val: 7 },
                                  { label: '10 أيام', val: 10 },
                                  { label: '30 يوم', val: 30 },
                                ].map((p) => (
                                  <button
                                    key={p.val}
                                    type="button"
                                    onClick={() => {
                                      const input = document.getElementById('raffle-pro-days-input') as HTMLInputElement;
                                      if (input) input.value = p.val.toString();
                                    }}
                                    className="py-2.5 rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400 font-bold text-xs hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-all"
                                  >
                                    {p.label}
                                  </button>
                                ))}
                              </div>

                              <div className="relative">
                                <Crown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-500/50" />
                                <input
                                  type="number"
                                  min={0}
                                  id="raffle-pro-days-input"
                                  placeholder="منح اشتراك برو للفائزين (أيام، اختياري)"
                                  title="اترك الحقل فارغاً إذا لم تكن الجائزة اشتراك"
                                  className="w-full bg-white dark:bg-slate-900 border border-amber-500/30 rounded-xl pr-12 pl-4 py-3.5 focus:ring-2 focus:ring-amber-500 text-amber-900 dark:text-amber-100 placeholder-amber-500/50 font-bold shadow-sm transition-all shadow-sm"
                                />
                              </div>
                              <Button
                                onClick={() => {
                                  const rewardInput = document.getElementById('raffle-reward-input') as HTMLInputElement;
                                  const proDaysInput = document.getElementById('raffle-pro-days-input') as HTMLInputElement;
                                  const reward = rewardInput?.value || 'فائز بالقرعة';
                                  const grantProDays = proDaysInput?.value ? parseInt(proDaysInput.value) : undefined;

                                  saveRaffleWinnersMutation.mutate({
                                    winners: raffleWinners.map(w => ({ userId: w._id, reward: reward })),
                                    raffleName: `سحب ${new Date().toLocaleDateString('ar-EG')} - ${new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`,
                                    reward: reward,
                                    grantProDays: grantProDays
                                  });
                                }}
                                disabled={saveRaffleWinnersMutation.isPending}
                                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black py-4 rounded-xl shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-3 text-lg"
                              >
                                <Save className="h-6 w-6" />
                                {saveRaffleWinnersMutation.isPending ? 'جاري الحفظ...' : 'حفظ نتائج السحب'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {raffleUsers.length > 0 && raffleWinners.length === 0 && isSpinning && (
                <div className="text-center py-16 relative overflow-hidden rounded-[2.5rem] bg-slate-900/5 dark:bg-slate-900/20 border border-slate-200/50 dark:border-white/5">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
                  <div className="mb-10 relative w-32 h-32 mx-auto">
                    <div className="absolute inset-0 border-[6px] border-slate-200/50 dark:border-slate-800/50 border-t-purple-500 border-r-fuchsia-500 rounded-full animate-spin shadow-lg shadow-purple-500/20"></div>
                    <div className="absolute inset-2 border-[4px] border-slate-200/30 dark:border-slate-800/30 border-b-amber-500 border-l-orange-500 rounded-full animate-spin-slow reverse-spin"></div>

                    <div className="absolute inset-0 m-auto h-14 w-14 bg-white dark:bg-slate-800 rounded-2xl shadow-inner flex items-center justify-center animate-pulse z-10 transform rotate-45">
                      <Gift className="h-8 w-8 text-purple-600 dark:text-purple-400 -rotate-45 drop-shadow-sm" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-fuchsia-600 dark:from-purple-400 dark:to-fuchsia-400 animate-pulse mb-2">
                    جاري السحب...
                  </h3>
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                    نختار الفائزين من بين {raffleUsers.length} مشارك
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-8 mb-4 flex items-center gap-2">
            <History className="h-6 w-6 text-slate-500" />
            <h3 className="text-xl font-black text-slate-900 dark:text-white">سجل السحوبات السابقة</h3>
          </div>

          <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
            {savedRaffleWinnersLoading ? (
              <div className="py-16 flex justify-center">
                <Loader fullScreen={false} />
              </div>
            ) : !savedRaffleWinners || savedRaffleWinners.length === 0 ? (
              <div className="py-16 text-center text-slate-500 font-bold">
                لا توجد سحوبات سابقة
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                      <th className="text-right py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-wider">اسم الفائز</th>
                      <th className="text-right py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-wider">معلومات التواصل</th>
                      <th className="text-right py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-wider">اسم القرعة / الجائزة</th>
                      <th className="text-right py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-wider">تاريخ السحب</th>
                      <th className="text-right py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-wider">إجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {savedRaffleWinners.map((winner) => (
                      <tr key={winner._id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-900 dark:text-white">{winner.name || 'بدون اسم'}</div>
                          <div className="text-xs text-slate-500 mt-1">{winner.userId}</div>
                        </td>
                        <td className="py-4 px-6 font-bold text-slate-600 dark:text-slate-300">
                          {winner.email || winner.phone || 'N/A'}
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg inline-block text-sm">
                            {winner.reward || winner.raffleName}
                          </div>
                          {winner.reward && winner.raffleName && winner.reward !== winner.raffleName && (
                            <div className="text-xs text-slate-500 mt-1 font-bold">{winner.raffleName}</div>
                          )}
                        </td>
                        <td className="py-4 px-6 text-sm text-slate-500 font-bold">
                          {new Date(winner.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-4 px-6">
                          <button
                            onClick={() => {
                              if (window.confirm('هل أنت متأكد من حذف هذا السجل؟')) {
                                deleteRaffleWinnerMutation.mutate(winner._id);
                              }
                            }}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Promo Code Creation Modal */}
      <AnimatePresence>
        {isPromoModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPromoModalOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[90]"
            />
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl pointer-events-auto border border-slate-200 dark:border-white/10"
              >
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">إنشاء كود برومو</h3>
                  <button onClick={() => setIsPromoModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl text-slate-500">
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  createPromoMutation.mutate(promoForm);
                }} className="space-y-6">
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase mb-2 mr-1">الكود (مثال: FREE30)</label>
                    <div className="relative">
                      <Ticket className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        required
                        type="text"
                        value={promoForm.code}
                        onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })}
                        className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl py-4 pr-12 pl-14 font-black tracking-widest text-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="ENTER_CODE"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
                          let result = '';
                          for (let i = 0; i < 8; i++) {
                            result += chars.charAt(Math.floor(Math.random() * chars.length));
                          }
                          setPromoForm({ ...promoForm, code: result });
                        }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl text-blue-500 transition-all border border-transparent hover:border-blue-100 dark:hover:border-blue-900/30"
                        title="توليد كود تلقائي"
                      >
                        <Wand2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-slate-500 uppercase mb-2 mr-1">أيام البرو</label>
                      <div className="relative">
                        <Award className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <input
                          required
                          type="number"
                          min={1}
                          value={promoForm.rewardDays}
                          onChange={(e) => setPromoForm({ ...promoForm, rewardDays: parseInt(e.target.value) })}
                          className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl py-4 pr-12 pl-4 font-bold focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-500 uppercase mb-2 mr-1">أقصى استخدام</label>
                      <div className="relative">
                        <Users className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <input
                          required
                          type="number"
                          min={1}
                          value={promoForm.maxUses}
                          onChange={(e) => setPromoForm({ ...promoForm, maxUses: parseInt(e.target.value) })}
                          className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl py-4 pr-12 pl-4 font-bold focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase mb-2 mr-1">تاريخ الانتهاء (اختياري)</label>
                    <div className="relative">
                      <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        type="date"
                        value={promoForm.expiresAt}
                        onChange={(e) => setPromoForm({ ...promoForm, expiresAt: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl py-4 pr-12 pl-4 font-bold focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full py-4 rounded-2xl text-lg font-black mt-4"
                    disabled={createPromoMutation.isPending}
                  >
                    {createPromoMutation.isPending ? 'جاري الإنشاء...' : 'إنشاء الكود الآن'}
                  </Button>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

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

      {/* Edit Template Modal */}
      <AnimatePresence>
        {editingTemplate && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingTemplate(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40"
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 shadow-2xl p-6 pointer-events-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Edit className="h-5 w-5 text-blue-500" />
                    تعديل القالب
                  </h3>
                  <button
                    onClick={() => setEditingTemplate(null)}
                    className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (editingTemplate._id) {
                      updateTemplateMutation.mutate({
                        id: editingTemplate._id,
                        payload: editTemplateForm,
                      });
                    }
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-xs font-black text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                        التصنيف
                      </label>
                      <input
                        type="text"
                        value={editTemplateForm.label}
                        onChange={(e) => setEditTemplateForm({ ...editTemplateForm, label: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-bold"
                        placeholder="مثلاً: ترحيب، عرض، تذكير..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                        العنوان
                      </label>
                      <input
                        type="text"
                        required
                        value={editTemplateForm.title}
                        onChange={(e) => setEditTemplateForm({ ...editTemplateForm, title: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                        نص التنبيه
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={editTemplateForm.body}
                        onChange={(e) => setEditTemplateForm({ ...editTemplateForm, body: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-bold resize-none"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <Button
                      type="submit"
                      variant="primary"
                      className="flex-1"
                      disabled={updateTemplateMutation.isPending}
                    >
                      {updateTemplateMutation.isPending ? <Loader fullScreen={false} /> : 'حفظ التغييرات'}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setEditingTemplate(null)}
                      className="flex-1 font-bold"
                    >
                      إلغاء
                    </Button>
                  </div>
                </form>
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
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 border border-transparent hover:border-blue-200 dark:hover:border-blue-800/50 transition-all font-black"
                        >
                          {preset.label}
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
      {/* Edit User Modal */}
      <AnimatePresence>
        {editUser && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditUser(null)}
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
                    <Edit className="h-5 w-5 text-yellow-500" />
                    تعديل بيانات المستخدم
                  </h3>
                  <button
                    onClick={() => setEditUser(null)}
                    className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleEditSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 font-black">
                      الاسم
                    </label>
                    <input
                      type="text"
                      placeholder="اسم المستخدم..."
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 transition-all font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 font-black">
                      البريد الإلكتروني
                    </label>
                    <input
                      type="email"
                      placeholder="email@example.com"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 transition-all font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 font-black">
                      رقم الهاتف
                    </label>
                    <input
                      type="text"
                      placeholder="07XXXXXXXX"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 transition-all font-bold"
                    />
                  </div>

                  <div className="pt-2 flex gap-3">
                    <Button
                      variant="secondary"
                      className="flex-1"
                      onClick={() => setEditUser(null)}
                      type="button"
                    >
                      إلغاء
                    </Button>
                    <Button
                      variant="primary"
                      className="flex-1 flex items-center justify-center gap-2"
                      disabled={updateUserMutation.isPending}
                      type="submit"
                    >
                      {updateUserMutation.isPending ? (
                        <Loader fullScreen={false} />
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4" />
                          حفظ التعديلات
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dnanir;
