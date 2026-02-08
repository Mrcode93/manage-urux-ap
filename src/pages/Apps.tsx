import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import type { App, CreateAppData, UpdateAppData } from '../api/client';
import { getApps, createApp, updateApp, deleteApp, uploadAppIcon } from '../api/client';
import Button from '../components/Button';
import Skeleton from '../components/Skeleton';
import Table, { type Column } from '../components/Table';
import { toast } from 'react-hot-toast';
import {
  AppsReadGuard,
  AppsWriteGuard,
  AppsDeleteGuard
} from '../components/PermissionGuard';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Smartphone,
  CheckCircle,
  XCircle,
  Upload,
  Layers,
  Calendar
} from 'lucide-react';

interface AppModalProps {
  isOpen: boolean;
  onClose: () => void;
  app?: App | null;
  onSave: (data: CreateAppData | UpdateAppData) => void;
  isLoading: boolean;
}

function AppModal({ isOpen, onClose, app, onSave, isLoading }: AppModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
    is_active: true
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    if (app) {
      setFormData({
        name: app.name,
        description: app.description,
        icon: app.icon,
        is_active: app.is_active
      });
      setPreviewUrl(app.icon);
    } else {
      setFormData({
        name: '',
        description: '',
        icon: '',
        is_active: true
      });
      setPreviewUrl('');
    }
    setSelectedFile(null);
  }, [app, isOpen]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('نوع الملف غير مدعوم. يرجى اختيار صورة (JPEG, PNG, GIF, WebP, SVG)');
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت');
        return;
      }

      setSelectedFile(file);

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const result = await uploadAppIcon(selectedFile, app?._id, formData.name);
      setFormData(prev => ({
        ...prev,
        icon: result.data.url
      }));
      toast.success('تم رفع الأيقونة بنجاح');

      // Auto-save the form after successful upload
      setTimeout(() => {
        onSave({
          ...formData,
          icon: result.data.url
        });
      }, 1000);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل في رفع الأيقونة');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If there's a selected file but no icon URL, upload it first
    if (selectedFile && !formData.icon) {
      await handleUpload();
      return;
    }

    // If there's a selected file and we already have an icon URL, upload the new file
    if (selectedFile && formData.icon) {
      await handleUpload();
      return;
    }

    // If no file selected or already uploaded, proceed with saving
    onSave(formData);
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  const modalVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: 'spring', duration: 0.5 }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 20,
      transition: { duration: 0.2 }
    }
  } as const;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
          />

          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-lg overflow-hidden glass rounded-3xl shadow-2xl border border-white/20 dark:border-white/10"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30">
                    <Smartphone className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">
                      {app ? 'تعديل التطبيق' : 'إضافة تطبيق جديد'}
                    </h3>
                    <p className="text-blue-100/80 text-sm font-medium">
                      {app ? 'تحديث معلومات التطبيق وتفاصيله' : 'إدراج تطبيق جديد في نظام الإدارة'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors duration-200"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
                    اسم التطبيق
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all dark:text-white"
                    placeholder="أدخل اسم التطبيق بوضوح..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
                    وصف التطبيق
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all dark:text-white resize-none"
                    placeholder="وصف مختصر لمميزات التطبيق..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
                    أيقونة التطبيق
                  </label>

                  <div className="flex flex-col gap-4">
                    <div className="relative group cursor-pointer border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 transition-all hover:border-blue-400 dark:hover:border-blue-500 bg-slate-50/50 dark:bg-slate-900/20">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        id="icon-upload"
                      />
                      <div className="flex flex-col items-center gap-2 pointer-events-none">
                        <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 text-blue-500 group-hover:scale-110 transition-transform">
                          <Upload className="h-6 w-6" />
                        </div>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                          {selectedFile ? selectedFile.name : 'اختر صورة للأيقونة'}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          PNG, WebP, SVG (حد أقصى 5MB)
                        </span>
                      </div>
                    </div>

                    {(previewUrl || formData.icon) && (
                      <div className="flex items-center gap-4 p-4 glass-card border-blue-500/10 rounded-2xl">
                        <div className="w-16 h-16 rounded-xl overflow-hidden shadow-md border-2 border-white dark:border-slate-700 flex-shrink-0">
                          <img
                            src={previewUrl || formData.icon}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">
                            معاينة الأيقونة
                          </p>
                          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 truncate">
                            {selectedFile ? 'أيقونة مختارة' : 'الأيقونة الحالية'}
                          </p>
                          {selectedFile && (
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={handleUpload}
                              isLoading={uploading}
                              className="mt-2 h-8 py-1 px-3 text-xs"
                            >
                              <Upload className="h-3 w-3 ml-2" />
                              تأكيد الرفع
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 group hover:border-blue-500/30 transition-all duration-300">
                  <div
                    onClick={() => handleChange('is_active', !formData.is_active)}
                    className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer items-center rounded-full transition-all duration-300 px-1 ${formData.is_active ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                    dir="ltr"
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-all duration-300 ${formData.is_active ? 'translate-x-7' : 'translate-x-0'}`} />
                  </div>
                  <div className="flex-1 cursor-pointer" onClick={() => handleChange('is_active', !formData.is_active)}>
                    <span className="text-sm font-black dark:text-white block">حالة التطبيق</span>
                    <span className="text-xs font-medium text-slate-500">تفعيل أو تعطيل التطبيق في النظام بشكل كامل</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onClose}
                  className="flex-1 rounded-xl h-12"
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isLoading}
                  className="flex-1 rounded-xl h-12 shadow-lg shadow-blue-500/20"
                >
                  {app ? 'حفظ التغييرات' : 'إنشاء التطبيق'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default function Apps() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingApp, setEditingApp] = useState<App | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

  const queryClient = useQueryClient();

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  } as const;

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    }
  } as const;

  const { data: apps = [], isLoading } = useQuery<App[]>({
    queryKey: ['apps', { search: searchTerm, active: filterActive }],
    queryFn: () => getApps({
      search: searchTerm || undefined,
      active: filterActive === 'all' ? undefined : filterActive === 'active'
    })
  });

  const createMutation = useMutation({
    mutationFn: createApp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apps'] });
      toast.success('تم إنشاء التطبيق بنجاح');
      setIsCreating(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'فشل في إنشاء التطبيق');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAppData }) => updateApp(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apps'] });
      toast.success('تم تحديث التطبيق بنجاح');
      setEditingApp(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'فشل في تحديث التطبيق');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteApp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apps'] });
      toast.success('تم حذف التطبيق بنجاح');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'فشل في حذف التطبيق');
    }
  });

  const handleCreate = (data: CreateAppData) => {
    createMutation.mutate(data);
  };

  const handleUpdate = (data: UpdateAppData) => {
    if (editingApp) {
      updateMutation.mutate({ id: editingApp._id, data });
    }
  };

  const handleDelete = (app: App) => {
    if (window.confirm(`هل أنت متأكد من حذف التطبيق "${app.name}"؟`)) {
      deleteMutation.mutate(app._id);
    }
  };

  const columns: Column<App>[] = [
    {
      header: 'الأيقونة',
      accessorKey: 'icon',
      cell: ({ row }) => (
        <div className="w-10 h-10 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
          <img
            src={row.original.icon}
            alt={row.original.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )
    },
    {
      header: 'اسم التطبيق',
      accessorKey: 'name',
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{row.original.name}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
            {row.original.description}
          </div>
        </div>
      )
    },
    {
      header: 'الحالة',
      accessorKey: 'is_active',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.is_active ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-green-600 dark:text-green-400">نشط</span>
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-red-600 dark:text-red-400">غير نشط</span>
            </>
          )}
        </div>
      )
    },
    {
      header: 'تاريخ الإنشاء',
      accessorKey: 'created_at',
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-slate-500 font-medium">
          <Calendar className="h-4 w-4" />
          {new Date(row.original.created_at).toLocaleDateString('ar-IQ')}
        </div>
      )
    },
    {
      header: 'رموز التفعيل',
      accessorKey: 'activation_codes_count',
      cell: ({ row }) => {
        const count = row.original.activation_codes?.length || 0;
        return (
          <div className="flex items-center gap-2">
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {count} رمز
            </span>
          </div>
        );
      }
    },
    {
      header: 'الميزات',
      accessorKey: 'features_count',
      cell: ({ row }) => {
        const count = row.original.features?.length || 0;
        return (
          <div className="flex items-center gap-2">
            <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {count} ميزة
            </span>
          </div>
        );
      }
    },
    {
      header: 'الإجراءات',
      accessorKey: 'actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <AppsWriteGuard>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setEditingApp(row.original)}
              className="p-2"
            >
              <Edit className="h-4 w-4" />
            </Button>
          </AppsWriteGuard>
          <AppsDeleteGuard>
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleDelete(row.original)}
              isLoading={deleteMutation.isPending}
              className="p-2"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AppsDeleteGuard>
        </div>
      )
    }
  ];

  if (isLoading) {
    return (
      <div className="space-y-8 p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="space-y-2">
            <Skeleton width={300} height={32} />
            <Skeleton width={400} height={20} />
          </div>
          <Skeleton width={150} height={48} variant="rectangular" className="rounded-2xl shrink-0" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} height={100} variant="rectangular" className="rounded-2xl" />
          ))}
        </div>
        <div className="glass-card p-6">
          <Skeleton height={400} variant="rectangular" className="rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <AppsReadGuard>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* Header */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300">
              إدارة التطبيقات
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">
              إدارة التطبيقات المتاحة في النظام ومراقبة حالتها وخصائصها
            </p>
          </div>
          <AppsWriteGuard>
            <Button
              variant="primary"
              onClick={() => setIsCreating(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/20 rounded-2xl flex items-center gap-3 transition-all active:scale-95"
            >
              <Plus className="h-5 w-5" />
              <span className="font-bold">إضافة تطبيق جديد</span>
            </Button>
          </AppsWriteGuard>
        </header>

        {/* Filters and Stats Summary */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Filters Card */}
          <motion.div
            variants={itemVariants}
            className="xl:col-span-8 glass-card p-6 border border-white/20"
          >
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1 w-full">
                <div className="relative group">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="text"
                    placeholder="البحث باسم التطبيق أو الوصف..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pr-12 pl-4 py-3 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all dark:text-white font-medium"
                  />
                </div>
              </div>
              <div className="w-full md:w-auto">
                <select
                  value={filterActive}
                  onChange={(e) => setFilterActive(e.target.value as 'all' | 'active' | 'inactive')}
                  className="w-full md:w-56 px-4 py-3 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all dark:text-white font-bold cursor-pointer"
                >
                  <option value="all">جميع الحالات</option>
                  <option value="active">التطبيقات النشطة</option>
                  <option value="inactive">غير النشطة</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Quick Stats Grid */}
          <div className="xl:col-span-4 grid grid-cols-2 gap-4">
            <motion.div
              variants={itemVariants}
              className="glass-card p-5 border border-emerald-500/10 flex flex-col items-center justify-center text-center group transition-all hover:translate-y-[-2px]"
            >
              <div className="h-12 w-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3 border border-emerald-200 dark:border-emerald-800/50 group-hover:scale-110 transition-transform">
                <CheckCircle className="h-6 w-6" />
              </div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">نشط</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {apps.filter(app => app.is_active).length}
              </p>
            </motion.div>
            <motion.div
              variants={itemVariants}
              className="glass-card p-5 border border-red-500/10 flex flex-col items-center justify-center text-center group transition-all hover:translate-y-[-2px]"
            >
              <div className="h-12 w-12 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center text-red-600 dark:text-red-400 mb-3 border border-red-200 dark:border-red-800/50 group-hover:scale-110 transition-transform">
                <XCircle className="h-6 w-6" />
              </div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">متوقف</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {apps.filter(app => !app.is_active).length}
              </p>
            </motion.div>
          </div>
        </div>

        {/* Main Content Table Card */}
        <motion.div variants={itemVariants} className="glass-card overflow-hidden border border-white/20">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600">
                <Layers className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold dark:text-white">قائمة التطبيقات</h2>
            </div>
            <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full text-xs font-black text-blue-700 dark:text-blue-400">
              {apps.length} تطبيق
            </div>
          </div>
          <div className="overflow-hidden">
            <Table
              data={apps}
              columns={columns}
              isLoading={isLoading}
              emptyMessage="لا توجد تطبيقات مطابقة لمعايير البحث"
              className="w-full"
              headerClassName="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800"
              rowClassName="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors"
            />
          </div>
        </motion.div>

        {/* Modals */}
        <AppModal
          isOpen={isCreating}
          onClose={() => setIsCreating(false)}
          onSave={(data) => handleCreate(data as CreateAppData)}
          isLoading={createMutation.isPending}
        />

        <AppModal
          isOpen={!!editingApp}
          onClose={() => setEditingApp(null)}
          app={editingApp}
          onSave={handleUpdate}
          isLoading={updateMutation.isPending}
        />
      </motion.div>
    </AppsReadGuard>
  );
}
