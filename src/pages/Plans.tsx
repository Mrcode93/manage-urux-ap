import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Plan, Feature } from '../api/client';
import { getPlans, createPlan, updatePlan, deletePlan, getFeatures } from '../api/client';
import Button from '../components/Button';
import Table, { type Column } from '../components/Table';
import { toast } from 'react-hot-toast';
import Loader from '../components/Loader';
import { usePermissions } from '../hooks/usePermissions';

export default function Plans() {
    const { canReadPlans } = usePermissions();
    const [isCreating, setIsCreating] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        features: [] as string[],
        duration_days: 365,
        price: 0,
        currency: 'USD',
        plan_type: 'trial' as 'trial' | 'basic' | 'premium' | 'enterprise',
        max_devices: 1
    });

    const queryClient = useQueryClient();

    const { data: plans = [], isLoading } = useQuery<Plan[]>({
        queryKey: ['plans'],
        queryFn: () => getPlans({ active: true })
    });

    const { data: features = [] } = useQuery<Feature[]>({
        queryKey: ['features'],
        queryFn: () => getFeatures({ active: true })
    });

    const createMutation = useMutation({
        mutationFn: createPlan,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['plans'] });
            toast.success('تم إنشاء الخطة بنجاح');
            setIsCreating(false);
            resetForm();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'فشل في إنشاء الخطة');
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => updatePlan(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['plans'] });
            toast.success('تم تحديث الخطة بنجاح');
            setEditingPlan(null);
            setIsCreating(false);
            resetForm();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'فشل في تحديث الخطة');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deletePlan,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['plans'] });
            toast.success('تم حذف الخطة بنجاح');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'فشل في حذف الخطة');
        }
    });

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            features: [],
            duration_days: 365,
            price: 0,
            currency: 'USD',
            plan_type: 'trial',
            max_devices: 1
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingPlan) {
            await updateMutation.mutateAsync({
                id: editingPlan._id,
                data: formData
            });
        } else {
            await createMutation.mutateAsync(formData);
        }
    };

    const handleFeatureToggle = (featureId: string) => {
        setFormData(prev => ({
            ...prev,
            features: prev.features.includes(featureId)
                ? prev.features.filter(id => id !== featureId)
                : [...prev.features, featureId]
        }));
    };

    const columns: Column<Plan>[] = [
        {
            header: 'اسم الخطة',
            accessorKey: 'name'
        },
        {
            header: 'النوع',
            accessorKey: 'plan_type',
            cell: ({ row }) => {
                const typeLabels = {
                    trial: 'تجريبي',
                    basic: 'أساسي',
                    premium: 'مميز',
                    enterprise: 'مؤسسي'
                };
                return (
                    <span className={`px-2 py-1 rounded-full text-xs ${row.original.plan_type === 'enterprise' ? 'bg-purple-100 text-purple-800' :
                        row.original.plan_type === 'premium' ? 'bg-blue-100 text-blue-800' :
                            row.original.plan_type === 'basic' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                        }`}>
                        {typeLabels[row.original.plan_type]}
                    </span>
                );
            }
        },
        {
            header: 'المدة (أيام)',
            accessorKey: 'duration_days',
            cell: ({ row }) => row.original.duration_days || 'دائم'
        },
        {
            header: 'السعر',
            accessorKey: 'price',
            cell: ({ row }) => `${row.original.price} ${row.original.currency}`
        },
        {
            header: 'عدد الأجهزة',
            accessorKey: 'max_devices'
        },
        {
            header: 'عدد الميزات',
            accessorKey: 'features',
            cell: ({ row }) => row.original.features.length
        },
        {
            header: 'الإجراءات',
            accessorKey: '_id',
            cell: ({ row }) => (
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                            setEditingPlan(row.original);
                            setFormData({
                                name: row.original.name,
                                description: row.original.description,
                                features: row.original.features,
                                duration_days: row.original.duration_days || 365,
                                price: row.original.price,
                                currency: row.original.currency,
                                plan_type: row.original.plan_type,
                                max_devices: row.original.max_devices
                            });
                            setIsCreating(true);
                        }}
                    >
                        تعديل
                    </Button>
                    <Button
                        size="sm"
                        variant="danger"
                        onClick={() => {
                            if (confirm('هل أنت متأكد من حذف هذه الخطة؟')) {
                                deleteMutation.mutate(row.original._id);
                            }
                        }}
                    >
                        حذف
                    </Button>
                </div>
            )
        }
    ];

    // STRICT PERMISSION CHECK - Prevent unauthorized access
    if (!canReadPlans()) {
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
                                <p>ليس لديك صلاحية لقراءة الخطط. مطلوب صلاحية: <strong>plans:read</strong></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return <Loader message="جاري تحميل خطط الاشتراك..." />;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">إدارة الخطط</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    إدارة خطط الاشتراك وتجميع الميزات مع التسعير
                </p>
            </div>

            {isCreating ? (
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                    <h2 className="text-lg font-medium mb-4">
                        {editingPlan ? 'تعديل الخطة' : 'إنشاء خطة جديدة'}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    اسم الخطة *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="الخطة المميزة"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    نوع الخطة
                                </label>
                                <select
                                    value={formData.plan_type}
                                    onChange={(e) => setFormData(prev => ({ ...prev, plan_type: e.target.value as any }))}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                >
                                    <option value="trial">تجريبي</option>
                                    <option value="basic">أساسي</option>
                                    <option value="premium">مميز</option>
                                    <option value="enterprise">مؤسسي</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                الوصف *
                            </label>
                            <textarea
                                required
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                rows={3}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="وصف مفصل للخطة ومميزاتها"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    المدة (أيام)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={formData.duration_days || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, duration_days: parseInt(e.target.value) || 0 }))}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="365"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    السعر
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    العملة
                                </label>
                                <select
                                    value={formData.currency}
                                    onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                >
                                    <option value="USD">USD</option>
                                    <option value="EUR">EUR</option>
                                    <option value="SAR">SAR</option>
                                    <option value="EGP">EGP</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    عدد الأجهزة
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={formData.max_devices}
                                    onChange={(e) => setFormData(prev => ({ ...prev, max_devices: parseInt(e.target.value) || 1 }))}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                الميزات المتضمنة *
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
                                {features.map(feature => (
                                    <label key={feature._id} className="inline-flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={formData.features.includes(feature._id)}
                                            onChange={() => handleFeatureToggle(feature._id)}
                                            className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                                        />
                                        <span className="mr-2 text-sm text-gray-700 dark:text-gray-300">
                                            {feature.name}
                                            <span className="text-xs text-gray-500 block">{feature.description}</span>
                                        </span>
                                    </label>
                                ))}
                            </div>
                            {formData.features.length === 0 && (
                                <p className="text-sm text-red-600 mt-1">يجب اختيار ميزة واحدة على الأقل</p>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <Button
                                type="submit"
                                isLoading={createMutation.isPending || updateMutation.isPending}
                                disabled={formData.features.length === 0}
                            >
                                {editingPlan ? 'تحديث الخطة' : 'إنشاء خطة'}
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => {
                                    setIsCreating(false);
                                    setEditingPlan(null);
                                    resetForm();
                                }}
                            >
                                إلغاء
                            </Button>
                        </div>
                    </form>
                </div>
            ) : (
                <Button onClick={() => setIsCreating(true)}>
                    إنشاء خطة جديدة
                </Button>
            )}

            <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                <Table
                    columns={columns}
                    data={plans}
                    isLoading={isLoading}
                    emptyMessage="لا توجد خطط"
                />
            </div>
        </div>
    );
}