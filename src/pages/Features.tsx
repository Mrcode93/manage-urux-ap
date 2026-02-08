import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import type { Feature, App, UpdateFeatureData } from '../api/client';
import { createFeature, getFeatures, updateFeature, deleteFeature, getApps } from '../api/client';
import Button from '../components/Button';
import Skeleton from '../components/Skeleton';
import Table, { type Column } from '../components/Table';
import { toast } from 'react-hot-toast';
import { usePermissions } from '../hooks/usePermissions';
import {
    FeaturesWriteGuard
} from '../components/PermissionGuard';
import {
    Plus,
    Pencil,
    Trash2,
    Layers,
    Component,
    Zap,
    Tag,
    Info
} from 'lucide-react';

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
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${row.original.is_active
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
                        <Pencil className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => handleDelete(row.original)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        title="حذف"
                    >
                        <Trash2 className="h-4 w-4" />
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

    if (isLoading) {
        return (
            <div className="space-y-8 p-4">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="space-y-2">
                        <Skeleton width={250} height={32} />
                        <Skeleton width={300} height={20} />
                    </div>
                    <Skeleton width={150} height={45} variant="rectangular" className="rounded-xl" />
                </div>
                <div className="space-y-4">
                    <Skeleton height={500} variant="rectangular" className="rounded-2xl" />
                </div>
            </div>
        );
    }

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
        >
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300">
                        إدارة ميزات النظام
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">
                        تخصيص الميزات المتقدمة وتصنيفها لأنظمة التراخيص
                    </p>
                </div>
                <FeaturesWriteGuard>
                    <Button
                        onClick={() => setIsCreating(true)}
                        disabled={isCreating}
                        className="px-6 py-3 rounded-2xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-blue-500/20"
                    >
                        <Plus className="h-5 w-5" />
                        إضافة ميزة جديدة
                    </Button>
                </FeaturesWriteGuard>
            </header>

            <AnimatePresence>
                {isCreating && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleCancel}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        />
                        <motion.div
                            variants={modalVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="relative w-full max-w-2xl glass-card overflow-hidden border border-white/20 shadow-2xl"
                        >
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-white">
                                <h2 className="text-2xl font-black">
                                    {editingFeature ? 'تعديل الميزة' : 'إضافة ميزة جديدة'}
                                </h2>
                                <p className="text-blue-100 font-medium opacity-90 mt-1">
                                    أدخل تفاصيل الميزة لتعريفها في النظام
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-black text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                            <Tag className="h-4 w-4 text-blue-500" />
                                            اسم الميزة
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold dark:text-white"
                                            placeholder="مثال: pos_advanced"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-black text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                            <Zap className="h-4 w-4 text-blue-500" />
                                            فئة الميزة
                                        </label>
                                        <select
                                            value={formData.category}
                                            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold dark:text-white appearance-none"
                                            required
                                        >
                                            <option value="basic">أساسي (Basic)</option>
                                            <option value="advanced">متقدم (Advanced)</option>
                                            <option value="premium">مميز (Premium)</option>
                                            <option value="enterprise">مؤسسي (Enterprise)</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-black text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                            <Layers className="h-4 w-4 text-blue-500" />
                                            ربط مع تطبيق (اختياري)
                                        </label>
                                        <select
                                            value={formData.app_id}
                                            onChange={(e) => setFormData(prev => ({ ...prev, app_id: e.target.value }))}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold dark:text-white appearance-none"
                                        >
                                            <option value="">اختر تطبيق لإسناد هذه الميزة له</option>
                                            {availableApps.map((app) => (
                                                <option key={app._id} value={app._id}>
                                                    {app.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-black text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <Info className="h-4 w-4 text-blue-500" />
                                        وصف الميزة
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                        rows={4}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold dark:text-white"
                                        placeholder="اشرح الغرض من هذه الميزة للمستخدم النهائي..."
                                        required
                                    />
                                </div>

                                <div className="flex items-center gap-4 p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 group hover:border-blue-500/30 transition-all duration-300">
                                    <div
                                        onClick={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
                                        className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer items-center rounded-full transition-all duration-300 px-1 ${formData.is_active ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                                        dir="ltr"
                                    >
                                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-all duration-300 ${formData.is_active ? 'translate-x-7' : 'translate-x-0'}`} />
                                    </div>
                                    <div className="flex-1 cursor-pointer" onClick={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}>
                                        <span className="text-sm font-black dark:text-white block">الميزة نشطة</span>
                                        <span className="text-xs font-medium text-slate-500">متاحة للاستخدام حالياً في النظام</span>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={handleCancel}
                                        className="px-8 py-3 rounded-2xl font-bold"
                                    >
                                        إلغاء
                                    </Button>
                                    <Button
                                        type="submit"
                                        isLoading={createMutation.isPending || updateMutation.isPending}
                                        className="px-8 py-3 rounded-2xl font-bold shadow-lg shadow-blue-500/20"
                                    >
                                        {editingFeature ? 'تحديث الميزة' : 'إضافة الميزة'}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Features Table Container */}
            <motion.div variants={itemVariants} className="glass-card overflow-hidden border border-white/20 shadow-xl">
                <div className="px-6 py-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <Component className="h-6 w-6" />
                        </div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white leading-none">
                            الميزات المتاحة في النظام ({features.length})
                        </h2>
                    </div>
                    <Table
                        columns={columns}
                        data={features}
                        isLoading={isLoading}
                        emptyMessage="لا توجد ميزات مضافة حالياً"
                    />
                </div>
            </motion.div>
        </motion.div>
    );
}