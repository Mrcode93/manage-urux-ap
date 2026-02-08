import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  Calculator,
  Plus,
  Edit3,
  Trash2,
  Eye,
  BarChart3,
  User,
  Phone,
  MapPin,
  CreditCard,
  Banknote,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Search,
  RefreshCw,
  FileText,
  Percent,
  TrendingUp,
  TrendingDown,
  Filter,
  Package,
  Wallet,
  X
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import type { Sale, CreateSaleData, ExpenseSection, StandaloneExpense, App } from '../api/client';
import {
  getAllSales,
  createSale,
  updateSale,
  deleteSale,
  getSalesStats,
  exportSales,
  getAllExpenses,
  deleteExpense,
  getSalesChartData,
  getApps
} from '../api/client';
import ExpenseSectionsManager from '../components/ExpenseSectionsManager';
import ExpenseForm from '../components/ExpenseForm';
import Loader from '../components/Loader';
import { usePermissions } from '../hooks/usePermissions';

interface SaleFormData {
  customer_info: {
    name: string;
    phone: string;
    address: string;
    email: string;
  };
  product_info: {
    code: string;
    code_type: 'lifetime' | 'custom' | 'custom-lifetime' | 'trial' | 'trial-7-days';
    features: string[];
    duration_days: number;
  };
  app_id: string;
  pricing: {
    price: number;
    currency: string;
    discount: number;
  };
  payment_info: {
    payment_method: 'cash' | 'bank_transfer' | 'credit_card' | 'paypal' | 'stripe' | 'other';
    payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
    transaction_id: string;
    payment_date: string;
    notes: string;
  };
  status: 'active' | 'completed' | 'cancelled' | 'refunded';
}

const Accountant: React.FC = () => {
  const { canReadCustomers, canWriteCustomers, canDeleteCustomers, isSuperAdmin } = usePermissions();
  const queryClient = useQueryClient();

  // State management
  const [isCreating, setIsCreating] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<StandaloneExpense | null>(null);
  const [activeTab, setActiveTab] = useState<'sales' | 'expenses'>('sales');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // Check if user is مدير عام (General Manager) - only super_admin role
  const isGeneralManager = isSuperAdmin();


  // Form data
  const [formData, setFormData] = useState<SaleFormData>({
    customer_info: {
      name: '',
      phone: '',
      address: '',
      email: ''
    },
    product_info: {
      code: '',
      code_type: 'lifetime',
      features: [],
      duration_days: 0
    },
    app_id: '',
    pricing: {
      price: 0,
      currency: 'USD',
      discount: 0
    },
    payment_info: {
      payment_method: 'cash',
      payment_status: 'pending',
      transaction_id: '',
      payment_date: '',
      notes: ''
    },
    status: 'active'
  });

  // Fetch sales data
  const { data: salesData, isLoading } = useQuery({
    queryKey: ['sales', currentPage, pageSize, searchTerm, statusFilter, paymentStatusFilter, dateRange],
    queryFn: () => getAllSales({
      page: currentPage,
      limit: pageSize,
      search: searchTerm,
      status: statusFilter,
      payment_status: paymentStatusFilter,
      start_date: dateRange.start,
      end_date: dateRange.end,
      sort_by: 'created_at',
      sort_order: 'desc'
    }),
    enabled: canReadCustomers,
    staleTime: 2 * 60 * 1000, // 2 minutes - sales data is fresh for 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnMount: false // Don't refetch if data is fresh
  });

  // Fetch sales statistics - Only for مدير عام (General Manager)
  const { data: statsData } = useQuery({
    queryKey: ['sales-stats', dateRange],
    queryFn: () => getSalesStats({
      start_date: dateRange.start,
      end_date: dateRange.end
    }),
    enabled: canReadCustomers() && isGeneralManager,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    refetchOnMount: false
  });

  // Fetch standalone expenses - Only for مدير عام (General Manager)
  const { data: expensesData } = useQuery({
    queryKey: ['expenses', currentPage, pageSize, searchTerm, dateRange],
    queryFn: () => getAllExpenses({
      page: currentPage,
      limit: pageSize,
      search: searchTerm,
      start_date: dateRange.start,
      end_date: dateRange.end
    }),
    enabled: canReadCustomers() && isGeneralManager,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnMount: false
  });

  // Process actual sales data for chart - using same logic as statistics cards
  // Only for مدير عام (General Manager)
  // Fetch sales chart data - Only for مدير عام (General Manager)
  const { data: chartData } = useQuery({
    queryKey: ['sales-chart', dateRange],
    queryFn: () => getSalesChartData({
      start_date: dateRange.start,
      end_date: dateRange.end
    }),
    enabled: canReadCustomers() && isGeneralManager,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    refetchOnMount: false
  });

  // Fetch available apps for assignment
  const { data: appsData } = useQuery({
    queryKey: ['apps', 'active'],
    queryFn: () => getApps({ active: true }),
    staleTime: 10 * 60 * 1000, // 10 minutes - apps don't change often
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    refetchOnMount: false
  });

  const availableApps: App[] = appsData || [];
  // Ensure the currently edited sale's app remains selectable even if inactive
  const appOptions = useMemo(() => {
    const currentApp = editingSale?.app;
    if (currentApp && !availableApps.find(app => app._id === currentApp._id)) {
      return [...availableApps, currentApp];
    }
    return availableApps;
  }, [availableApps, editingSale]);

  const salesChartData = useMemo(() => {
    if (!isGeneralManager || !chartData?.data) {
      return Array.from({ length: 10 }, (_, i) => ({
        week: `الأسبوع ${String(i + 1).padStart(2, '0')}`,
        sales: 0,
        revenue: 0,
        expenses: 0,
        comprehensiveProfit: 0
      }));
    }
    return chartData.data;
  }, [chartData, isGeneralManager]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: createSale,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['sales-stats'] });
      toast.success('تم إنشاء عملية البيع بنجاح');
      setIsCreating(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'فشل في إنشاء عملية البيع');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateSaleData> }) => updateSale(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['sales-stats'] });
      toast.success('تم تحديث عملية البيع بنجاح');
      setEditingSale(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'فشل في تحديث عملية البيع');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSale,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['sales-stats'] });
      toast.success('تم حذف عملية البيع بنجاح');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'فشل في حذف عملية البيع');
    }
  });


  const deleteExpenseMutation = useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-stats'] });
      toast.success('تم حذف المصروف بنجاح');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'فشل في حذف المصروف');
    }
  });


  // Helper functions
  const resetForm = () => {
    setFormData({
      customer_info: {
        name: '',
        phone: '',
        address: '',
        email: ''
      },
      product_info: {
        code: '',
        code_type: 'lifetime',
        features: [],
        duration_days: 0
      },
      app_id: '',
      pricing: {
        price: 0,
        currency: 'USD',
        discount: 0
      },
      payment_info: {
        payment_method: 'cash',
        payment_status: 'pending',
        transaction_id: '',
        payment_date: '',
        notes: ''
      },
      status: 'active'
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingSale) {
      updateMutation.mutate({ id: editingSale._id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (sale: Sale) => {
    setEditingSale(sale);
    setFormData({
      customer_info: {
        name: sale.customer_info.name,
        phone: sale.customer_info.phone,
        address: sale.customer_info.address,
        email: sale.customer_info.email || ''
      },
      product_info: {
        code: sale.product_info.code,
        code_type: sale.product_info.code_type,
        features: sale.product_info.features,
        duration_days: sale.product_info.duration_days || 0
      },
      app_id: sale.app?._id || '',
      pricing: sale.pricing,
      payment_info: {
        payment_method: sale.payment_info.payment_method,
        payment_status: sale.payment_info.payment_status,
        transaction_id: sale.payment_info.transaction_id || '',
        payment_date: sale.payment_info.payment_date || '',
        notes: sale.payment_info.notes || ''
      },
      status: sale.status
    });
    setIsCreating(true);
  };

  const handleDelete = (sale: Sale) => {
    if (window.confirm('هل أنت متأكد من حذف عملية البيع هذه؟')) {
      deleteMutation.mutate(sale._id);
    }
  };

  const handleView = (sale: Sale) => {
    setViewingSale(sale);
  };

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const data = await exportSales({
        format,
        start_date: dateRange.start,
        end_date: dateRange.end
      });

      if (format === 'csv' && data instanceof Blob) {
        const url = window.URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = url;
        const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        link.download = `sales-${currentDate}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        const jsonData = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        link.download = `sales-${currentDate}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }

      toast.success('تم تصدير البيانات بنجاح');
    } catch (error: any) {
      toast.error('فشل في تصدير البيانات');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: {
        color: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600',
        icon: CheckCircle2,
        text: 'نشط'
      },
      completed: {
        color: 'bg-blue-100 dark:bg-blue-500/10 text-blue-600',
        icon: CheckCircle2,
        text: 'مكتمل'
      },
      cancelled: {
        color: 'bg-rose-100 dark:bg-rose-500/10 text-rose-600',
        icon: XCircle,
        text: 'ملغي'
      },
      refunded: {
        color: 'bg-amber-100 dark:bg-amber-500/10 text-amber-600',
        icon: AlertTriangle,
        text: 'مسترد'
      }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig = {
      pending: {
        color: 'bg-amber-100 dark:bg-amber-500/10 text-amber-600',
        icon: Clock,
        text: 'في الانتظار'
      },
      completed: {
        color: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600',
        icon: CheckCircle2,
        text: 'مكتمل'
      },
      failed: {
        color: 'bg-rose-100 dark:bg-rose-500/10 text-rose-600',
        icon: XCircle,
        text: 'فشل'
      },
      refunded: {
        color: 'bg-purple-100 dark:bg-purple-500/10 text-purple-600',
        icon: AlertTriangle,
        text: 'مسترد'
      }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    );
  };

  // Column definitions removed as we are using a custom inline table for sales

  if (isLoading) {
    return <Loader message="جاري تحميل بيانات المبيعات والمصروفات..." />;
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Premium Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="flex items-center gap-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-600 shadow-xl shadow-blue-500/10"
          >
            <Calculator className="w-8 h-8" />
          </motion.div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white italic tracking-tight">المحاسبة <span className="text-blue-600">المالية</span></h1>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em] mt-1">إدارة المبيعات والمصروفات والأرباح الذكية</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex p-1 bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5">
            <button
              onClick={() => handleExport('csv')}
              className="px-4 py-2 text-[10px] font-black uppercase text-slate-500 hover:text-blue-600 transition-colors"
            >
              CSV
            </button>
            <div className="w-px h-4 bg-slate-200 dark:bg-white/10 self-center mx-1"></div>
            <button
              onClick={() => handleExport('json')}
              className="px-4 py-2 text-[10px] font-black uppercase text-slate-500 hover:text-blue-600 transition-colors"
            >
              JSON
            </button>
          </div>

          {canWriteCustomers() && (
            <button
              onClick={() => {
                setIsCreating(true);
                setEditingSale(null);
                resetForm();
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              إضافة عملية بيع
            </button>
          )}
        </div>
      </div>

      {/* Analytics & Performance */}
      {isGeneralManager && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Main Chart Card */}
          <div className="lg:col-span-2 glass-card p-8 border-slate-200/50 dark:border-white/10 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[60px] rounded-full pointer-events-none"></div>

            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600/10 rounded-xl text-blue-600">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white italic">تحليل <span className="text-blue-600">الأداء</span></h2>
              </div>

              <div className="flex items-center gap-2">
                {['sales', 'revenue', 'expenses', 'comprehensiveProfit'].map((key) => {
                  const colors = {
                    sales: 'bg-purple-500',
                    revenue: 'bg-emerald-500',
                    expenses: 'bg-rose-500',
                    comprehensiveProfit: 'bg-blue-500'
                  };
                  const labels = {
                    sales: 'مبيعات',
                    revenue: 'إيرادات',
                    expenses: 'مصاريف',
                    comprehensiveProfit: 'أرباح'
                  };
                  return (
                    <div key={key} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-white/5 rounded-full border border-slate-200 dark:border-white/5">
                      <div className={`w-1.5 h-1.5 rounded-full ${colors[key as keyof typeof colors]}`}></div>
                      <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase">{labels[key as keyof typeof labels]}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="h-[300px] w-full mt-4">
              {salesChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesChartData}>
                    <defs>
                      <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-white/5" />
                    <XAxis
                      dataKey="week"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: 'none',
                        borderRadius: '16px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                      }}
                      itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                      labelStyle={{ color: '#94a3b8', fontSize: '10px', marginBottom: '8px', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="comprehensiveProfit" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorProfit)" />
                    <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                    <p className="text-sm font-black text-slate-400 italic">لا توجد بيانات متاحة حالياً</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Side Info / Summary */}
          <div className="space-y-4">
            <div className="glass-card p-6 border-blue-500/20 bg-blue-500/5 h-full flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-black text-blue-500 uppercase tracking-widest mb-4">ملخص الأداء الشهري</h3>
                <div className="space-y-6">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">صافي الأرباح</span>
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-black text-slate-900 dark:text-white italic">
                        {statsData?.statistics.comprehensiveProfit.toLocaleString()}
                        <span className="text-sm ml-1">د.ع</span>
                      </span>
                      <div className="flex items-center text-emerald-500 text-[10px] font-black mb-1">
                        <TrendingUp className="w-3 h-3" />
                        +{statsData?.statistics.comprehensiveProfitMargin.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5">
                      <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">الإيرادات</span>
                      <span className="text-sm font-black text-emerald-600">{statsData?.statistics.totalRevenue.toLocaleString()}</span>
                    </div>
                    <div className="p-4 bg-white/50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5">
                      <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">المصاريف</span>
                      <span className="text-sm font-black text-rose-500">{statsData?.statistics.totalBusinessExpenses.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-blue-500/10">
                <p className="text-[10px] font-black text-slate-500 uppercase leading-relaxed">
                  يتم حساب الأرباح بناءً على إجمالي المبيعات مخصوماً منها التكاليف التشغيلية والمصاريف العامة.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tabs System */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-white/5 rounded-2xl w-fit border border-slate-200 dark:border-white/5">
        <button
          onClick={() => setActiveTab('sales')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'sales'
            ? 'bg-white dark:bg-white/10 text-blue-600 shadow-sm'
            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
        >
          <Percent className="w-4 h-4" />
          المبيعات
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'expenses'
            ? 'bg-white dark:bg-white/10 text-blue-600 shadow-sm'
            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
        >
          <FileText className="w-4 h-4" />
          المصروفات العامة
        </button>
      </div>



      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'sales' ? (
          <motion.div
            key="sales-tab"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* Sales Filters */}
            <div className="glass-card p-6 border-slate-200/50 dark:border-white/10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">بحث سريع</label>
                  <div className="relative group">
                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="اسم العميل، الهاتف، الكود..."
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3 pl-11 pr-4 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">الحالة</label>
                  <div className="relative group">
                    <Filter className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3 pl-11 pr-4 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="">جميع الحالات</option>
                      <option value="active">نشط</option>
                      <option value="completed">مكتمل</option>
                      <option value="cancelled">ملغي</option>
                      <option value="refunded">مسترد</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">تاريخ البداية</label>
                  <div className="relative group">
                    <Calendar className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3 pl-11 pr-4 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">تاريخ النهاية</label>
                  <div className="flex gap-2">
                    <div className="relative group flex-1">
                      <Calendar className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3 pl-11 pr-4 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                      />
                    </div>
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('');
                        setPaymentStatusFilter('');
                        setDateRange({ start: '', end: '' });
                        setCurrentPage(1);
                      }}
                      className="p-3 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 hover:text-blue-600 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sales Table */}
            <div className="glass-card border-slate-200/50 dark:border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/50 dark:border-white/5">
                      <th className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">العميل</th>
                      <th className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">التطبيق</th>
                      <th className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">القيمة</th>
                      <th className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">الحالة</th>
                      <th className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">التحصيل</th>
                      <th className="px-6 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/50 dark:divide-white/5">
                    {salesData?.sales.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-bold italic">لا توجد عمليات بيع مطابقة للبحث</td>
                      </tr>
                    ) : (
                      salesData?.sales.map((sale, index) => (
                        <motion.tr
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          key={sale._id}
                          className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-600">
                                <User className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-sm font-black text-slate-900 dark:text-white leading-tight">{sale.customer_info.name}</p>
                                <p className="text-[10px] font-bold text-slate-500">{sale.customer_info.phone}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-black text-slate-600 dark:text-slate-300">
                              {sale.app?.name || '---'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 font-black">
                              <span className="text-sm text-emerald-600">{sale.pricing.final_price.toLocaleString()}</span>
                              <span className="text-[10px] text-slate-400 uppercase">{sale.pricing.currency}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {getStatusBadge(sale.status)}
                          </td>
                          <td className="px-6 py-4">
                            {getPaymentStatusBadge(sale.payment_info.payment_status)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleView(sale)}
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-600/10 rounded-lg transition-all"
                                title="عرض"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {canWriteCustomers() && (
                                <button
                                  onClick={() => handleEdit(sale)}
                                  className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-600/10 rounded-lg transition-all"
                                  title="تعديل"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                              )}
                              {canDeleteCustomers() && (
                                <button
                                  onClick={() => handleDelete(sale)}
                                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-600/10 rounded-lg transition-all"
                                  title="حذف"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="expenses-tab"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Expenses Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'إجمالي المصروفات', value: statsData?.statistics?.totalStandaloneExpenses, icon: Banknote, color: 'text-rose-600', bg: 'bg-rose-500/10' },
                { label: 'عدد العمليات', value: statsData?.statistics?.standaloneExpensesCount, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-500/10' },
                {
                  label: 'متوسط المصروف',
                  value: (statsData?.statistics?.standaloneExpensesCount || 0) > 0
                    ? (statsData?.statistics?.totalStandaloneExpenses || 0) / (statsData?.statistics?.standaloneExpensesCount || 1)
                    : 0,
                  icon: TrendingDown,
                  color: 'text-amber-600',
                  bg: 'bg-amber-500/10'
                }
              ].map((stat, idx) => (
                <div key={idx} className="glass-card p-6 border-slate-200/50 dark:border-white/10 flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-2">{stat.label}</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white italic">
                      {typeof stat.value === 'number' ? stat.value.toLocaleString() : '0'}
                      <span className="text-[10px] ml-1 not-italic font-bold opacity-50">د.ع</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Expenses List */}
            <div className="glass-card border-slate-200/50 dark:border-white/10 overflow-hidden">
              <div className="p-6 border-b border-slate-200/50 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-600/10 rounded-xl text-rose-600">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white italic">قائمة <span className="text-rose-600">المصروفات</span></h3>
                </div>
                {canWriteCustomers() && (
                  <button
                    onClick={() => {
                      setEditingExpense(null);
                      setIsExpenseFormOpen(true);
                    }}
                    className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/20 hover:scale-110 active:scale-95 transition-all"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="divide-y divide-slate-200/50 dark:divide-white/5">
                {!expensesData?.expenses || expensesData.expenses.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                      <FileText className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-black text-slate-400 italic">لا توجد مصروفات مسجلة حالياً</p>
                  </div>
                ) : (
                  expensesData.expenses.map((expense, index) => (
                    <motion.div
                      key={expense._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-6 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 flex items-center justify-center shadow-sm">
                          <Banknote className="w-6 h-6 text-rose-500" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight">{expense.name}</h4>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(expense.date).toLocaleDateString('ar-IQ')}
                            </span>
                            <span className="w-1 h-1 bg-slate-200 dark:bg-white/10 rounded-full"></span>
                            <span className="text-[10px] font-black text-blue-500 uppercase px-2 py-0.5 bg-blue-500/10 rounded-full">
                              {expense.category}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-left">
                          <p className="text-lg font-black text-rose-600 italic">-{expense.amount.toLocaleString()}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase text-right">د.ع</p>
                        </div>

                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setEditingExpense(expense);
                              setIsExpenseFormOpen(true);
                            }}
                            className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-all"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('هل أنت متأكد من حذف هذا المصروف؟')) {
                                deleteExpenseMutation.mutate(expense._id);
                              }
                            }}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-600/10 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsCreating(false);
                setEditingSale(null);
                resetForm();
              }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/50 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-8 border-b border-slate-200/50 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white italic">
                    {editingSale ? 'تعديل' : 'إضافة'} <span className="text-blue-600">عملية بيع</span>
                  </h2>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                    {editingSale ? 'تحديث بيانات العملية الحالية' : 'تسجيل عملية بيع جديدة في النظام'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setEditingSale(null);
                    resetForm();
                  }}
                  className="p-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-400 hover:text-rose-500 hover:border-rose-500/50 transition-all shadow-sm"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto">
                {/* Customer Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">معلومات العميل</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-right" dir="rtl">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">اسم العميل *</label>
                      <input
                        type="text"
                        value={formData.customer_info.name}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          customer_info: { ...prev.customer_info, name: e.target.value }
                        }))}
                        required
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                        placeholder="أدخل اسم العميل بالكامل"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">رقم الهاتف *</label>
                      <input
                        type="tel"
                        value={formData.customer_info.phone}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          customer_info: { ...prev.customer_info, phone: e.target.value }
                        }))}
                        required
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                        placeholder="07XXXXXXXX"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">العنوان *</label>
                      <input
                        type="text"
                        value={formData.customer_info.address}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          customer_info: { ...prev.customer_info, address: e.target.value }
                        }))}
                        required
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                        placeholder="بغداد - الكرادة"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">البريد الإلكتروني</label>
                      <input
                        type="email"
                        value={formData.customer_info.email || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          customer_info: { ...prev.customer_info, email: e.target.value }
                        }))}
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                        placeholder="example@mail.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Product Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">تفاصيل المنتج والتطبيق</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-right" dir="rtl">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">التطبيق</label>
                      <select
                        value={formData.app_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, app_id: e.target.value }))}
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all appearance-none"
                      >
                        <option value="">اختر التطبيق (اختياري)</option>
                        {appOptions.map((app) => (
                          <option key={app._id} value={app._id}>{app.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">كود المنتج *</label>
                      <input
                        type="text"
                        value={formData.product_info.code}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          product_info: { ...prev.product_info, code: e.target.value }
                        }))}
                        required
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                        placeholder="أدخل كود التفعيل"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">نوع الكود *</label>
                      <select
                        value={formData.product_info.code_type}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          product_info: { ...prev.product_info, code_type: e.target.value as any }
                        }))}
                        required
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all appearance-none"
                      >
                        <option value="lifetime">مدى الحياة</option>
                        <option value="custom">مخصص</option>
                        <option value="custom-lifetime">مخصص مدى الحياة</option>
                        <option value="trial">تجريبي</option>
                        <option value="trial-7-days">تجريبي 7 أيام</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">مدة الأيام</label>
                      <input
                        type="number"
                        value={formData.product_info.duration_days}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          product_info: { ...prev.product_info, duration_days: parseInt(e.target.value) || 0 }
                        }))}
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Pricing & Payment Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  {/* Left Column: Pricing */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Wallet className="w-4 h-4 text-emerald-600" />
                      <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">التسعير والخصومات</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-6 text-right" dir="rtl">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">السعر *</label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            value={formData.pricing.price}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              pricing: { ...prev.pricing, price: parseFloat(e.target.value) || 0 }
                            }))}
                            required
                            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                          />
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex gap-2">
                            <select
                              value={formData.pricing.currency}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                pricing: { ...prev.pricing, currency: e.target.value }
                              }))}
                              className="bg-transparent border-none text-[10px] font-black text-slate-400 outline-none appearance-none"
                            >
                              <option value="IQD">IQD</option>
                              <option value="USD">USD</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">الخصم (%)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={formData.pricing.discount}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            pricing: { ...prev.pricing, discount: parseFloat(e.target.value) || 0 }
                          }))}
                          className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Payment */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="w-4 h-4 text-amber-600" />
                      <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">معلومات الدفع</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-6 text-right" dir="rtl">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">طريقة الدفع *</label>
                        <select
                          value={formData.payment_info.payment_method}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            payment_info: { ...prev.payment_info, payment_method: e.target.value as any }
                          }))}
                          required
                          className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all appearance-none"
                        >
                          <option value="cash">نقداً</option>
                          <option value="bank_transfer">تحويل بنكي</option>
                          <option value="credit_card">بطاقة ائتمان</option>
                          <option value="paypal">PayPal</option>
                          <option value="stripe">Stripe</option>
                          <option value="other">أخرى</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">حالة الدفع</label>
                        <select
                          value={formData.payment_info.payment_status}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            payment_info: { ...prev.payment_info, payment_status: e.target.value as any }
                          }))}
                          className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all appearance-none"
                        >
                          <option value="pending">في الانتظار</option>
                          <option value="completed">مكتمل</option>
                          <option value="failed">فشل</option>
                          <option value="refunded">مسترد</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-right" dir="rtl">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">حالة العملية</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all appearance-none"
                      >
                        <option value="active">نشط</option>
                        <option value="completed">مكتمل</option>
                        <option value="cancelled">ملغي</option>
                        <option value="refunded">مسترد</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">معرف المعاملة</label>
                      <input
                        type="text"
                        value={formData.payment_info.transaction_id || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          payment_info: { ...prev.payment_info, transaction_id: e.target.value }
                        }))}
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 text-right" dir="rtl">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">ملاحظات الدفع</label>
                    <textarea
                      value={formData.payment_info.notes || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        payment_info: { ...prev.payment_info, notes: e.target.value }
                      }))}
                      rows={3}
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                      placeholder="أية ملاحظات إضافية حول عملية الدفع..."
                    />
                  </div>
                </div>

                {/* Form Footer */}
                <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-white/5">
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1 bg-blue-600 text-white rounded-2xl py-4 text-sm font-black shadow-lg shadow-blue-500/25 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none italic"
                  >
                    {createMutation.isPending || updateMutation.isPending ? 'جاري الحفظ...' :
                      editingSale ? 'تحديث العملية' : 'تأكيد العملية'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreating(false);
                      setEditingSale(null);
                      resetForm();
                    }}
                    className="px-8 py-4 bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 rounded-2xl text-sm font-black hover:bg-slate-200 dark:hover:bg-white/20 transition-all font-black italic"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Sale Modal */}
      <AnimatePresence>
        {viewingSale && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingSale(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/50 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-8 border-b border-slate-200/50 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-600">
                    <Eye className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white italic">تفاصيل <span className="text-blue-600">العملية</span></h2>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">عرض كامل لبيانات عملية البيع والتحصيل</p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingSale(null)}
                  className="p-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-400 hover:text-rose-500 hover:border-rose-500/50 transition-all shadow-sm"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 space-y-8 overflow-y-auto">
                {/* Quick Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="glass-card p-4 border-slate-200/50 dark:border-white/10">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">القيمة الإجمالية</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white italic">
                      {viewingSale.pricing.final_price.toLocaleString()}
                      <span className="text-[10px] ml-1 not-italic opacity-50 uppercase">{viewingSale.pricing.currency}</span>
                    </p>
                  </div>
                  <div className="glass-card p-4 border-slate-200/50 dark:border-white/10">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">صافي الربح</p>
                    <p className={`text-xl font-black italic ${viewingSale.profit.net_profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {viewingSale.profit.net_profit.toLocaleString()}
                      <span className="text-[10px] ml-1 not-italic opacity-50 uppercase">{viewingSale.pricing.currency}</span>
                    </p>
                  </div>
                  <div className="glass-card p-4 border-slate-200/50 dark:border-white/10">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">حالة الدفع</p>
                    <div>{getPaymentStatusBadge(viewingSale.payment_info.payment_status)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left Column: Client & Product */}
                  <div className="space-y-8">
                    {/* Client Info */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-600" />
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">بيانات العميل</h3>
                      </div>
                      <div className="glass-card p-6 border-slate-200/50 dark:border-white/10 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-400">الاسم</span>
                          <span className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                            {viewingSale.customer_info.name}
                            <User className="w-3 h-3 text-blue-500/50" />
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-400">الهاتف</span>
                          <span className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                            {viewingSale.customer_info.phone}
                            <Phone className="w-3 h-3 text-blue-500/50" />
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-400">العنوان</span>
                          <span className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                            {viewingSale.customer_info.address}
                            <MapPin className="w-3 h-3 text-blue-500/50" />
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-indigo-600" />
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">بيانات المنتج</h3>
                      </div>
                      <div className="glass-card p-6 border-slate-200/50 dark:border-white/10 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-400">التطبيق</span>
                          <span className="text-sm font-black text-blue-600">{viewingSale.app?.name || '---'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-400">كود التفعيل</span>
                          <span className="text-xs font-black bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-lg border border-slate-200 dark:border-white/10 font-mono">{viewingSale.product_info.code}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-400">النوع</span>
                          <span className="text-sm font-black text-slate-900 dark:text-white uppercase">{viewingSale.product_info.code_type}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Payment & Profit */}
                  <div className="space-y-8">
                    {/* Financial Details */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-emerald-600" />
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">التفاصيل المالية</h3>
                      </div>
                      <div className="glass-card p-6 border-slate-200/50 dark:border-white/10 space-y-4 bg-emerald-500/[0.02]">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-400">السعر الأصلي</span>
                          <span className="text-sm font-black text-slate-900 dark:text-white">
                            {viewingSale.pricing.price.toLocaleString()} {viewingSale.pricing.currency}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-400">الخصم</span>
                          <span className="text-sm font-black text-rose-500">%{viewingSale.pricing.discount}</span>
                        </div>
                        <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
                          <span className="text-xs font-black uppercase text-slate-900 dark:text-white">السعر النهائي</span>
                          <span className="text-lg font-black text-emerald-600 italic">
                            {viewingSale.pricing.final_price.toLocaleString()} {viewingSale.pricing.currency}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Payment Info */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-amber-600" />
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">معلومات التحصيل</h3>
                      </div>
                      <div className="glass-card p-6 border-slate-200/50 dark:border-white/10 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-400">الطريقة</span>
                          <span className="text-sm font-black text-slate-900 dark:text-white uppercase">{viewingSale.payment_info.payment_method}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-400">التاريخ</span>
                          <span className="text-sm font-black text-slate-900 dark:text-white">
                            {viewingSale.payment_info.payment_date ? new Date(viewingSale.payment_info.payment_date).toLocaleDateString('ar-IQ') : '---'}
                          </span>
                        </div>
                        {viewingSale.payment_info.transaction_id && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-400">معرف المعاملة</span>
                            <span className="text-[10px] font-black text-slate-500 font-mono tracking-tighter">{viewingSale.payment_info.transaction_id}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expenses Manager Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-rose-600" />
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">إدارة المصاريف التشغيلية</h3>
                  </div>
                  <div className="glass-card border-slate-200/50 dark:border-white/10 overflow-hidden">
                    <ExpenseSectionsManager
                      saleId={viewingSale._id}
                      expenses={viewingSale.expenses.sections}
                      currency={viewingSale.pricing.currency}
                      onExpensesUpdate={(expenses) => {
                        setViewingSale(prev => prev ? {
                          ...prev,
                          expenses: {
                            ...prev.expenses,
                            sections: expenses as ExpenseSection[],
                            total_expenses: expenses.reduce((sum, expense) => sum + expense.amount, 0)
                          }
                        } : null);
                      }}
                    />
                  </div>
                </div>

                {/* Footer Info */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t border-slate-200 dark:border-white/5">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">حالة العملية</p>
                    <div>{getStatusBadge(viewingSale.status)}</div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">تاريخ الإنشاء</p>
                    <p className="text-xs font-black text-slate-900 dark:text-white">{new Date(viewingSale.created_at).toLocaleString('ar-IQ')}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">آخر تحديث</p>
                    <p className="text-xs font-black text-slate-900 dark:text-white">{new Date(viewingSale.updated_at).toLocaleString('ar-IQ')}</p>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="pt-6 flex gap-3">
                  <button
                    onClick={() => setViewingSale(null)}
                    className="flex-1 px-8 py-4 bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 rounded-2xl text-sm font-black hover:bg-slate-200 dark:hover:bg-white/20 transition-all font-black italic"
                  >
                    إغلاق العرض
                  </button>
                  {canWriteCustomers() && (
                    <button
                      onClick={() => {
                        handleEdit(viewingSale);
                        setViewingSale(null);
                      }}
                      className="px-8 py-4 bg-blue-600 text-white rounded-2xl text-sm font-black shadow-lg shadow-blue-500/25 hover:bg-blue-700 active:scale-95 transition-all font-black italic"
                    >
                      تعديل البيانات
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Expense Form Modal */}
      {isExpenseFormOpen && (
        <ExpenseForm
          expense={editingExpense || undefined}
          onClose={() => {
            setIsExpenseFormOpen(false);
            setEditingExpense(null);
          }}
          onSuccess={() => {
            // Data will be refreshed automatically by the mutation
          }}
        />
      )}
    </div>
  );
};

export default Accountant;
