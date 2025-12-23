import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { 
  refreshDashboardData, 
  clearError 
} from '../store/slices/dashboardSlice';
import { usePermissions } from '../hooks/usePermissions';
import { 
  getAppDownloadStats, 
  getDashboardAnalytics, 
  getActivationCodesAnalytics, 
  getUsersAnalytics, 
  getAdminActivities, 
  getActivatedDevices,
  getAllSales,
  getSalesStats,
  getSalesChartData,
  createBackup,
  type AdminActivity,
  type Device,
  type Sale
} from '../api/client';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { 
  Users, 
  Key, 
  Shield, 
  Database,
  Activity,
  Download,
  CheckCircle,
  RefreshCw,
  HardDrive,
  Server,
  Clock,
  User,
  AlertCircle,
  Globe,
  LogIn,
  Plus,
  Edit,
  Trash2,
  ArrowDown,
  ArrowUp,
  FileText,
  MapPin,
  DollarSign,
  TrendingUp,
  Settings,
  FileBarChart,
  Zap
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const { canReadDashboard, canReadAnalytics } = usePermissions();
  const [analyticsPeriod, setAnalyticsPeriod] = useState('30d');
  
  const {
    analytics: reduxAnalytics,
    loading: reduxLoading,
    error,
    refreshing,
  } = useAppSelector(state => state.dashboard);

  // Use React Query for parallel fetching (no caching)
  const { data: dashboardAnalytics, isLoading: isLoadingDashboard } = useQuery({
    queryKey: ['dashboard-analytics'],
    queryFn: getDashboardAnalytics,
    staleTime: 0, // Always consider data stale
    gcTime: 0, // Don't cache data
    refetchOnMount: true, // Always refetch on mount
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });

  // These queries are kept for potential future use but not currently displayed
  useQuery({
    queryKey: ['codes-analytics'],
    queryFn: getActivationCodesAnalytics,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  useQuery({
    queryKey: ['users-analytics'],
    queryFn: getUsersAnalytics,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Fetch download statistics in parallel
  const { data: downloadStats, isLoading: isLoadingDownloadStats } = useQuery({
    queryKey: ['app-download-stats', '-68f0056a19bdc937b84fa942'],
    queryFn: () => getAppDownloadStats('-68f0056a19bdc937b84fa942'),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    enabled: !!dashboardAnalytics, // Only fetch after dashboard loads
  });

  // Fetch last 5 activities
  const { data: activitiesData, isLoading: isLoadingActivities } = useQuery({
    queryKey: ['dashboard-activities'],
    queryFn: () => getAdminActivities({ page: 1, limit: 5 }),
    staleTime: 30000, // Cache for 30 seconds
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Fetch recent activations (last 10 devices)
  const { data: recentDevices, isLoading: isLoadingDevices } = useQuery({
    queryKey: ['recent-devices'],
    queryFn: getActivatedDevices,
    staleTime: 30000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Fetch recent sales/transactions
  const { data: recentSales } = useQuery({
    queryKey: ['recent-sales'],
    queryFn: () => getAllSales({ page: 1, limit: 5, sort_by: 'created_at', sort_order: 'desc' }),
    staleTime: 60000, // Cache for 1 minute
    refetchOnMount: true,
  });

  // Fetch sales stats
  const { data: salesStats, isLoading: isLoadingSalesStats } = useQuery({
    queryKey: ['sales-stats'],
    queryFn: () => getSalesStats(),
    staleTime: 60000,
    refetchOnMount: true,
  });

  // Fetch sales chart data
  const { data: salesChartData } = useQuery({
    queryKey: ['sales-chart-data'],
    queryFn: () => getSalesChartData({ start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }),
    staleTime: 60000,
    refetchOnMount: true,
  });

  // Use React Query data if available, fallback to Redux
  const displayAnalytics = dashboardAnalytics || reduxAnalytics;
  const isLoading = isLoadingDashboard || reduxLoading;
  const displayDownloadStats = downloadStats;

  // Removed location fetching for now to fix linter errors

  const handleRefresh = () => {
    // Invalidate React Query cache to force refetch
    queryClient.invalidateQueries({ queryKey: ['dashboard-analytics'] });
    queryClient.invalidateQueries({ queryKey: ['codes-analytics'] });
    queryClient.invalidateQueries({ queryKey: ['users-analytics'] });
    queryClient.invalidateQueries({ queryKey: ['app-download-stats'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-activities'] });
    queryClient.invalidateQueries({ queryKey: ['recent-devices'] });
    queryClient.invalidateQueries({ queryKey: ['recent-sales'] });
    queryClient.invalidateQueries({ queryKey: ['sales-stats'] });
    queryClient.invalidateQueries({ queryKey: ['sales-chart-data'] });
    
    // Also refresh Redux for backward compatibility
    dispatch(refreshDashboardData({ period: analyticsPeriod }));
  };

  // Quick action handlers
  const handleQuickBackup = async () => {
    try {
      await createBackup();
      toast.success('تم إنشاء النسخة الاحتياطية بنجاح');
      queryClient.invalidateQueries({ queryKey: ['dashboard-analytics'] });
    } catch (error: any) {
      toast.error(error?.message || 'فشل في إنشاء النسخة الاحتياطية');
    }
  };

  const handleQuickGenerateCode = () => {
    window.location.href = '/#/activation-codes?action=generate';
  };

  const handleViewReports = () => {
    window.location.href = '/#/accountant';
  };

  const handleSystemSettings = () => {
    window.location.href = '/#/settings';
  };

  // Get recent activations (sorted by activation date, newest first)
  const recentActivations = useMemo(() => {
    if (!recentDevices) return [];
    return [...recentDevices]
      .sort((a, b) => new Date(b.activated_at).getTime() - new Date(a.activated_at).getTime())
      .slice(0, 10);
  }, [recentDevices]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ar-EG').format(num);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 بايت';
    const k = 1024;
    const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG');
  }, []);

  const formatDateTime = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  const getActivityIcon = (action: string) => {
    if (action.includes('LOGIN')) return LogIn;
    if (action.includes('CREATE') || action.includes('GENERATE')) return Plus;
    if (action.includes('UPDATE') || action.includes('EDIT')) return Edit;
    if (action.includes('DELETE') || action.includes('REMOVE')) return Trash2;
    if (action.includes('DOWNLOAD')) return ArrowDown;
    if (action.includes('UPLOAD')) return ArrowUp;
    return FileText;
  };

  const getActivityColor = (action: string) => {
    if (action.includes('LOGIN') || action.includes('SUCCESS')) return 'text-green-600 dark:text-green-400';
    if (action.includes('FAILED') || action.includes('ERROR')) return 'text-red-600 dark:text-red-400';
    if (action.includes('CREATE') || action.includes('GENERATE')) return 'text-blue-600 dark:text-blue-400';
    if (action.includes('UPDATE') || action.includes('EDIT')) return 'text-yellow-600 dark:text-yellow-400';
    if (action.includes('DELETE') || action.includes('REMOVE')) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  // Memoize theme colors to avoid recalculating on every render
  const themeColors = useMemo(() => {
    const isDark = document.documentElement.classList.contains('dark');
    return {
      primary: isDark ? '#60a5fa' : '#3b82f6',
      secondary: isDark ? '#34d399' : '#10b981',
      accent: isDark ? '#fbbf24' : '#f59e0b',
      warning: isDark ? '#fb7185' : '#ef4444',
      info: isDark ? '#a78bfa' : '#8b5cf6',
      text: isDark ? '#f3f4f6' : '#374151',
      grid: isDark ? '#374151' : '#e5e7eb',
      background: isDark ? '#1f2937' : '#ffffff'
    };
  }, []); // Recalculate only when theme changes (we'll add a listener if needed)

  // Memoize tooltip styles
  const tooltipStyle = useMemo(() => ({
    backgroundColor: themeColors.background,
    border: `1px solid ${themeColors.grid}`,
    borderRadius: '8px',
    color: themeColors.text,
    fontSize: '14px',
    padding: '8px'
  }), [themeColors]);

  const tooltipLabelStyle = useMemo(() => ({
    color: themeColors.text,
    fontWeight: '500' as const
  }), [themeColors]);

  const tooltipItemStyle = useMemo(() => ({
    color: themeColors.text
  }), [themeColors]);

  // Location functions removed to fix linter errors

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
        
        {/* Loading skeleton for cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Loading skeleton for charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
              <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-lg text-red-600 dark:text-red-400 mb-4 text-center">
          {error.includes('Network Error') || error.includes('Failed to fetch') 
            ? 'لا يمكن الاتصال بالخادم. يرجى التأكد من تشغيل الخادم الخلفي.'
            : error
          }
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => dispatch(clearError())}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            إعادة المحاولة
          </button>
          <button
            onClick={() => window.location.reload()}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            إعادة تحميل الصفحة
          </button>
        </div>
      </div>
    );
  }

  // STRICT PERMISSION CHECK - Prevent unauthorized access
  if (!canReadDashboard() || !canReadAnalytics()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          {/* Modern Access Denied Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-red-500 to-pink-600 p-6 text-white text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold mb-2">لا توجد صلاحية للوصول</h2>
              <p className="text-red-100 text-sm">Access Denied</p>
            </div>
            
            {/* Content */}
            <div className="p-6">
              <div className="text-center mb-6">
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                  ليس لديك صلاحية لقراءة لوحة التحكم والتحليلات
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-xs mt-2">
                  You don't have permission to access the dashboard and analytics
                </p>
              </div>
              
              {/* Required Permissions */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white text-center mb-4">
                  المطلوب صلاحيات:
                </h3>
                
                {!canReadDashboard() && (
                  <div className="flex items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-800 dark:text-red-200">dashboard:read</p>
                      <p className="text-xs text-red-600 dark:text-red-400">قراءة لوحة التحكم</p>
                    </div>
                  </div>
                )}
                
                {!canReadAnalytics() && (
                  <div className="flex items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-800 dark:text-red-200">analytics:read</p>
                      <p className="text-xs text-red-600 dark:text-red-400">قراءة التحليلات</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="mt-6 space-y-3">
                <button
                  onClick={() => window.history.back()}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  العودة للصفحة السابقة
                </button>
                <button
                  onClick={() => window.location.href = '/#/'}
                  className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-3 px-4 rounded-xl transition-all duration-200"
                >
                  الذهاب للرئيسية
                </button>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-gray-500 dark:text-gray-400 text-xs">
              إذا كنت تعتقد أن هذا خطأ، يرجى التواصل مع مدير النظام
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-3 sm:p-6" data-testid="dashboard">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">لوحة التحكم</h1>
                <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm lg:text-base">
                  مراقبة وتحليل أداء النظام ونشاط المستخدمين
                </p>
                <div className="mt-2 flex flex-wrap gap-1 sm:gap-2">
                  <span className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 rounded-full text-xs font-medium ${
                    canReadDashboard() ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    قراءة لوحة التحكم {canReadDashboard() ? '✓' : '✗'}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 rounded-full text-xs font-medium ${
                    canReadAnalytics() ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    قراءة التحليلات {canReadAnalytics() ? '✓' : '✗'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            {/* Period Selector */}
            <div className="relative">
              <label className="absolute -top-2 right-3 px-2 bg-white dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400">
                الفترة الزمنية
              </label>
              <select
                value={analyticsPeriod}
                onChange={(e) => setAnalyticsPeriod(e.target.value)}
                className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 w-full sm:w-auto"
              >
                <option value="7d">آخر 7 أيام</option>
                <option value="30d">آخر 30 يوم</option>
                <option value="90d">آخر 90 يوم</option>
                <option value="1y">آخر سنة</option>
              </select>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed font-medium text-sm sm:text-base"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              تحديث البيانات
            </button>
          </div>
        </div>
      </div>

      {/* Main Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
        {/* Total Codes */}
        <div className="group relative bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Key className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">إجمالي الأكواد</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(displayAnalytics?.totalCodes || 0)}</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-4 text-xs">
                <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <CheckCircle className="h-3 w-3" />
                  مستخدم: {formatNumber(displayAnalytics?.usedCodes || 0)}
                </span>
                <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                  <Key className="h-3 w-3" />
                  متاح: {formatNumber(displayAnalytics?.unusedCodes || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Total Users */}
        <div className="group relative bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">إجمالي المستخدمين</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(displayAnalytics?.totalUsers || 0)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <CheckCircle className="h-3 w-3" />
                نشط: {formatNumber(displayAnalytics?.activeUsers || 0)}
              </div>
            </div>
          </div>
        </div>

        {/* Activated Devices */}
        <div className="group relative bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <Server className="h-5 w-5 text-white" />
                </div>
            <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">الأجهزة المفعلة</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(displayAnalytics?.activatedDevices || 0)}</p>
              </div>
            </div>
              <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400">
                <Shield className="h-3 w-3" />
                مرخصة
              </div>
            </div>
          </div>
        </div>

        {/* Total Backups */}
        <div className="group relative bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                  <Database className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">النسخ الاحتياطية</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(displayAnalytics?.totalBackups || 0)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
                <HardDrive className="h-3 w-3" />
                {formatFileSize(displayAnalytics?.totalBackupSize || 0)}
              </div>
            </div>
          </div>
        </div>
      </div>

   {/* new section */}

      {/* Download Analytics Section */}
      {displayDownloadStats && (
        <div className="mb-6 sm:mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Download className="h-6 w-6 text-orange-600" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">إحصائيات تحميلات التطبيق</h3>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-sm text-gray-600 dark:text-gray-400">إجمالي التحميلات</div>
                  <div className="text-2xl font-bold text-orange-600">
                    {isLoadingDownloadStats ? '...' : displayDownloadStats.total_downloads}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600 dark:text-gray-400">الأجهزة الفريدة</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {isLoadingDownloadStats ? '...' : (displayDownloadStats.total_unique_devices || 0)}
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Downloads by Platform */}
              <div>
                <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">التحميلات حسب المنصة</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={displayDownloadStats.by_platform}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="platform" 
                      tickFormatter={(value) => {
                        const platformMap: Record<string, string> = {
                          'windows': 'ويندوز',
                          'mac': 'ماك',
                          'linux': 'لينكس',
                          'unknown': 'غير محدد'
                        };
                        return platformMap[value] || value;
                      }}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [formatNumber(value), 'تحميل']}
                      contentStyle={tooltipStyle}
                      labelStyle={tooltipLabelStyle}
                      itemStyle={tooltipItemStyle}
                    />
                    <Bar dataKey="count" fill={themeColors.primary} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Downloads Over Time */}
              <div>
                <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">التحميلات (آخر 30 يوم)</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={displayDownloadStats.last_30_days}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getDate()}/${date.getMonth() + 1}`;
                      }}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => {
                        const date = new Date(value);
                        return formatDate(date.toISOString());
                      }}
                      formatter={(value: number) => [formatNumber(value), 'تحميل']}
                      contentStyle={tooltipStyle}
                      labelStyle={tooltipLabelStyle}
                      itemStyle={tooltipItemStyle}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke={themeColors.secondary} 
                      fill={themeColors.secondary} 
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activations & Quick Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 sm:mb-8">
        {/* Recent Activations List */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <Server className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">التفعيلات الأخيرة</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">آخر 10 تفعيلات للأجهزة</p>
              </div>
            </div>
            <button
              onClick={() => window.location.href = '/#/devices'}
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium flex items-center gap-2"
            >
              عرض الكل
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {isLoadingDevices ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : recentActivations && recentActivations.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {recentActivations.map((device: Device) => (
                <div
                  key={device._id}
                  className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors border border-gray-200 dark:border-gray-600"
                >
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {device.device_id || 'غير محدد'}
                        </p>
                        {device.user?.username && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1 mt-1">
                            <User className="h-3 w-3" />
                            {device.user.username}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {device.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {typeof device.location === 'string' 
                            ? device.location 
                            : `${device.location.city || ''}, ${device.location.country || ''}`.trim() || 'غير محدد'}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDateTime(device.activated_at)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">لا توجد تفعيلات حالياً</p>
            </div>
          )}
        </div>

        {/* Quick Actions Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">إجراءات سريعة</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">الوصول السريع للمهام الشائعة</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleQuickGenerateCode}
              className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-900/30 dark:hover:to-blue-800/30 transition-all duration-200 border border-blue-200 dark:border-blue-700 group"
            >
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Key className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white text-center">إنشاء كود تفعيل</span>
            </button>

            <button
              onClick={handleQuickBackup}
              className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl hover:from-green-100 hover:to-green-200 dark:hover:from-green-900/30 dark:hover:to-green-800/30 transition-all duration-200 border border-green-200 dark:border-green-700 group"
            >
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Database className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white text-center">إنشاء نسخة احتياطية</span>
            </button>

            <button
              onClick={handleViewReports}
              className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl hover:from-purple-100 hover:to-purple-200 dark:hover:from-purple-900/30 dark:hover:to-purple-800/30 transition-all duration-200 border border-purple-200 dark:border-purple-700 group"
            >
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <FileBarChart className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white text-center">عرض التقارير</span>
            </button>

            <button
              onClick={handleSystemSettings}
              className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/20 dark:to-gray-600/20 rounded-xl hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-700/30 dark:hover:to-gray-600/30 transition-all duration-200 border border-gray-200 dark:border-gray-600 group"
            >
              <div className="w-12 h-12 bg-gray-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white text-center">إعدادات النظام</span>
            </button>
          </div>
        </div>
      </div>

      {/* Revenue/Sales Widget */}
      {salesStats && (
        <div className="mb-6 sm:mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">الإيرادات والمبيعات</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">نظرة عامة على المبيعات والإيرادات</p>
                </div>
              </div>
              <button
                onClick={() => window.location.href = '/#/accountant'}
                className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium flex items-center gap-2"
              >
                عرض التفاصيل
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {isLoadingSalesStats ? (
              <div className="animate-pulse space-y-4">
                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              </div>
            ) : (
              <>
                {/* Sales Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">إجمالي المبيعات</span>
                      <TrendingUp className="h-5 w-5 text-emerald-600" />
                    </div>
                    <p className="text-2xl font-bold text-emerald-600">
                      {formatNumber(salesStats.statistics?.totalSales || 0)}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">إجمالي الإيرادات</span>
                      <DollarSign className="h-5 w-5 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatNumber(salesStats.statistics?.totalRevenue || 0)} {salesStats.statistics?.totalRevenue > 0 ? 'د.ع' : ''}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-xl border border-green-200 dark:border-green-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">إجمالي الأرباح</span>
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      {formatNumber(salesStats.statistics?.totalProfit || 0)} {salesStats.statistics?.totalProfit > 0 ? 'د.ع' : ''}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-xl border border-purple-200 dark:border-purple-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">متوسط قيمة البيع</span>
                      <DollarSign className="h-5 w-5 text-purple-600" />
                    </div>
                    <p className="text-2xl font-bold text-purple-600">
                      {formatNumber(Math.round(salesStats.statistics?.averageSaleValue || 0))} {salesStats.statistics?.averageSaleValue > 0 ? 'د.ع' : ''}
                    </p>
                  </div>
                </div>

                {/* Recent Transactions */}
                {recentSales && recentSales.sales && recentSales.sales.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">المعاملات الأخيرة</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {recentSales.sales.slice(0, 5).map((sale: Sale) => (
                        <div
                          key={sale._id}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              sale.payment_info?.payment_status === 'completed' 
                                ? 'bg-green-100 dark:bg-green-900/30' 
                                : 'bg-yellow-100 dark:bg-yellow-900/30'
                            }`}>
                              <DollarSign className={`h-5 w-5 ${
                                sale.payment_info?.payment_status === 'completed' 
                                  ? 'text-green-600 dark:text-green-400' 
                                  : 'text-yellow-600 dark:text-yellow-400'
                              }`} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {sale.customer_info?.name || 'عميل غير محدد'}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDateTime(sale.created_at)}
                              </p>
                            </div>
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                              {formatNumber(sale.pricing?.final_price || 0)} {sale.pricing?.currency || 'د.ع'}
                            </p>
                            <p className={`text-xs ${
                              sale.payment_info?.payment_status === 'completed' 
                                ? 'text-green-600 dark:text-green-400' 
                                : 'text-yellow-600 dark:text-yellow-400'
                            }`}>
                              {sale.payment_info?.payment_status === 'completed' ? 'مكتمل' : 'قيد الانتظار'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Revenue Chart */}
                {salesChartData && salesChartData.data && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">الإيرادات (آخر 30 يوم)</h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={salesChartData.data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(value) => {
                            const date = new Date(value);
                            return `${date.getDate()}/${date.getMonth() + 1}`;
                          }}
                        />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={(value) => {
                            const date = new Date(value);
                            return formatDate(date.toISOString());
                          }}
                          formatter={(value: number) => [formatNumber(value) + ' د.ع', 'الإيرادات']}
                          contentStyle={tooltipStyle}
                          labelStyle={tooltipLabelStyle}
                          itemStyle={tooltipItemStyle}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke={themeColors.secondary} 
                          fill={themeColors.secondary} 
                          fillOpacity={0.6}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Last 5 Activities Section */}
      <div className="mb-6 sm:mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">آخر الأنشطة</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">آخر 5 أنشطة في النظام</p>
              </div>
            </div>
            <button
              onClick={() => window.location.href = '/#/logs'}
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium flex items-center gap-2"
            >
              عرض الكل
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {isLoadingActivities ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : activitiesData?.activities && activitiesData.activities.length > 0 ? (
            <div className="space-y-3">
              {activitiesData.activities.map((activity: AdminActivity) => (
                <div
                  key={activity.id || activity.timestamp}
                  className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors border border-gray-200 dark:border-gray-600"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-white dark:bg-gray-800 border-2 ${getActivityColor(activity.action).replace('text-', 'border-')}`}>
                    {(() => {
                      const IconComponent = getActivityIcon(activity.action);
                      return <IconComponent className={`h-5 w-5 ${getActivityColor(activity.action)}`} />;
                    })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`font-semibold text-sm ${getActivityColor(activity.action)}`}>
                            {activity.action}
                          </span>
                          {activity.adminName && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {activity.adminName}
                            </span>
                          )}
                        </div>
                        {activity.description && (
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                            {activity.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDateTime(activity.timestamp)}
                          </span>
                          {activity.ipAddress && (
                            <span className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              {activity.ipAddress}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">لا توجد أنشطة حالياً</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default Dashboard;