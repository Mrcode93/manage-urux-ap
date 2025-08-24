import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { 
  fetchDashboardData, 
  refreshDashboardData, 
  clearError 
} from '../store/slices/dashboardSlice';
import { usePermissions } from '../hooks/usePermissions';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { 
  Users, 
  Key, 
  Shield, 
  Database,
  TrendingUp,
  Activity,
  Clock,
  Download,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Calendar,
  HardDrive,
  Server,
  Globe
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { canReadDashboard, canReadAnalytics } = usePermissions();
  const [analyticsPeriod, setAnalyticsPeriod] = useState('30d');
  
  const {
    analytics,
    codesAnalytics,
    usersAnalytics,
    systemAnalytics,
    analyticsData,
    downloadStats,
    platformStats,
    versionStats,
    timeSeriesData,
    loading,
    error,
    refreshing
  } = useAppSelector(state => state.dashboard);

  useEffect(() => {
    dispatch(fetchDashboardData({ period: analyticsPeriod }));
  }, [dispatch, analyticsPeriod]);

  // Removed location fetching for now to fix linter errors

  const handleRefresh = async () => {
    dispatch(refreshDashboardData({ period: analyticsPeriod }));
  };

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG');
  };

  // Theme-aware colors
  const getThemeColors = () => {
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
  };

  const COLORS = [
    getThemeColors().primary,
    getThemeColors().secondary,
    getThemeColors().accent,
    getThemeColors().warning,
    getThemeColors().info
  ];

  // Custom tooltip styles
  const tooltipStyle = {
    backgroundColor: getThemeColors().background,
    border: `1px solid ${getThemeColors().grid}`,
    borderRadius: '8px',
    color: getThemeColors().text,
    fontSize: '14px',
    padding: '8px'
  };

  const tooltipLabelStyle = {
    color: getThemeColors().text,
    fontWeight: '500'
  };

  const tooltipItemStyle = {
    color: getThemeColors().text
  };

  // Location functions removed to fix linter errors

  if (loading) {
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
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(analytics?.totalCodes || 0)}</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-4 text-xs">
                <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <CheckCircle className="h-3 w-3" />
                  مستخدم: {formatNumber(analytics?.usedCodes || 0)}
                </span>
                <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                  <Key className="h-3 w-3" />
                  متاح: {formatNumber(analytics?.unusedCodes || 0)}
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
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(analytics?.totalUsers || 0)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <CheckCircle className="h-3 w-3" />
                نشط: {formatNumber(analytics?.activeUsers || 0)}
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
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(analytics?.activatedDevices || 0)}</p>
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
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(analytics?.totalBackups || 0)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
                <HardDrive className="h-3 w-3" />
                {formatFileSize(analytics?.totalBackupSize || 0)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Combined Analytics & Download Statistics Section */}
      {analyticsData && (
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">تحليلات التحديثات وإحصائيات التحميل</h3>
              <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">نظرة شاملة على أداء التحديثات والتحميلات</p>
            </div>
          </div>

          {/* Main Statistics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
            {/* Total Downloads */}
            <div className="group relative bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 sm:p-6 rounded-xl border border-blue-200 dark:border-blue-700 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Download className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400">إجمالي التحميلات</p>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-900 dark:text-blue-100">{formatNumber(analyticsData.overview.totalDownloads)}</p>
                </div>
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400">
                في آخر {analyticsData.period}
              </div>
            </div>

            {/* Unique IPs */}
            <div className="group relative bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 sm:p-6 rounded-xl border border-green-200 dark:border-green-700 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <Globe className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400">عنوان IP فريد</p>
                  <p className="text-2xl sm:text-3xl font-bold text-green-900 dark:text-green-100">{formatNumber(analyticsData.overview.uniqueIPs)}</p>
                </div>
              </div>
              <div className="text-xs text-green-600 dark:text-green-400">
                مستخدمين مختلفين
              </div>
            </div>

            {/* Unique Devices */}
            <div className="group relative bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 sm:p-6 rounded-xl border border-purple-200 dark:border-purple-700 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <Server className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-xs sm:text-sm font-medium text-purple-600 dark:text-purple-400">أجهزة فريدة</p>
                  <p className="text-2xl sm:text-3xl font-bold text-purple-900 dark:text-purple-100">{formatNumber(analyticsData.overview.uniqueDevices)}</p>
                </div>
              </div>
              <div className="text-xs text-purple-600 dark:text-purple-400">
                أجهزة مختلفة
              </div>
            </div>

            {/* Average Downloads/Day */}
            <div className="group relative bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-4 sm:p-6 rounded-xl border border-orange-200 dark:border-orange-700 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-xs sm:text-sm font-medium text-orange-600 dark:text-orange-400">متوسط التحميل/يوم</p>
                  <p className="text-2xl sm:text-3xl font-bold text-orange-900 dark:text-orange-100">{formatNumber(analyticsData.overview.averageDownloadsPerDay)}</p>
                </div>
              </div>
              <div className="text-xs text-orange-600 dark:text-orange-400">
                تحميل يومياً
              </div>
            </div>
          </div>

          {/* Platform Statistics */}
          {Object.keys(analyticsData.platformStats).length > 0 && (
            <div className="mb-6 sm:mb-8">
              <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">إحصائيات المنصات</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {Object.entries(analyticsData.platformStats).map(([platform, stats]) => (
                  <div key={platform} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border-l-4 border-green-500">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold text-gray-900 dark:text-white capitalize">{platform}</h5>
                      <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                        {formatNumber(stats.downloads)} تحميل
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex justify-between">
                        <span>IP فريد:</span>
                        <span>{formatNumber(stats.uniqueIPs)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>أجهزة فريدة:</span>
                        <span>{formatNumber(stats.uniqueDevices)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Version Statistics */}
          {Object.keys(analyticsData.versionStats).length > 0 && (
            <div className="mb-6 sm:mb-8">
              <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">إحصائيات الإصدارات</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {Object.entries(analyticsData.versionStats).map(([version, stats]) => (
                  <div key={version} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border-l-4 border-blue-500">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold text-gray-900 dark:text-white">الإصدار {version}</h5>
                      <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                        {formatNumber(stats.downloads)} تحميل
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex justify-between">
                        <span>IP فريد:</span>
                        <span>{formatNumber(stats.uniqueIPs)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>أجهزة فريدة:</span>
                        <span>{formatNumber(stats.uniqueDevices)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          {analyticsData.recentActivity.length > 0 && (
            <div className="mb-6 sm:mb-8">
              <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">آخر التحميلات</h4>
              <div className="space-y-2 max-h-48 sm:max-h-60 overflow-y-auto">
                {analyticsData.recentActivity.slice(0, 10).map((activity, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                    <Download className="h-5 w-5 text-blue-600" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 dark:text-white font-medium">
                        {activity.platform} v{activity.version}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {activity.ip} • {new Date(activity.date).toLocaleDateString('ar-EG')}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {activity.downloads} تحميل
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Browser Statistics */}
          {Object.keys(analyticsData.browserStats).length > 0 && (
            <div className="mb-6 sm:mb-8">
              <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">إحصائيات المتصفحات</h4>
              <div className="space-y-2 max-h-32 sm:max-h-40 overflow-y-auto">
                {Object.entries(analyticsData.browserStats)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([browser, count]) => (
                    <div key={browser} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-white font-medium truncate">
                          {browser.length > 50 ? browser.substring(0, 50) + '...' : browser}
                        </p>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                        {formatNumber(count)} تحميل
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Version Statistics */}
          {Object.keys(analyticsData.versionStats).length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">إحصائيات الإصدارات</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(analyticsData.versionStats).map(([version, stats]) => (
                  <div key={version} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border-l-4 border-blue-500">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold text-gray-900 dark:text-white">الإصدار {version}</h5>
                      <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                        {formatNumber(stats.downloads)} تحميل
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex justify-between">
                        <span>IP فريد:</span>
                        <span className="font-medium">{formatNumber(stats.uniqueIPs)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>أجهزة فريدة:</span>
                        <span className="font-medium">{formatNumber(stats.uniqueDevices)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Browser Statistics */}
          {Object.keys(analyticsData.browserStats).length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">إحصائيات المتصفحات</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {Object.entries(analyticsData.browserStats)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([browser, count]) => (
                    <div key={browser} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-white font-medium truncate">
                          {browser.length > 50 ? browser.substring(0, 50) + '...' : browser}
                        </p>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                        {formatNumber(count)} تحميل
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* System Overview */}
          <div className="border-t pt-4">
            <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3">نظرة عامة على النظام</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
              <div className="text-center p-2 sm:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatNumber(analyticsData.systemOverview.totalUpdates)}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">التحديثات</p>
              </div>
              <div className="text-center p-2 sm:p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatNumber(analyticsData.systemOverview.totalActivations)}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">التفعيلات</p>
              </div>
              <div className="text-center p-2 sm:p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <p className="text-lg sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {formatNumber(analyticsData.systemOverview.totalActivationCodes)}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">أكواد التفعيل</p>
              </div>
              <div className="text-center p-2 sm:p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <p className="text-lg sm:text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {formatNumber(analyticsData.systemOverview.usedActivationCodes)}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">مستخدمة</p>
              </div>
              <div className="text-center p-2 sm:p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-lg sm:text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatNumber(analyticsData.systemOverview.unusedActivationCodes)}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">متاحة</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-8 mb-6 sm:mb-8">
        {/* Downloads Time Series */}
        {timeSeriesData && (
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">تحليل التحميلات عبر الزمن</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData.timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke={getThemeColors().grid} opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  stroke={getThemeColors().text}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}
                />
                <YAxis stroke={getThemeColors().text} tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{
                    ...tooltipStyle,
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(10px)'
                  }}
                  labelStyle={tooltipLabelStyle}
                  itemStyle={tooltipItemStyle}
                  formatter={(value: any) => [formatNumber(value), 'التحميلات']}
                  labelFormatter={(label) => new Date(label).toLocaleDateString('ar-EG')}
                />
                <Line 
                  type="monotone" 
                  dataKey="downloads" 
                  stroke={getThemeColors().primary} 
                  strokeWidth={3}
                  dot={{ fill: getThemeColors().primary, strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 8, stroke: getThemeColors().primary, strokeWidth: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl">
              <div className="flex justify-between items-center text-sm">
                <span className="text-blue-600 dark:text-blue-400">
                  إجمالي التحميلات: <span className="font-bold">{formatNumber(timeSeriesData.summary.totalDownloads)}</span>
                </span>
                <span className="text-purple-600 dark:text-purple-400">
                  متوسط التحميل/فترة: <span className="font-bold">{formatNumber(timeSeriesData.summary.averageDownloadsPerPeriod)}</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Activation Codes by Type */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">توزيع الأكواد حسب النوع</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={Object.entries(analytics?.codesByType || {}).map(([type, count]) => ({
                  name: type,
                  value: count
                }))}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {Object.entries(analytics?.codesByType || {}).map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={tooltipStyle}
                labelStyle={tooltipLabelStyle}
                itemStyle={tooltipItemStyle}
                formatter={(value, name) => [
                  `${formatNumber(value as number)} كود`, 
                  `نوع: ${name}`
                ]}
                labelFormatter={(label) => `${label}`}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* User Activity Trend */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">نشاط المستخدمين (آخر 30 يوم)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analytics?.usersByDate || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => formatDate(value)}
                formatter={(value) => [formatNumber(value as number), 'مستخدمين']}
                contentStyle={tooltipStyle}
                labelStyle={tooltipLabelStyle}
                itemStyle={tooltipItemStyle}
              />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="#8884d8" 
                fill="#8884d8" 
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Platform Downloads Comparison */}
        {platformStats && (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <Server className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">مقارنة التحميلات حسب المنصة</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={platformStats.platformStats}>
                <CartesianGrid strokeDasharray="3 3" stroke={getThemeColors().grid} opacity={0.3} />
                <XAxis 
                  dataKey="platform" 
                  stroke={getThemeColors().text}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
                />
                <YAxis stroke={getThemeColors().text} tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{
                    ...tooltipStyle,
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(10px)'
                  }}
                  labelStyle={tooltipLabelStyle}
                  itemStyle={tooltipItemStyle}
                  formatter={(value: any) => [formatNumber(value), 'التحميلات']}
                />
                <Bar 
                  dataKey="totalDownloads" 
                  fill="url(#platformGradient)" 
                  radius={[8, 8, 0, 0]}
                />
                <defs>
                  <linearGradient id="platformGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
              <div className="flex justify-between items-center text-sm">
                <span className="text-green-600 dark:text-green-400">
                  أكثر منصة شعبية: <span className="font-bold">{platformStats.summary.mostPopularPlatform}</span>
                </span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  إجمالي التحميلات: <span className="font-bold">{formatNumber(platformStats.summary.totalDownloads)}</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Activations Trend */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">اتجاه التفعيلات (آخر 30 يوم)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics?.activationsByDate || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => formatDate(value)}
                formatter={(value) => [formatNumber(value as number), 'تفعيلات']}
                contentStyle={tooltipStyle}
                labelStyle={tooltipLabelStyle}
                itemStyle={tooltipItemStyle}
              />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#82ca9d" 
                strokeWidth={3}
                dot={{ fill: '#82ca9d' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Usage Statistics Bar Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">إحصائيات الاستخدام</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[
              { name: 'الأكواد المستخدمة', value: analytics?.usedCodes || 0, fill: '#8884d8' },
              { name: 'الأكواد المتاحة', value: analytics?.unusedCodes || 0, fill: '#82ca9d' },
              { name: 'المستخدمين النشطين', value: analytics?.activeUsers || 0, fill: '#ffc658' },
              { name: 'الأجهزة المفعلة', value: analytics?.activatedDevices || 0, fill: '#ff7300' }
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value) => [formatNumber(value as number), '']}
                contentStyle={tooltipStyle}
                labelStyle={tooltipLabelStyle}
                itemStyle={tooltipItemStyle}
              />
              <Bar dataKey="value" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* System Performance */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">أداء النظام</h3>
        <div className="space-y-4">
          {systemAnalytics && (
            <>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  <span className="text-gray-700 dark:text-gray-300">حمولة النظام</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {systemAnalytics.systemLoad || 0}%
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5 text-green-600" />
                  <span className="text-gray-700 dark:text-gray-300">إجمالي التخزين</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatFileSize(systemAnalytics.totalBackupStorage || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-purple-600" />
                  <span className="text-gray-700 dark:text-gray-300">متوسط حجم النسخة</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatFileSize(systemAnalytics.averageBackupSize || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <span className="text-gray-700 dark:text-gray-300">النشاط (24 ساعة)</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {systemAnalytics.recentBackups24h + systemAnalytics.recentActivations24h || 0}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Additional Dashboard Sections */}
      
      {/* Code Types Breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">تفصيل أنواع الأكواد</h3>
          <div className="space-y-3">
            {Object.entries(analytics?.codesByType || {}).map(([type, count], index) => {
              const percentage = analytics?.totalCodes ? ((count as number) / analytics.totalCodes * 100) : 0;
              return (
                <div key={type} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <span className="text-gray-700 dark:text-gray-300 font-medium">{type}</span>
                  </div>
                  <div className="text-left">
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatNumber(count as number)}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                      ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Device Types Analysis */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">تحليل أنواع الأجهزة</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={Object.entries(analytics?.devicesByType || {}).map(([type, count]) => ({
              name: type || 'غير محدد',
              value: count
            }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value) => [formatNumber(value as number), 'أجهزة']}
                contentStyle={tooltipStyle}
                labelStyle={tooltipLabelStyle}
                itemStyle={tooltipItemStyle}
              />
              <Bar dataKey="value" fill={getThemeColors().primary} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Locations and Backup Statistics */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">أهم المواقع الجغرافية</h3>
          <div className="space-y-3">
            {Object.entries(analytics?.usersByLocation || {})
              .sort(([,a], [,b]) => (b as number) - (a as number))
              .slice(0, 8)
              .map(([location, count]) => (
                <div key={location} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-blue-600" />
                    <span className="text-gray-700 dark:text-gray-300">{location || 'غير محدد'}</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatNumber(count as number)}
                  </span>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">إحصائيات النسخ الاحتياطية</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {formatNumber(analytics?.totalBackups || 0)}
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-400">إجمالي النسخ</div>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {formatFileSize(analytics?.totalBackupSize || 0)}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">إجمالي الحجم</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={analytics?.backupsByDate || []}>
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke={getThemeColors().secondary} 
                  strokeWidth={2}
                  dot={false}
                />
                <Tooltip 
                  labelFormatter={(value) => formatDate(value)}
                  formatter={(value) => [formatNumber(value as number), 'نسخ احتياطية']}
                  contentStyle={tooltipStyle}
                  labelStyle={tooltipLabelStyle}
                  itemStyle={tooltipItemStyle}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Security and Activity Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">الأمان والحماية</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-700 dark:text-green-300">أكواد صالحة</span>
              </div>
              <span className="font-semibold text-green-800 dark:text-green-200">
                {formatNumber(analytics?.validCodes || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <span className="text-red-700 dark:text-red-300">أكواد منتهية الصلاحية</span>
              </div>
              <span className="font-semibold text-red-800 dark:text-red-200">
                {formatNumber(analytics?.expiredCodes || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <span className="text-yellow-700 dark:text-yellow-300">تفعيلات مشبوهة</span>
              </div>
              <span className="font-semibold text-yellow-800 dark:text-yellow-200">
                {formatNumber(analytics?.suspiciousActivations || 0)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">النشاط اليومي</h3>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {formatNumber((analytics?.todayActivations || 0) + (analytics?.todayBackups || 0))}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">إجمالي العمليات اليوم</div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                <div className="font-semibold text-blue-700 dark:text-blue-300">
                  {formatNumber(analytics?.todayActivations || 0)}
                </div>
                <div className="text-blue-600 dark:text-blue-400">تفعيلات</div>
              </div>
              <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                <div className="font-semibold text-green-700 dark:text-green-300">
                  {formatNumber(analytics?.todayBackups || 0)}
                </div>
                <div className="text-green-600 dark:text-green-400">نسخ احتياطية</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">ملخص سريع</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">معدل التفعيل</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {analytics?.totalCodes ? ((analytics.usedCodes / analytics.totalCodes) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">متوسط التفعيل/يوم</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatNumber(Math.round((analytics?.usedCodes || 0) / 30))}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">أكثر نوع جهاز</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {Object.entries(analytics?.devicesByType || {})
                  .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'غير محدد'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">حالة النظام</span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-600 dark:text-green-400 font-semibold">نشط</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">آخر الأنشطة</h3>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {analytics?.recentActivities?.slice(0, 15).map((activity, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex-shrink-0">
                {activity.type === 'activation' && <Shield className="h-5 w-5 text-blue-600" />}
                {activity.type === 'backup' && <Database className="h-5 w-5 text-green-600" />}
                {activity.type === 'user' && <Users className="h-5 w-5 text-purple-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 dark:text-white font-medium">
                  {activity.description}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(activity.timestamp)}
                </p>
              </div>
              {activity.location && (
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <Globe className="h-3 w-3" />
                  {activity.location}
                </div>
              )}
            </div>
          )) || (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              لا توجد أنشطة حديثة
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;