import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Feature, App, UpdateFeatureData } from '../api/client';
import { createFeature, getFeatures, updateFeature, deleteFeature, getApps } from '../api/client';
import Button from '../components/Button';
import Table, { type Column } from '../components/Table';
import { toast } from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { usePermissions } from '../hooks/usePermissions';
import { 
  FeaturesWriteGuard
} from '../components/PermissionGuard';

export default function Features() {
    const { canReadFeatures, canWriteFeatures, canDeleteFeatures } = usePermissions();
    const [isCreating, setIsCreating] = useState(false);
    const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: 'basic' as 'basic' | 'advanced' | 'premium' | 'enterprise',
        is_active: true,
        app_id: ''
    });

    const queryClient = useQueryClient();

    // Fetch features from server
    const { data: features = [], isLoading } = useQuery<Feature[]>({
        queryKey: ['features'],
        queryFn: () => getFeatures()
    });

    // Fetch available apps from server
    const { data: availableApps = [] } = useQuery<App[]>({
        queryKey: ['apps'],
        queryFn: () => getApps({ active: true })
    });

    // Create feature mutation
    const createMutation = useMutation({
        mutationFn: createFeature,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['features'] });
            toast.success(`تم إنشاء الميزة بنجاح: ${data.name}`);
            setIsCreating(false);
            resetForm();
        },
        onError: (error: any) => {
            toast.error(error.message || 'حدث خطأ أثناء إنشاء الميزة');
        }
    });

    // Update feature mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateFeatureData }) => updateFeature(id, data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['features'] });
            toast.success(`تم تحديث الميزة بنجاح: ${data.name}`);
            setEditingFeature(null);
            resetForm();
        },
        onError: (error: any) => {
            toast.error(error.message || 'حدث خطأ أثناء تحديث الميزة');
        }
    });

    // Delete feature mutation
    const deleteMutation = useMutation({
        mutationFn: deleteFeature,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['features'] });
            toast.success('تم حذف الميزة بنجاح');
        },
        onError: (error: any) => {
            toast.error(error.message || 'حدث خطأ أثناء حذف الميزة');
        }
    });

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            category: 'basic',
            is_active: true,
            app_id: ''
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // STRICT PERMISSION CHECK - Prevent unauthorized access
        if (!canWriteFeatures()) {
            toast.error('ليس لديك صلاحية لإدارة الميزات');
            return;
        }
        
        if (!formData.name.trim() || !formData.description.trim()) {
            toast.error('يرجى ملء جميع الحقول المطلوبة');
            return;
        }

        try {
            if (editingFeature) {
                await updateMutation.mutateAsync({
                    id: editingFeature._id,
                    data: {
                        name: formData.name,
                        description: formData.description,
                        category: formData.category,
                        is_active: formData.is_active,
                        app_id: formData.app_id
                    }
                });
            } else {
                await createMutation.mutateAsync(formData);
            }
        } catch (error) {
            console.error('Error saving feature:', error);
        }
    };

    const handleEdit = (feature: Feature) => {
        // STRICT PERMISSION CHECK - Prevent unauthorized access
        if (!canWriteFeatures()) {
            toast.error('ليس لديك صلاحية لتعديل الميزات');
            return;
        }
        
        setEditingFeature(feature);
        setFormData({
            name: feature.name,
            description: feature.description,
            category: feature.category as any,
            is_active: feature.is_active,
            app_id: feature.app?._id || ''
        });
        setIsCreating(true);
    };

    const handleDelete = async (feature: Feature) => {
        // STRICT PERMISSION CHECK - Prevent unauthorized access
        if (!canDeleteFeatures()) {
            toast.error('ليس لديك صلاحية لحذف الميزات');
            return;
        }
        
        if (window.confirm(`هل أنت متأكد من حذف الميزة "${feature.name}"؟`)) {
            await deleteMutation.mutateAsync(feature._id);
        }
    };

    const handleCancel = () => {
        setIsCreating(false);
        setEditingFeature(null);
        resetForm();
    };

    const getCategoryLabel = (category: string) => {
        const labels = {
            basic: 'أساسي',
            advanced: 'متقدم',
            premium: 'مميز',
            enterprise: 'مؤسسي'
        };
        return labels[category as keyof typeof labels] || category;
    };

    const getCategoryColor = (category: string) => {
        const colors = {
            basic: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            advanced: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
            premium: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
            enterprise: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        };
        return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    };

    const columns: Column<Feature>[] = [
        { 
            header: 'اسم الميزة', 
            accessorKey: 'name',
            cell: ({ row }) => (
                <span className="font-medium text-gray-900 dark:text-white">
                    {row.original.name}
                </span>
            )
        },
        { 
            header: 'الوصف',
            accessorKey: 'description',
            cell: ({ row }) => (
                <span className="text-sm text-gray-600 dark:text-gray-300">
                    {row.original.description}
                </span>
            )
        },
        { 
            header: 'الفئة',
            accessorKey: 'category',
            cell: ({ row }) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(row.original.category)}`}>
                    {getCategoryLabel(row.original.category)}
                </span>
            )
        },
        { 
            header: 'التطبيق',
            accessorKey: 'app',
            cell: ({ row }) => {
                const app = row.original.app;
                if (!app) {
                    return <span className="text-gray-400 text-sm">غير محدد</span>;
                }
                return (
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 border border-gray-300 dark:border-gray-600 rounded overflow-hidden">
                            <img 
                                src={app.icon} 
                                alt={app.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                        </div>
                        <span className="text-sm font-medium">{app.name}</span>
                    </div>
                );
            }
        },
        { 
            header: 'تاريخ الإنشاء',
            accessorKey: 'created_at',
            cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString('ar-IQ')
        },
        { 
            header: 'الحالة',
            accessorKey: 'is_active',
            cell: ({ row }) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    row.original.is_active 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                    {row.original.is_active ? 'نشط' : 'غير نشط'}
                </span>
            )
        },
        {
            header: 'الإجراءات',
            accessorKey: 'actions',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleEdit(row.original)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        title="تعديل"
                    >
                        <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => handleDelete(row.original)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        title="حذف"
                    >
                        <TrashIcon className="h-4 w-4" />
                    </button>
                </div>
            )
        }
    ];

    // STRICT PERMISSION CHECK - Prevent unauthorized access
    if (!canReadFeatures()) {
        return (
            <div className="space-y-6">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                                لا توجد صلاحية للوصول
                            </h3>
                            <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                                <p>ليس لديك صلاحية لقراءة الميزات. مطلوب صلاحية: <strong>features:read</strong></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">إدارة الميزات</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        إضافة وتعديل وحذف ميزات النظام المتاحة للتراخيص
                    </p>
                </div>
                <FeaturesWriteGuard>
                    <Button
                        onClick={() => setIsCreating(true)}
                        disabled={isCreating}
                        className="flex items-center gap-2"
                    >
                        <PlusIcon className="h-4 w-4" />
                        إضافة ميزة جديدة
                    </Button>
                </FeaturesWriteGuard>
            </div>

            {/* Feature Creation/Edit Form */}
            {isCreating && (
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        {editingFeature ? 'تعديل الميزة' : 'إضافة ميزة جديدة'}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    اسم الميزة <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="مثال: pos, reports, analytics"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    الفئة <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    required
                                >
                                    <option value="basic">أساسي</option>
                                    <option value="advanced">متقدم</option>
                                    <option value="premium">مميز</option>
                                    <option value="enterprise">مؤسسي</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    التطبيق (اختياري)
                                </label>
                                <select
                                    value={formData.app_id}
                                    onChange={(e) => setFormData(prev => ({ ...prev, app_id: e.target.value }))}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                >
                                    <option value="">اختر تطبيق (اختياري)</option>
                                    {availableApps.map((app) => (
                                        <option key={app._id} value={app._id}>
                                            {app.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                الوصف <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                rows={3}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="وصف تفصيلي للميزة وما تقدمه"
                                required
                            />
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                checked={formData.is_active}
                                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                                className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            />
                            <label className="mr-2 text-sm text-gray-700 dark:text-gray-300">
                                الميزة نشطة ومتاحة للاستخدام
                            </label>
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={handleCancel}
                            >
                                إلغاء
                            </Button>
                            <Button
                                type="submit"
                                isLoading={createMutation.isPending || updateMutation.isPending}
                            >
                                {editingFeature ? 'تحديث الميزة' : 'إضافة الميزة'}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Features Table */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        الميزات المتاحة ({features.length})
                    </h2>
                    <Table
                        columns={columns}
                        data={features}
                        isLoading={isLoading}
                        emptyMessage="لا توجد ميزات مضافة"
                    />
                </div>
            </div>
        </div>
    );
}