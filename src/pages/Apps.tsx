import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { App, CreateAppData, UpdateAppData } from '../api/client';
import { getApps, createApp, updateApp, deleteApp, uploadAppIcon } from '../api/client';
import Button from '../components/Button';
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
  Upload
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

  React.useEffect(() => {
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-900 rounded-lg text-right overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <Smartphone className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {app ? 'تعديل التطبيق' : 'إضافة تطبيق جديد'}
                  </h3>
                  <p className="text-blue-100 text-sm">
                    {app ? 'تحديث معلومات التطبيق' : 'إضافة تطبيق جديد للنظام'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-blue-100 transition-colors duration-200"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
            {/* App Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                اسم التطبيق *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="أدخل اسم التطبيق"
              />
            </div>

            {/* App Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                وصف التطبيق *
              </label>
              <textarea
                required
                rows={3}
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="أدخل وصف التطبيق"
              />
            </div>

            {/* App Icon Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                أيقونة التطبيق *
              </label>
              
              {/* File Upload Area */}
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="icon-upload"
                />
                <label
                  htmlFor="icon-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="h-8 w-8 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedFile ? selectedFile.name : 'اضغط لاختيار صورة'}
                  </span>
                  <span className="text-xs text-gray-500">
                    PNG, JPG, GIF, WebP, SVG (حد أقصى 5 ميجابايت)
                  </span>
                </label>
              </div>

              {/* Preview and Upload Button */}
              {selectedFile && (
                <div className="mt-4 flex items-center gap-4">
                  <div className="w-16 h-16 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={handleUpload}
                      isLoading={uploading}
                      className="mt-2"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      رفع الأيقونة
                    </Button>
                  </div>
                </div>
              )}

              {/* Current Icon Display */}
              {formData.icon && !selectedFile && (
                <div className="mt-4 flex items-center gap-4">
                  <div className="w-16 h-16 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                    <img 
                      src={formData.icon} 
                      alt="Current Icon" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      الأيقونة الحالية
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {formData.icon}
                    </p>
                  </div>
                </div>
              )}

              {/* Hidden input for form validation */}
              <input
                type="hidden"
                value={formData.icon}
                required
              />
            </div>

            {/* Active Status */}
            <div>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => handleChange('is_active', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  التطبيق نشط
                </span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                className="flex-1"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
                className="flex-1"
              >
                {app ? 'تحديث' : 'إنشاء'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function Apps() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingApp, setEditingApp] = useState<App | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

  const queryClient = useQueryClient();

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
      cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString('ar-IQ')
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

  return (
    <AppsReadGuard>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">إدارة التطبيقات</h1>
            <p className="text-gray-600 dark:text-gray-400">إدارة التطبيقات المتاحة في النظام</p>
          </div>
          <AppsWriteGuard>
            <Button
              variant="primary"
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              إضافة تطبيق
            </Button>
          </AppsWriteGuard>
        </div>

        {/* Filters */}
        <div className="flex gap-4 items-center">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="البحث في التطبيقات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value as 'all' | 'active' | 'inactive')}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
          >
            <option value="all">جميع التطبيقات</option>
            <option value="active">التطبيقات النشطة</option>
            <option value="inactive">التطبيقات غير النشطة</option>
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <Smartphone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="mr-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      إجمالي التطبيقات
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      {apps.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="mr-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      التطبيقات النشطة
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      {apps.filter(app => app.is_active).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                </div>
                <div className="mr-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      التطبيقات غير النشطة
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      {apps.filter(app => !app.is_active).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <Table
          data={apps}
          columns={columns}
          isLoading={isLoading}
          emptyMessage="لا توجد تطبيقات"
        />

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
      </div>
    </AppsReadGuard>
  );
}
