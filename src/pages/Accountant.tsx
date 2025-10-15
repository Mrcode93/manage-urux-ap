import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  CalculatorIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  UserIcon,
  PhoneIcon,
  MapPinIcon,
  CreditCardIcon,
  BanknotesIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ClipboardDocumentListIcon,
  ReceiptPercentIcon
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import type { Sale, CreateSaleData, ExpenseSection, StandaloneExpense } from '../api/client';
import {
  getAllSales,
  createSale,
  updateSale,
  deleteSale,
  getSalesStats,
  exportSales,
  getAllExpenses,
  deleteExpense
} from '../api/client';
import Button from '../components/Button';
import Table, { type Column } from '../components/Table';
import ExpenseSectionsManager from '../components/ExpenseSectionsManager';
import ExpenseForm from '../components/ExpenseForm';
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
  const { data: salesData, isLoading, error } = useQuery({
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
    enabled: canReadCustomers
  });

  // Fetch sales statistics - Only for مدير عام (General Manager)
  const { data: statsData } = useQuery({
    queryKey: ['sales-stats', dateRange],
    queryFn: () => getSalesStats({
      start_date: dateRange.start,
      end_date: dateRange.end
    }),
    enabled: canReadCustomers() && isGeneralManager
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
    enabled: canReadCustomers() && isGeneralManager
  });

  // Process actual sales data for chart - using same logic as statistics cards
  // Only for مدير عام (General Manager)
  const salesChartData = useMemo(() => {
    // Return empty data if user is not General Manager
    if (!isGeneralManager) {
      return Array.from({ length: 10 }, (_, i) => ({
        week: `الأسبوع ${String(i + 1).padStart(2, '0')}`,
        sales: 0,
        revenue: 0,
        expenses: 0,
        comprehensiveProfit: 0
      }));
    }

    if (!salesData?.sales || salesData.sales.length === 0) {
      console.log('📊 Chart: No sales data available');
      // Return empty weeks for consistent display
      return Array.from({ length: 10 }, (_, i) => ({
        week: `الأسبوع ${String(i + 1).padStart(2, '0')}`,
        sales: 0,
        revenue: 0,
        expenses: 0,
        comprehensiveProfit: 0
      }));
    }

    console.log('📊 Chart: Processing sales data:', salesData.sales);
    console.log('📊 Chart: Stats data for comparison:', statsData?.statistics);

    // Create 10 weeks of data starting from 10 weeks ago
    const weeksData = [];
    const now = new Date();
    
    for (let i = 9; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7));
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      const weekSales = salesData.sales.filter(sale => {
        const saleDate = new Date(sale.created_at);
        return saleDate >= weekStart && saleDate <= weekEnd;
      });
      
      // Use same calculation logic as statistics cards
      const totalSales = weekSales.length; // Same as statsData.statistics.totalSales
      const totalRevenue = weekSales.reduce((sum, sale) => sum + sale.pricing.final_price, 0); // Same as statsData.statistics.totalRevenue
      
      // For expenses, use the same logic as statsData.statistics.totalBusinessExpenses
      // which includes both sales expenses and standalone expenses
      const salesExpenses = weekSales.reduce((sum, sale) => {
        return sum + (sale.expenses?.total_expenses || 0);
      }, 0);
      
      // Add standalone expenses for this week (if any)
      const weekStandaloneExpenses = expensesData?.expenses?.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= weekStart && expenseDate <= weekEnd;
      }).reduce((sum, expense) => sum + expense.amount, 0) || 0;
      
      const totalExpenses = salesExpenses + weekStandaloneExpenses;
      
      // Calculate comprehensive profit (revenue - total expenses)
      const comprehensiveProfit = totalRevenue - totalExpenses;
      
      weeksData.push({
        week: `الأسبوع ${String(i + 1).padStart(2, '0')}`,
        sales: totalSales,
        revenue: Math.round(totalRevenue),
        expenses: Math.round(totalExpenses),
        comprehensiveProfit: Math.round(comprehensiveProfit)
      });
      
      console.log(`📊 Chart: Week ${i + 1}`, {
        weekStart: weekStart.toISOString().split('T')[0],
        weekEnd: weekEnd.toISOString().split('T')[0],
        sales: totalSales,
        revenue: Math.round(totalRevenue),
        expenses: Math.round(totalExpenses),
        comprehensiveProfit: Math.round(comprehensiveProfit),
        salesExpenses: Math.round(salesExpenses),
        standaloneExpenses: Math.round(weekStandaloneExpenses),
        totalExpenses: Math.round(totalExpenses)
      });
    }
    
    console.log('📊 Chart: Final chart data:', weeksData);
    return weeksData;
  }, [salesData, statsData, expensesData, isGeneralManager]);


  // Extract all expenses from sales data
  const allExpenses = salesData?.sales?.flatMap((sale: Sale) => 
    sale.expenses?.sections?.map((expense: ExpenseSection) => ({
      ...expense,
      sale_id: sale.sale_id,
      sale_date: sale.created_at
    })) || []
  ) || [];

  // Debug logging
  console.log('🔍 Debug Info:');
  console.log('salesData:', salesData);
  console.log('salesData?.sales:', salesData?.sales);
  console.log('salesData?.sales?.length:', salesData?.sales?.length);
  console.log('allExpenses:', allExpenses);
  console.log('allExpenses.length:', allExpenses.length);
  console.log('isLoading:', isLoading);
  console.log('canReadCustomers:', canReadCustomers);
  console.log('error:', error);
  
  // Show error state if there's an API error
  if (error) {
    console.error('🚨 API Error Details:', error);
  }

  // Debug individual sales structure
  if (salesData?.sales) {
    console.log('📊 Individual Sales Debug:');
    salesData.sales.forEach((sale, index) => {
      console.log(`Sale ${index + 1}:`, {
        sale_id: sale.sale_id,
        has_expenses: !!sale.expenses,
        expenses_sections: sale.expenses?.sections?.length || 0,
        expenses_structure: sale.expenses
      });
    });
  }

  // Debug expenses tab
  if (activeTab === 'expenses') {
    console.log('🎯 Expenses Tab Debug:');
    console.log('activeTab:', activeTab);
    console.log('allExpenses in expenses tab:', allExpenses);
    console.log('allExpenses.length in expenses tab:', allExpenses.length);
  }

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
        color: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200', 
        icon: CheckCircleIcon, 
        text: 'نشط' 
      },
      completed: { 
        color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200', 
        icon: CheckCircleIcon, 
        text: 'مكتمل' 
      },
      cancelled: { 
        color: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200', 
        icon: XCircleIcon, 
        text: 'ملغي' 
      },
      refunded: { 
        color: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200', 
        icon: ExclamationTriangleIcon, 
        text: 'مسترد' 
      }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { 
        color: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200', 
        icon: ClockIcon, 
        text: 'في الانتظار' 
      },
      completed: { 
        color: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200', 
        icon: CheckCircleIcon, 
        text: 'مكتمل' 
      },
      failed: { 
        color: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200', 
        icon: XCircleIcon, 
        text: 'فشل' 
      },
      refunded: { 
        color: 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200', 
        icon: ExclamationTriangleIcon, 
        text: 'مسترد' 
      }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    );
  };

  // Table columns
  const columns: Column<Sale>[] = [
    {
      header: 'رقم العملية',
      accessorKey: 'sale_id',
      cell: ({ row }) => (
        <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">
          {row.original.sale_id}
        </span>
      )
    },
    {
      header: 'اسم العميل',
      accessorKey: 'customer_info.name',
      cell: ({ row }) => (
        <div className="flex items-center">
          <UserIcon className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
          <span className="font-medium text-gray-900 dark:text-white">{row.original.customer_info.name}</span>
        </div>
      )
    },
    {
      header: 'الهاتف',
      accessorKey: 'customer_info.phone',
      cell: ({ row }) => (
        <div className="flex items-center">
          <PhoneIcon className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
          <span className="text-gray-900 dark:text-white">{row.original.customer_info.phone}</span>
        </div>
      )
    },
    {
      header: 'كود المنتج',
      accessorKey: 'product_info.code',
      cell: ({ row }) => (
        <span className="font-mono text-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1 rounded border border-gray-200 dark:border-gray-600">
          {row.original.product_info.code}
        </span>
      )
    },
    {
      header: 'السعر',
      accessorKey: 'pricing.final_price',
      cell: ({ row }) => (
        <div className="flex items-center">
          <CurrencyDollarIcon className="w-4 h-4 mr-1 text-green-600 dark:text-green-400" />
          <span className="font-medium text-green-600 dark:text-green-400">
            {row.original.pricing.final_price.toFixed(2)} {row.original.pricing.currency}
          </span>
        </div>
      )
    },
    {
      header: 'الربح الصافي',
      accessorKey: 'profit.net_profit',
      cell: ({ row }) => (
        <span className={`font-medium ${row.original.profit.net_profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {row.original.profit.net_profit.toFixed(2)} {row.original.pricing.currency}
        </span>
      )
    },
    {
      header: 'الحالة',
      accessorKey: 'status',
      cell: ({ row }) => getStatusBadge(row.original.status)
    },
    {
      header: 'حالة الدفع',
      accessorKey: 'payment_info.payment_status',
      cell: ({ row }) => getPaymentStatusBadge(row.original.payment_info.payment_status)
    },
    {
      header: 'الإجراءات',
      accessorKey: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleView(row.original)}
            className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            title="عرض التفاصيل"
          >
            <EyeIcon className="w-4 h-4" />
          </button>
          {canWriteCustomers() && (
            <button
              onClick={() => handleEdit(row.original)}
              className="p-1 text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300"
              title="تعديل"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
          )}
          {canDeleteCustomers() && (
            <button
              onClick={() => handleDelete(row.original)}
              className="p-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
              title="حذف"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    }
  ];

  if (!canReadCustomers) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">غير مصرح لك</h3>
          <p className="text-gray-500">ليس لديك صلاحية لعرض صفحة المحاسبة</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center">
          <CalculatorIcon className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400 mr-2 sm:mr-3" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">المحاسبة</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">إدارة المبيعات والمصروفات والأرباح</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="flex gap-2">
            <Button
              onClick={() => handleExport('csv')}
              variant="secondary"
              size="sm"
              className="flex items-center flex-1 sm:flex-none"
            >
              <DocumentArrowDownIcon className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">تصدير CSV</span>
              <span className="sm:hidden">CSV</span>
            </Button>
            <Button
              onClick={() => handleExport('json')}
              variant="secondary"
              size="sm"
              className="flex items-center flex-1 sm:flex-none"
            >
              <DocumentArrowDownIcon className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">تصدير JSON</span>
              <span className="sm:hidden">JSON</span>
            </Button>
          </div>
          {canWriteCustomers() && (
            <Button
              onClick={() => {
                setIsCreating(true);
                setEditingSale(null);
                resetForm();
              }}
              className="flex items-center justify-center"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">إضافة عملية بيع</span>
              <span className="sm:hidden">إضافة بيع</span>
            </Button>
          )}
        </div>
      </div>

      {/* Sales Statistics Chart - Only for مدير عام (General Manager) */}
      {!isGeneralManager && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="text-center py-8">
            <ExclamationTriangleIcon className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">غير مصرح لك</h3>
            <p className="text-gray-500 dark:text-gray-400">إحصائيات المبيعات متاحة فقط لمدير عام</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">يجب أن تكون مدير عام لعرض البيانات المالية</p>
          </div>
        </div>
      )}
      
      {isGeneralManager && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg mr-3">
              <ChartBarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">إحصائيات المبيعات</h2>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">عدد المبيعات</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">الإيرادات</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">المصروفات</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">الربح الصافي</span>
              </div>
            </div>
            <select className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm w-full sm:w-auto">
              <option>هذا الشهر</option>
              <option>الشهر الماضي</option>
              <option>آخر 3 أشهر</option>
            </select>
          </div>
        </div>
        
        {salesChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
            <LineChart data={salesChartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }} className="sm:mx-5">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
              <XAxis 
                dataKey="week" 
                stroke="#6b7280"
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: '#6b7280' }}
              />
              <YAxis 
                stroke="#6b7280"
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: '#6b7280' }}
                domain={[0, 'dataMax + 1000']}
                tickCount={6}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                labelStyle={{ color: '#374151', fontWeight: 'bold' }}
                itemStyle={{ color: '#374151' }}
                formatter={(value, name) => {
                  const formattedName = name === 'sales' ? 'عدد المبيعات' : 
                                     name === 'revenue' ? 'الإيرادات' : 
                                     name === 'expenses' ? 'المصروفات' : 'الربح الصافي';
                  return [value, formattedName];
                }}
              />
              <Line 
                type="monotone" 
                dataKey="sales" 
                stroke="#8b5cf6" 
                strokeWidth={3}
                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2 }}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#10b981" 
                strokeWidth={3}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
              />
              <Line 
                type="monotone" 
                dataKey="expenses" 
                stroke="#ef4444" 
                strokeWidth={3}
                dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2 }}
              />
              <Line 
                type="monotone" 
                dataKey="comprehensiveProfit" 
                stroke="#f59e0b" 
                strokeWidth={3}
                dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#f59e0b', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <ChartBarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد بيانات مبيعات لعرضها</p>
              <p className="text-sm mt-2">ابدأ بإضافة عمليات بيع جديدة لرؤية الإحصائيات</p>
            </div>
          </div>
        )}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-8">
          <button
            onClick={() => setActiveTab('sales')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
              activeTab === 'sales'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <ReceiptPercentIcon className="w-5 h-5 mr-2" />
            المبيعات
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
              activeTab === 'expenses'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <ClipboardDocumentListIcon className="w-5 h-5 mr-2" />
            المصروفات
          </button>
        </nav>
      </div>

  

      {/* Tab Content */}
      {activeTab === 'sales' && (
        <>
          {/* Statistics Cards - Only for مدير عام (General Manager) */}
      {!isGeneralManager && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="text-center py-8">
            <ExclamationTriangleIcon className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">غير مصرح لك</h3>
            <p className="text-gray-500 dark:text-gray-400">الإحصائيات المالية متاحة فقط لمدير عام</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">يجب أن تكون مدير عام لعرض البيانات المالية</p>
          </div>
        </div>
      )}
      
      {isGeneralManager && statsData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <ChartBarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">عدد المبيعات</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{statsData.statistics.totalSales}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <CurrencyDollarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">إجمالي الإيرادات</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {statsData.statistics.totalRevenue.toFixed(2)} د.ع
                </p>
              </div>
            </div>
          </div>
       
          
          
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                <ChartBarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">إجمالي المصروفات</p>
                <p className="text-lg sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {statsData.statistics.totalBusinessExpenses?.toFixed(2) || '0.00'} د.ع
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
                <CurrencyDollarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">صافي الأرباح</p>
                <p className={`text-lg sm:text-2xl font-bold ${(statsData.statistics.comprehensiveProfit || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {statsData.statistics.comprehensiveProfit?.toFixed(2) || '0.00'} د.ع
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  هامش: {statsData.statistics.comprehensiveProfitMargin?.toFixed(1) || '0.0'}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">البحث</label>
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="البحث في العملاء أو الأكواد..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">حالة العملية</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">جميع الحالات</option>
              <option value="active">نشط</option>
              <option value="completed">مكتمل</option>
              <option value="cancelled">ملغي</option>
              <option value="refunded">مسترد</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">حالة الدفع</label>
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">جميع حالات الدفع</option>
              <option value="pending">في الانتظار</option>
              <option value="completed">مكتمل</option>
              <option value="failed">فشل</option>
              <option value="refunded">مسترد</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تاريخ البداية</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
        <div className="mt-4 flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تاريخ النهاية</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                setPaymentStatusFilter('');
                setDateRange({ start: '', end: '' });
                setCurrentPage(1);
              }}
              variant="secondary"
              size="sm"
              className="flex items-center w-full sm:w-auto"
            >
              <ArrowPathIcon className="w-4 h-4 mr-2" />
              إعادة تعيين
            </Button>
          </div>
        </div>
      </div>

          {/* Sales Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-x-auto">
            <Table
              data={salesData?.sales || []}
              columns={columns}
              isLoading={isLoading}
            />
          </div>
        </>
      )}

      {activeTab === 'expenses' && (
        <div className="space-y-6">
          {/* Expenses Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">إدارة المصروفات</h2>
              <p className="text-gray-600 dark:text-gray-400">إضافة وتتبع المصروفات العامة</p>
            </div>
            <Button
              onClick={() => {
                setEditingExpense(null);
                setIsExpenseFormOpen(true);
              }}
              className="flex items-center"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              إضافة مصروف
            </Button>
          </div>

          {/* Expenses Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                  <BanknotesIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">إجمالي المصروفات</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {statsData?.statistics?.totalStandaloneExpenses?.toFixed(2) || '0.00'} د.ع
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <ClipboardDocumentListIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">عدد المصروفات</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{statsData?.statistics?.standaloneExpensesCount || 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <ChartBarIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">متوسط المصروف</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {statsData?.statistics?.standaloneExpensesCount && statsData.statistics.standaloneExpensesCount > 0 
                      ? (statsData.statistics.totalStandaloneExpenses / statsData.statistics.standaloneExpensesCount).toFixed(2)
                      : '0.00'
                    } د.ع
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Expenses List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">قائمة المصروفات</h3>
              {!expensesData?.expenses || expensesData.expenses.length === 0 ? (
                <div className="text-center py-8">
                  <ClipboardDocumentListIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">لا توجد مصروفات مسجلة</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">اضغط على "إضافة مصروفات" لبدء إضافة المصروفات</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {expensesData?.expenses?.map((expense) => (
                    <div key={expense._id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900 dark:text-white">{expense.name}</h4>
                          <span className="text-lg font-bold text-red-600 dark:text-red-400">
                            {expense.amount.toFixed(2)} د.ع
                          </span>
                        </div>
                        {expense.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{expense.description}</p>
                        )}
                        <div className="flex items-center mt-2 space-x-4">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            رقم المصروف: {expense.expense_id}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            تاريخ: {new Date(expense.date).toLocaleDateString('ar-IQ')}
                          </span>
                        </div>
                        <div className="flex items-center mt-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            expense.category === 'marketing' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                            expense.category === 'development' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            expense.category === 'server_costs' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                            expense.category === 'support' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                          }`}>
                            {expense.category === 'marketing' ? 'تسويق' :
                             expense.category === 'development' ? 'تطوير' :
                             expense.category === 'server_costs' ? 'خوادم' :
                             expense.category === 'support' ? 'دعم' : 'أخرى'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => {
                            setEditingExpense(expense);
                            setIsExpenseFormOpen(true);
                          }}
                          className="p-1 text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300"
                          title="تعديل"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('هل أنت متأكد من حذف هذا المصروف؟')) {
                              deleteExpenseMutation.mutate(expense._id);
                            }
                          }}
                          className="p-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                          title="حذف"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingSale ? 'تعديل عملية البيع' : 'إضافة عملية بيع جديدة'}
              </h2>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setEditingSale(null);
                  resetForm();
                }}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">اسم العميل *</label>
                  <input
                    type="text"
                    value={formData.customer_info.name}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      customer_info: { ...prev.customer_info, name: e.target.value }
                    }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">رقم الهاتف *</label>
                  <input
                    type="tel"
                    value={formData.customer_info.phone}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      customer_info: { ...prev.customer_info, phone: e.target.value }
                    }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">العنوان *</label>
                  <input
                    type="text"
                    value={formData.customer_info.address}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      customer_info: { ...prev.customer_info, address: e.target.value }
                    }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={formData.customer_info.email}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      customer_info: { ...prev.customer_info, email: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Product Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">كود المنتج *</label>
                  <input
                    type="text"
                    value={formData.product_info.code}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      product_info: { ...prev.product_info, code: e.target.value }
                    }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نوع الكود *</label>
                  <select
                    value={formData.product_info.code_type}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      product_info: { ...prev.product_info, code_type: e.target.value as any }
                    }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="lifetime">مدى الحياة</option>
                    <option value="custom">مخصص</option>
                    <option value="custom-lifetime">مخصص مدى الحياة</option>
                    <option value="trial">تجريبي</option>
                    <option value="trial-7-days">تجريبي 7 أيام</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">مدة الأيام</label>
                  <input
                    type="number"
                    value={formData.product_info.duration_days}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      product_info: { ...prev.product_info, duration_days: parseInt(e.target.value) || 0 }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Pricing Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">السعر *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.pricing.price}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      pricing: { ...prev.pricing, price: parseFloat(e.target.value) || 0 }
                    }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">العملة</label>
                  <select
                    value={formData.pricing.currency}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      pricing: { ...prev.pricing, currency: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="SAR">SAR</option>
                    <option value="AED">AED</option>
                    <option value="EGP">EGP</option>
                    <option value="IQD">IQD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">الخصم (%)</label>
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Payment Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">طريقة الدفع *</label>
                  <select
                    value={formData.payment_info.payment_method}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      payment_info: { ...prev.payment_info, payment_method: e.target.value as any }
                    }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="cash">نقداً</option>
                    <option value="bank_transfer">تحويل بنكي</option>
                    <option value="credit_card">بطاقة ائتمان</option>
                    <option value="paypal">PayPal</option>
                    <option value="stripe">Stripe</option>
                    <option value="other">أخرى</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">حالة الدفع</label>
                  <select
                    value={formData.payment_info.payment_status}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      payment_info: { ...prev.payment_info, payment_status: e.target.value as any }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="pending">في الانتظار</option>
                    <option value="completed">مكتمل</option>
                    <option value="failed">فشل</option>
                    <option value="refunded">مسترد</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">معرف المعاملة</label>
                  <input
                    type="text"
                    value={formData.payment_info.transaction_id}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      payment_info: { ...prev.payment_info, transaction_id: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تاريخ الدفع</label>
                  <input
                    type="date"
                    value={formData.payment_info.payment_date}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      payment_info: { ...prev.payment_info, payment_date: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ملاحظات الدفع</label>
                <textarea
                  value={formData.payment_info.notes}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    payment_info: { ...prev.payment_info, notes: e.target.value }
                  }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>


              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">حالة العملية</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    status: e.target.value as any
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="active">نشط</option>
                  <option value="completed">مكتمل</option>
                  <option value="cancelled">ملغي</option>
                  <option value="refunded">مسترد</option>
                </select>
              </div>


              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:space-x-3 pt-6 border-t border-gray-200 dark:border-gray-600">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingSale(null);
                    resetForm();
                  }}
                  className="w-full sm:w-auto"
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  isLoading={createMutation.isPending || updateMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  {editingSale ? 'تحديث' : 'إنشاء'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Sale Modal */}
      {viewingSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">تفاصيل عملية البيع</h2>
              <button
                onClick={() => setViewingSale(null)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Customer Information */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">معلومات العميل</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <UserIcon className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
                    <span className="font-medium text-gray-900 dark:text-white">{viewingSale.customer_info.name}</span>
                  </div>
                  <div className="flex items-center">
                    <PhoneIcon className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
                    <span className="text-gray-900 dark:text-white">{viewingSale.customer_info.phone}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPinIcon className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
                    <span className="text-gray-900 dark:text-white">{viewingSale.customer_info.address}</span>
                  </div>
                  {viewingSale.customer_info.email && (
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{viewingSale.customer_info.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Product Information */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">معلومات المنتج</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">كود المنتج:</span>
                    <span className="font-mono text-sm bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-2 py-1 rounded ml-2">
                      {viewingSale.product_info.code}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">نوع الكود:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">{viewingSale.product_info.code_type}</span>
                  </div>
                  {viewingSale.product_info.duration_days && (
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">مدة الأيام:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">{viewingSale.product_info.duration_days}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Pricing Information */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">معلومات التسعير</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <CurrencyDollarIcon className="w-4 h-4 mr-2 text-green-600 dark:text-green-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">السعر الأصلي:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {viewingSale.pricing.price} {viewingSale.pricing.currency}
                    </span>
                  </div>
                  {viewingSale.pricing.discount > 0 && (
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">الخصم:</span>
                      <span className="ml-2 text-red-600 dark:text-red-400">{viewingSale.pricing.discount}%</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <CurrencyDollarIcon className="w-4 h-4 mr-2 text-green-600 dark:text-green-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">السعر النهائي:</span>
                    <span className="ml-2 font-bold text-green-600 dark:text-green-400">
                      {viewingSale.pricing.final_price} {viewingSale.pricing.currency}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">معلومات الدفع</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <CreditCardIcon className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">طريقة الدفع:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">{viewingSale.payment_info.payment_method}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">حالة الدفع:</span>
                    <span className="ml-2">{getPaymentStatusBadge(viewingSale.payment_info.payment_status)}</span>
                  </div>
                  {viewingSale.payment_info.transaction_id && (
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">معرف المعاملة:</span>
                      <span className="ml-2 font-mono text-sm text-gray-900 dark:text-white">{viewingSale.payment_info.transaction_id}</span>
                    </div>
                  )}
                  {viewingSale.payment_info.payment_date && (
                    <div className="flex items-center">
                      <CalendarIcon className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">تاريخ الدفع:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">{new Date(viewingSale.payment_info.payment_date).toLocaleDateString('ar-IQ')}</span>
                    </div>
                  )}
                  {viewingSale.payment_info.notes && (
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">ملاحظات:</span>
                      <p className="text-sm mt-1 text-gray-900 dark:text-white">{viewingSale.payment_info.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Expenses */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
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

              {/* Profit Information */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">معلومات الربح</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <CurrencyDollarIcon className="w-4 h-4 mr-2 text-green-600 dark:text-green-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">الربح الإجمالي:</span>
                    <span className="ml-2 font-medium text-green-600 dark:text-green-400">
                      {viewingSale.profit.gross_profit} {viewingSale.pricing.currency}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <CalculatorIcon className="w-4 h-4 mr-2 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">الربح الصافي:</span>
                    <span className={`ml-2 font-bold ${viewingSale.profit.net_profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {viewingSale.profit.net_profit} {viewingSale.pricing.currency}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">هامش الربح:</span>
                    <span className={`ml-2 font-medium ${viewingSale.profit.profit_margin >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {viewingSale.profit.profit_margin.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sale Status and Dates */}
            <div className="mt-6 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">معلومات إضافية</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">حالة العملية:</span>
                  <div className="mt-1">{getStatusBadge(viewingSale.status)}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">تاريخ الإنشاء:</span>
                  <div className="mt-1 text-gray-900 dark:text-white">{new Date(viewingSale.created_at).toLocaleDateString('ar-IQ')}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">آخر تحديث:</span>
                  <div className="mt-1 text-gray-900 dark:text-white">{new Date(viewingSale.updated_at).toLocaleDateString('ar-IQ')}</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:space-x-3 pt-6 border-t mt-6">
              <Button
                variant="secondary"
                onClick={() => setViewingSale(null)}
                className="w-full sm:w-auto"
              >
                إغلاق
              </Button>
              {canWriteCustomers() && (
                <Button
                  onClick={() => {
                    setViewingSale(null);
                    handleEdit(viewingSale);
                  }}
                  className="w-full sm:w-auto"
                >
                  تعديل
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

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
