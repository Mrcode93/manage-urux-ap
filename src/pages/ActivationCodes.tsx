import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ActivationCode, Feature } from '../api/client';
import { generateActivationCode, getActivationCodes, validateActivationCode, getFeatures, generateBulkCodes, deleteActivationCode } from '../api/client';
import Button from '../components/Button';
import Table, { type Column } from '../components/Table';
import { toast } from 'react-hot-toast';
import { confirm } from '../components/toastifyConfirm';
import { exportActivationCodes } from '../utils/exportUtils';
import { usePermissions } from '../hooks/usePermissions';
import { 
  ActivationCodesReadGuard, 
  ActivationCodesWriteGuard, 
  ActivationCodesDeleteGuard 
} from '../components/PermissionGuard';


const typeLabels = {
    lifetime: 'دائم',
    custom: 'مخصص',
    'custom-lifetime': 'مخصص دائم',
    'first-activation': 'التفعيل الأول'
};

export default function ActivationCodes() {
    const { canReadActivationCodes, canWriteActivationCodes, canDeleteActivationCodes } = usePermissions();
    const [isGenerating, setIsGenerating] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [showBulkForm, setShowBulkForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
    const [showDetails, setShowDetails] = useState<string | null>(null);
    const [showExportModal, setShowExportModal] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [generatedBulkCodes, setGeneratedBulkCodes] = useState<any>(null);
    const [formData, setFormData] = useState({
        features: [] as string[],
        type: 'lifetime' as 'lifetime' | 'custom' | 'custom-lifetime' | 'first-activation',
        expires_in_days: 30,
        duration_type: 'days' as 'days' | 'months',
        duration_value: 30
    });
    const [bulkFormData, setBulkFormData] = useState({
        quantity: 1,
        type: 'lifetime' as 'lifetime' | 'custom' | 'custom-lifetime' | 'first-activation',
        duration_type: 'days' as 'days' | 'months',
        duration_value: 30,
        features: [] as string[]
    });
    const [validatingCode, setValidatingCode] = useState<string | null>(null);

    const queryClient = useQueryClient();

    // Fetch activation codes from server
    const { data: codes = [], isLoading } = useQuery<ActivationCode[]>({
        queryKey: ['activationCodes'],
        queryFn: getActivationCodes
    });

    // Fetch available features from server
    const { data: availableFeatures = [], isLoading: featuresLoading } = useQuery<Feature[]>({
        queryKey: ['features'],
        queryFn: () => getFeatures({ active: true })
    });

    // Generate activation code mutation
    const generateMutation = useMutation({
        mutationFn: generateActivationCode,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['activationCodes'] });
            toast.success(`تم إنشاء رمز التفعيل بنجاح: ${data.code}`);
            setIsGenerating(false);
            setShowForm(false);
            resetForm();
        },
        onError: (error: any) => {
            toast.error(error.message || 'حدث خطأ أثناء إنشاء رمز التفعيل');
        }
    });

    // Validate code mutation
    const validateMutation = useMutation({
        mutationFn: validateActivationCode,
        onSuccess: (data) => {
            toast.success(`الرمز صحيح: ${data.message || 'رمز صالح للاستخدام'}`);
        },
        onError: (error: any) => {
            toast.error(error.message || 'رمز غير صحيح أو منتهي الصلاحية');
        }
    });

    // Add bulk generation mutation
    const bulkGenerateMutation = useMutation({
        mutationFn: generateBulkCodes,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['activationCodes'] });
            setGeneratedBulkCodes(data.data);
            toast.success(`تم إنشاء ${data.data.quantity} رمز تفعيل بنجاح`);
        },
        onError: (error: any) => {
            toast.error(error.message || 'حدث خطأ أثناء إنشاء الرموز');
        }
    });

    // Add delete mutation
    const deleteMutation = useMutation({
        mutationFn: deleteActivationCode,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['activationCodes'] });
            toast.success('تم حذف الرمز بنجاح');
        },
        onError: (error: any) => {
            toast.error(error.message || 'حدث خطأ أثناء حذف الرمز');
        }
    });

    const resetForm = () => {
        setFormData({
            features: [],
            type: 'lifetime',
            expires_in_days: 30,
            duration_type: 'days',
            duration_value: 30
        });
    };

    // Filter codes based on search and filter
    const filteredCodes = useMemo(() => {
        // Ensure codes is always an array
        const safeCodes = Array.isArray(codes) ? codes : [];
        
        return safeCodes.filter(code => {
            const matchesSearch = code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                code.type.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesFilter = filterType === 'all' || 
                                (filterType === 'used' && (code.used || code.current_uses > 0)) ||
                                (filterType === 'unused' && !code.used && code.current_uses === 0) ||
                                (filterType === 'expired' && code.expires_at && new Date(code.expires_at) < new Date());
            
            return matchesSearch && matchesFilter;
        });
    }, [codes, searchTerm, filterType]);

    // Statistics
    const stats = {
        total: codes.length,
        active: codes.filter(c => !c.used && (!c.expires_at || new Date(c.expires_at) > new Date())).length,
        used: codes.filter(c => c.used).length,
        expired: codes.filter(c => c.expires_at && new Date(c.expires_at) <= new Date()).length
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // STRICT PERMISSION CHECK - Prevent unauthorized access
        if (!canWriteActivationCodes()) {
            toast.error('ليس لديك صلاحية لإنشاء رموز التفعيل');
            return;
        }
        
        if ((formData.type === 'custom' || formData.type === 'custom-lifetime') && formData.features.length === 0) {
            toast.error('يرجى اختيار ميزة واحدة على الأقل للترخيص المخصص');
            return;
        }

        // Calculate duration in days for individual form
        let durationInDays: number | undefined;
        if (formData.type === 'custom' && formData.duration_type && formData.duration_value) {
            durationInDays = formData.duration_type === 'months' 
                ? formData.duration_value * 30 
                : formData.duration_value;
        }

        const submitData = {
            type: formData.type as 'lifetime' | 'custom' | 'custom-lifetime' | 'first-activation',
            features: (formData.type === 'custom' || formData.type === 'custom-lifetime' || formData.type === 'first-activation') ? formData.features : undefined,
            expires_in_days: durationInDays
        };

        try {
            setIsGenerating(true);
            await generateMutation.mutateAsync(submitData);
        } catch (error) {
            console.error('Error generating code:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleBulkSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // STRICT PERMISSION CHECK - Prevent unauthorized access
        if (!canWriteActivationCodes()) {
            toast.error('ليس لديك صلاحية لإنشاء رموز التفعيل');
            return;
        }
        
        if (bulkFormData.quantity < 1 || bulkFormData.quantity > 100) {
            toast.error('الكمية يجب أن تكون بين 1 و 100');
            return;
        }
        if ((bulkFormData.type === 'custom' || bulkFormData.type === 'custom-lifetime') && bulkFormData.features.length === 0) {
            toast.error('يرجى اختيار ميزة واحدة على الأقل للترخيص المخصص');
            return;
        }
        // Calculate duration in days
        let durationInDays: number | undefined;
        if (bulkFormData.type === 'custom' && bulkFormData.duration_type && bulkFormData.duration_value) {
            durationInDays = bulkFormData.duration_type === 'months' 
                ? bulkFormData.duration_value * 30 
                : bulkFormData.duration_value;
        }

        const submitData = {
            quantity: bulkFormData.quantity,
            type: bulkFormData.type as 'lifetime' | 'custom' | 'custom-lifetime' | 'first-activation',
            duration: durationInDays,
            features: (bulkFormData.type === 'custom' || bulkFormData.type === 'custom-lifetime' || bulkFormData.type === 'first-activation') ? bulkFormData.features : undefined
        };

        try {
            await bulkGenerateMutation.mutateAsync(submitData);
        } catch (error) {
            console.error('Error generating bulk codes:', error);
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

    const handleSelectAllFeatures = () => {
        const allFeatureNames = availableFeatures.map(feature => feature.name);
        setFormData(prev => ({
            ...prev,
            features: allFeatureNames
        }));
    };

    const handleDeselectAllFeatures = () => {
        setFormData(prev => ({
            ...prev,
            features: []
        }));
    };

    const handleBulkSelectAllFeatures = () => {
        const allFeatureNames = availableFeatures.map(feature => feature.name);
        setBulkFormData(prev => ({
            ...prev,
            features: allFeatureNames
        }));
    };

    const handleBulkDeselectAllFeatures = () => {
        setBulkFormData(prev => ({
            ...prev,
            features: []
        }));
    };

    const handleValidateCode = async () => {
        // STRICT PERMISSION CHECK - Prevent unauthorized access
        if (!canReadActivationCodes()) {
            toast.error('ليس لديك صلاحية للتحقق من رموز التفعيل');
            return;
        }
        
        if (!validatingCode || !validatingCode.trim()) {
            toast.error('يرجى إدخال رمز التفعيل');
            return;
        }
        await validateMutation.mutateAsync(validatingCode);
    };

    const handleSelectCode = (codeId: string) => {
        setSelectedCodes(prev => 
            prev.includes(codeId) 
                ? prev.filter(id => id !== codeId)
                : [...prev, codeId]
        );
    };

    const handleSelectAll = () => {
        if (selectedCodes.length === filteredCodes.length) {
            setSelectedCodes([]);
        } else {
            setSelectedCodes(filteredCodes.map(code => code._id || code.code));
        }
    };

    const handleBulkAction = (action: string) => {
        switch (action) {
            case 'copy':
                const selectedCodesText = codes
                    .filter(code => selectedCodes.includes(code._id || code.code))
                    .map(code => code.code)
                    .join('\n');
                navigator.clipboard.writeText(selectedCodesText);
                toast.success(`تم نسخ ${selectedCodes.length} رمز إلى الحافظة`);
                break;
            case 'export':
                setShowExportModal(true);
                break;
            case 'deactivate':
                // TODO: Implement deactivate functionality
                toast('سيتم تنفيذ وظيفة إلغاء التفعيل قريباً', { icon: 'ℹ️' });
                break;
        }
        setSelectedCodes([]);
    };

    const handleExport = async (format: 'pdf' | 'excel', includeSelectedOnly: boolean = false) => {
        try {
            setIsExporting(true);
            const fileName = await exportActivationCodes({
                format,
                includeSelectedOnly,
                selectedCodes: includeSelectedOnly ? selectedCodes : undefined,
                allCodes: codes,
                availableFeatures
            });
            toast.success(`تم تصدير ${includeSelectedOnly ? selectedCodes.length : codes.length} رمز إلى ${format.toUpperCase()}: ${fileName}`);
            setShowExportModal(false);
        } catch (error: any) {
            toast.error(error.message || 'حدث خطأ أثناء التصدير');
        } finally {
            setIsExporting(false);
        }
    };

    const downloadBulkCodes = () => {
        if (!generatedBulkCodes) return;

        const codesText = generatedBulkCodes.codes.map((code: any) => 
            `${code.code} | ${code.type} | انتهاء: ${new Date(code.expiresAt).toLocaleDateString('ar-IQ')}`
        ).join('\n');

        const blob = new Blob([codesText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `activation-codes-${generatedBulkCodes.batchId}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const copyAllBulkCodes = () => {
        if (!generatedBulkCodes) return;

        const codesText = generatedBulkCodes.codes.map((code: any) => code.code).join('\n');
        navigator.clipboard.writeText(codesText);
        toast.success('تم نسخ جميع الرموز إلى الحافظة');
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('تم نسخ الرمز إلى الحافظة');
    };

    const getFeatureName = (featureId: string) => {
        const feature = availableFeatures.find(f => f.name === featureId);
        return feature ? `${feature.name} - ${feature.description}` : featureId;
    };

    const getFeatureCategory = (featureId: string) => {
        const feature = availableFeatures.find(f => f.name === featureId);
        if (!feature) return 'غير محدد';
        
        const categoryLabels = {
            basic: 'أساسي',
            advanced: 'متقدم',
            premium: 'مميز',
            enterprise: 'مؤسسي'
        };
        return categoryLabels[feature.category as keyof typeof categoryLabels] || feature.category;
    };

    // Group features by category for better organization
    const featuresByCategory = (Array.isArray(availableFeatures) ? availableFeatures : []).reduce((acc, feature) => {
        if (!acc[feature.category]) {
            acc[feature.category] = [];
        }
        acc[feature.category].push(feature);
        return acc;
    }, {} as Record<string, Feature[]>);

    const columns: Column<ActivationCode>[] = [
        {
            header: 'تحديد',
            accessorKey: 'select',
            cell: ({ row }) => (
                <input
                    type="checkbox"
                    checked={selectedCodes.includes(row.original._id || row.original.code)}
                    onChange={() => handleSelectCode(row.original._id || row.original.code)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
            ),
        },
        { 
            header: 'الرمز', 
            accessorKey: 'code',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <span className="font-mono text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        {row.original.code}
                    </span>
                    <button
                        onClick={() => copyToClipboard(row.original.code)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title="نسخ الرمز"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </button>
                </div>
            )
        },
        { 
            header: 'النوع',
            accessorKey: 'type',
            cell: ({ row }) => {
                const type = row.original.type as keyof typeof typeLabels;
                return (
                    <span className={`px-2 py-1 rounded-full text-xs ${
                        type === 'lifetime' ? 'bg-green-100 text-green-800' :
                        type === 'custom' ? 'bg-blue-100 text-blue-800' :
                        type === 'custom-lifetime' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                    }`}>
                        {typeLabels[type] || row.original.type}
                    </span>
                );
            }
        },
        { 
            header: 'الميزات',
            accessorKey: 'features',
            cell: ({ row }) => (
                <div className="space-y-1">
                    <div className="flex flex-wrap gap-1">
                        {row.original.features.slice(0, 2).map((feature, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                {feature}
                            </span>
                        ))}
                        {row.original.features.length > 2 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                +{row.original.features.length - 2}
                            </span>
                        )}
                    </div>
                    {row.original.features.length > 2 && (
                        <button
                            onClick={() => setShowDetails(showDetails === row.original.code ? null : row.original.code)}
                            className="text-xs text-blue-600 hover:text-blue-800"
                        >
                            {showDetails === row.original.code ? 'إخفاء التفاصيل' : 'عرض الكل'}
                        </button>
                    )}
                </div>
            )
        },
        { 
            header: 'الاستخدامات',
            accessorKey: 'current_uses',
            cell: ({ row }) => {
                const current = row.original.current_uses || 0;
                const max = row.original.max_uses || 1;
                const percentage = (current / max) * 100;
                
                return (
                    <div className="space-y-1">
                        <div className="text-sm">{current}/{max}</div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                                className={`h-2 rounded-full ${
                                    percentage === 100 ? 'bg-red-500' : 
                                    percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                            ></div>
                        </div>
                    </div>
                );
            }
        },
        { 
            header: 'تاريخ الانتهاء',
            accessorKey: 'expires_at',
            cell: ({ row }) => {
                const expiresAt = row.original.expires_at;
                if (!expiresAt) return <span className="text-green-600 font-medium">دائم</span>;
                
                const date = new Date(expiresAt);
                const isExpired = date < new Date();
                const daysLeft = Math.ceil((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                    <div className="space-y-1">
                        <div className={`text-sm font-medium ${
                            isExpired ? 'text-red-600 dark:text-red-400' : 
                            daysLeft <= 7 ? 'text-yellow-600 dark:text-yellow-400' : 
                            daysLeft <= 30 ? 'text-orange-600 dark:text-orange-400' :
                            'text-gray-700 dark:text-gray-300'
                        }`}>
                            {isExpired ? (
                                <span>منتهي منذ {Math.abs(daysLeft)} يوم</span>
                            ) : daysLeft === 0 ? (
                                <span>ينتهي اليوم</span>
                            ) : daysLeft === 1 ? (
                                <span>يوم واحد متبقي</span>
                            ) : daysLeft <= 30 ? (
                                <span>{daysLeft} يوم متبقي</span>
                            ) : daysLeft <= 365 ? (
                                <span>{daysLeft} يوم ({Math.round(daysLeft / 30)} شهر)</span>
                            ) : (
                                <span>{Math.round(daysLeft / 365)} سنة ({daysLeft} يوم)</span>
                            )}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            {date.toLocaleDateString('ar-IQ')}
                        </div>
                    </div>
                );
            },
        },
        {
          header: 'تاريخ الإنشاء',
          accessorKey: 'created_at',
          cell: ({ row }) => (
            <div className="text-sm text-gray-600 dark:text-gray-400">
                {new Date(row.original.created_at).toLocaleDateString('ar-IQ')}
            </div>
          ),
        },
        { 
            header: 'الحالة',
            accessorKey: 'used',
            cell: ({ row }) => {
                const isExpired = row.original.expires_at && new Date() > new Date(row.original.expires_at);
                const isUsed = row.original.used;
                const isMaxUsed = (row.original.current_uses || 0) >= (row.original.max_uses || 1);
                
                let status = 'متاح';
                let className = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
                
                if (isExpired) {
                    status = 'منتهي الصلاحية';
                    className = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
                } else if (isUsed || isMaxUsed) {
                    status = 'مستنفد';
                    className = 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
                }
                
                return (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
                        {status}
                    </span>
                );
            }
        },
        {
            header: 'الإجراءات',
            accessorKey: 'actions',
            cell: ({ row }) => (
                <div className="flex gap-2">
                    <button
                        onClick={() => copyToClipboard(row.original.code)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                        title="نسخ"
                    >
                        نسخ
                    </button>
                    <button
                        onClick={() => setShowDetails(showDetails === row.original.code ? null : row.original.code)}
                        className="text-green-600 hover:text-green-800 text-sm"
                        title="تفاصيل"
                    >
                        تفاصيل
                    </button>
                    {!row.original.used && (
                        <ActivationCodesDeleteGuard>
                            <button
                                className="text-red-600 hover:text-red-800 text-sm"
                                title="حذف"
                                onClick={async () => {
                                    // STRICT PERMISSION CHECK - Prevent unauthorized access
                                    if (!canDeleteActivationCodes()) {
                                        toast.error('ليس لديك صلاحية لحذف رموز التفعيل');
                                        return;
                                    }
                                    
                                    const confirmed = await confirm('هل أنت متأكد من حذف هذا الرمز؟');
                                    if (confirmed) {
                                        deleteMutation.mutate(row.original._id || row.original.code);
                                    }
                                }}
                            >
                                حذف
                            </button>
                        </ActivationCodesDeleteGuard>
                    )}
                </div>
            )
        }
    ];

    // STRICT PERMISSION CHECK - Prevent unauthorized access
    if (!canReadActivationCodes()) {
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
                                <p>ليس لديك صلاحية لقراءة رموز التفعيل. مطلوب صلاحية: <strong>activation_codes:read</strong></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                <div className="flex-1">
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">رموز التفعيل</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        إنشاء وإدارة رموز تفعيل الأجهزة والتراخيص
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            canReadActivationCodes() ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                            قراءة رموز التفعيل {canReadActivationCodes() ? '✓' : '✗'}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            canWriteActivationCodes() ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                            إدارة رموز التفعيل {canWriteActivationCodes() ? '✓' : '✗'}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            canDeleteActivationCodes() ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                            حذف رموز التفعيل {canDeleteActivationCodes() ? '✓' : '✗'}
                        </span>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <ActivationCodesReadGuard>
                        <Button
                            variant="secondary"
                            onClick={() => setValidatingCode('')}
                            className="whitespace-nowrap"
                        >
                            تحقق من رمز
                        </Button>
                    </ActivationCodesReadGuard>
                    <ActivationCodesWriteGuard>
                        <Button
                            variant="secondary"
                            onClick={() => setShowBulkForm(!showBulkForm)}
                            className="whitespace-nowrap"
                        >
                            {showBulkForm ? 'إلغاء الإنشاء المجمع' : 'إنشاء رموز بالجملة'}
                        </Button>
                    </ActivationCodesWriteGuard>
                    <ActivationCodesWriteGuard>
                        <Button
                            onClick={() => setShowForm(!showForm)}
                            className="whitespace-nowrap"
                        >
                            {showForm ? 'إلغاء' : 'إنشاء رمز جديد'}
                        </Button>
                    </ActivationCodesWriteGuard>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                                    <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-8a1 1 0 00-1-1h-2a1 1 0 00-1 1z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="mr-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">إجمالي الرموز</dt>
                                    <dd className="text-lg font-medium text-gray-900 dark:text-white">{stats.total}</dd>
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
                                    <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                            <div className="mr-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">نشطة</dt>
                                    <dd className="text-lg font-medium text-gray-900 dark:text-white">{stats.active}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="h-8 w-8 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center">
                                    <svg className="h-5 w-5 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                            <div className="mr-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">مستخدمة</dt>
                                    <dd className="text-lg font-medium text-gray-900 dark:text-white">{stats.used}</dd>
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
                                    <svg className="h-5 w-5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                            <div className="mr-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">منتهية</dt>
                                    <dd className="text-lg font-medium text-gray-900 dark:text-white">{stats.expired}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>







            {/* Filters and Search */}
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            البحث
                        </label>
                        <input
                            type="text"
                            placeholder="بحث في الرموز، النوع، أو الميزات..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            النوع
                        </label>
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            <option value="all">جميع الأنواع</option>
                            <option value="lifetime">دائم</option>
                            <option value="custom">مخصص</option>
                            <option value="custom-lifetime">مخصص دائم</option>
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            الحالة
                        </label>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            <option value="all">جميع الحالات</option>
                            <option value="active">نشطة</option>
                            <option value="used">مستخدمة</option>
                            <option value="expired">منتهية</option>
                        </select>
                    </div>

                    {selectedCodes.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                إجراءات مجمعة ({selectedCodes.length})
                            </label>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => handleBulkAction('copy')}
                                    className="flex-1 sm:flex-none"
                                >
                                    نسخ
                                </Button>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => handleBulkAction('export')}
                                    className="flex-1 sm:flex-none"
                                >
                                    تصدير
                                </Button>
                                <ActivationCodesDeleteGuard>
                                    <Button
                                        size="sm"
                                        variant="danger"
                                        onClick={async () => {
                                            // STRICT PERMISSION CHECK - Prevent unauthorized access
                                            if (!canDeleteActivationCodes()) {
                                                toast.error('ليس لديك صلاحية لحذف رموز التفعيل');
                                                return;
                                            }
                                            
                                            const confirmed = await confirm('هل أنت متأكد من حذف جميع الرموز المحددة؟');
                                            if (confirmed) {
                                                selectedCodes.forEach(id => deleteMutation.mutate(id));
                                                setSelectedCodes([]);
                                            }
                                        }}
                                        className="flex-1 sm:flex-none"
                                    >
                                        حذف الرموز
                                    </Button>
                                </ActivationCodesDeleteGuard>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Export Modal */}
            {showExportModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          تصدير رموز التفعيل
        </h3>
        <button
          onClick={() => setShowExportModal(false)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            نطاق التصدير
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="exportScope"
                value="all"
                defaultChecked
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="mr-2 text-sm text-gray-700 dark:text-gray-300">
                تصدير جميع الرموز ({codes.length})
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="exportScope"
                value="selected"
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="mr-2 text-sm text-gray-700 dark:text-gray-300">
                تصدير الرموز المحددة فقط ({selectedCodes.length})
              </span>
            </label>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            تنسيق الملف
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => {
                const scope = document.querySelector('input[name="exportScope"]:checked') as HTMLInputElement;
                handleExport('pdf', scope?.value === 'selected');
              }}
              isLoading={isExporting}
              disabled={isExporting}
              className="flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0 2 2 0 012 0v3a1 1 0 102 0V8z" clipRule="evenodd" />
              </svg>
              PDF
            </Button>
            <Button
              onClick={() => {
                const scope = document.querySelector('input[name="exportScope"]:checked') as HTMLInputElement;
                handleExport('excel', scope?.value === 'selected');
              }}
              isLoading={isExporting}
              disabled={isExporting}
              className="flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-8a1 1 0 00-1-1h-2a1 1 0 00-1 1z" clipRule="evenodd" />
              </svg>
              Excel
            </Button>
          </div>
        </div>
      </div>
      
      <div className="mt-6 flex justify-end">
        <Button
          variant="secondary"
          onClick={() => setShowExportModal(false)}
          disabled={isExporting}
        >
          إلغاء
        </Button>
      </div>
    </div>
  </div>
)}

            {/* Selected Codes Actions */}

            {/* Enhanced Details View */}
            {showDetails && (
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            تفاصيل الرمز: {showDetails}
                        </h3>
                        <button
                            onClick={() => setShowDetails(null)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    
                    {(() => {
                        const code = codes.find(c => c.code === showDetails);
                        if (!code) return null;
                        
                        return (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <h4 className="font-medium text-gray-900 dark:text-white">معلومات الرمز</h4>
                                    <div className="space-y-2 text-sm">
                                        <div><span className="font-medium">الرمز:</span> <span className="font-mono">{code.code}</span></div>
                                        <div><span className="font-medium">النوع:</span> {code.type}</div>
                                        <div><span className="font-medium">الاستخدامات:</span> {code.current_uses || 0}/{code.max_uses || 1}</div>
                                        <div><span className="font-medium">تاريخ الإنشاء:</span> {new Date(code.created_at).toLocaleString('ar-IQ')}</div>
                                        {code.expires_at && (
                                            <div><span className="font-medium">تاريخ الانتهاء:</span> {new Date(code.expires_at).toLocaleString('ar-IQ')}</div>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="space-y-3">
                                    <h4 className="font-medium text-gray-900 dark:text-white">الميزات ({code.features.length})</h4>
                                    <div className="space-y-1">
                                        {code.features.map((feature, index) => (
                                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                                <span className="text-sm">{feature}</span>
                                                <span className="text-xs text-gray-500">{getFeatureCategory(feature)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            )}

            {/* Codes Table */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                            رموز التفعيل ({filteredCodes.length} من {codes.length})
                        </h2>
                        {selectedCodes.length > 0 && (
                            <div className="text-sm text-gray-500">
                                تم تحديد {selectedCodes.length} رمز
                            </div>
                        )}
                    </div>
                    <div className="overflow-x-auto">
                        <Table
                            columns={columns}
                            data={filteredCodes}
                            isLoading={isLoading}
                            emptyMessage="لا توجد رموز تفعيل تطابق المعايير المحددة"
                        />
                    </div>
                </div>
            </div>
        </div>

        {/* Code Validation Modal */}
        {validatingCode !== null && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
                    <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                        التحقق من صحة رمز التفعيل
                    </h2>
                        <button
                            onClick={() => setValidatingCode(null)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                        <input
                            type="text"
                            value={validatingCode ?? ''}
                            onChange={(e) => setValidatingCode(e.target.value)}
                            placeholder="أدخل رمز التفعيل للتحقق منه (مثال: ABCD-1234-EFGH)"
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                            <div className="flex gap-2">
                        <Button
                            onClick={handleValidateCode}
                            isLoading={validateMutation.isPending}
                            disabled={!validatingCode || !validatingCode.trim()}
                                    className="flex-1"
                        >
                            تحقق
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => setValidatingCode(null)}
                                    className="flex-1"
                        >
                            إغلاق
                        </Button>
                            </div>
                        </div>
                    </div>
                    </div>
                </div>
            )}

        {/* Single Code Generation Modal */}
            {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                        إنشاء رمز تفعيل جديد
                    </h2>
                        <button
                            onClick={() => setShowForm(false)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    نوع الترخيص
                                </label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData(prev => ({ 
                                        ...prev, 
                                        type: e.target.value as 'lifetime' | 'custom' | 'custom-lifetime' | 'first-activation' 
                                    }))}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                >
                                    <option value="lifetime">دائم</option>
                                    <option value="custom">مخصص</option>
                                    <option value="custom-lifetime">مخصص دائم</option>
                                    <option value="first-activation">التفعيل الأول</option>
                                </select>
                            </div>

                            {formData.type === 'custom' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        مدة الصلاحية
                                    </label>
                                    <div className="flex gap-2">
                                        <select
                                            value={formData.duration_type}
                                            onChange={(e) => setFormData(prev => ({ 
                                                ...prev, 
                                                duration_type: e.target.value as 'days' | 'months',
                                                duration_value: e.target.value === 'months' ? 6 : 30
                                            }))}
                                            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        >
                                            <option value="days">أيام</option>
                                            <option value="months">أشهر</option>
                                        </select>
                                        <input
                                            type="number"
                                            min="1"
                                            max={formData.duration_type === 'months' ? '36' : '3650'}
                                            value={formData.duration_value || ''}
                                            onChange={(e) => setFormData(prev => ({ 
                                                ...prev, 
                                                duration_value: parseInt(e.target.value) || (prev.duration_type === 'months' ? 6 : 30),
                                                expires_in_days: prev.duration_type === 'months' ? 
                                                    (parseInt(e.target.value) || 6) * 30 : 
                                                    (parseInt(e.target.value) || 30)
                                            }))}
                                            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            placeholder={formData.duration_type === 'months' ? '6' : '30'}
                                        />
                                    </div>
                                    {formData.duration_type === 'months' && (
                                        <div className="text-xs text-gray-500 mt-1">
                                            الخيارات المتاحة: 6، 12، 18، 24، 36 شهر
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {(formData.type === 'custom' || formData.type === 'custom-lifetime') && (
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        الميزات المتضمنة
                                        <span className="text-red-500"> *</span>
                                        <span className="text-xs text-gray-500 mr-2">
                                            ({formData.features.length} من {availableFeatures.length})
                                        </span>
                                    </label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={handleSelectAllFeatures}
                                            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
                                        >
                                            تحديد الكل
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleDeselectAllFeatures}
                                            className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                                        >
                                            إلغاء التحديد
                                        </button>
                                    </div>
                                </div>
                                
                                {featuresLoading ? (
                                    <div className="text-center py-4">
                                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                                        <p className="mt-2 text-sm text-gray-500">جاري تحميل الميزات...</p>
                                    </div>
                                ) : availableFeatures.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <p>لا توجد ميزات متاحة</p>
                                        <p className="text-sm mt-1">يرجى إضافة ميزات من صفحة إدارة الميزات أولاً</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {Object.entries(featuresByCategory).map(([category, features]) => (
                                            <div key={category}>
                                                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                                                    {getFeatureCategory(features[0].name)} ({features.length})
                                                </h4>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 border rounded-md p-3">
                                                    {features.map(feature => (
                                                        <label key={feature._id} className="inline-flex items-start">
                                                            <input
                                                                type="checkbox"
                                                                checked={formData.features.includes(feature.name)}
                                                                onChange={() => handleFeatureToggle(feature.name)}
                                                                className="mt-1 rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                                                            />
                                                            <span className="mr-2 text-sm">
                                                                <span className="text-gray-700 dark:text-gray-300 font-medium">
                                                                    {feature.name}
                                                                </span>
                                                                <span className="text-xs text-gray-500 block">
                                                                    {feature.description}
                                                                </span>
                                                            </span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                {formData.features.length === 0 && !featuresLoading && (
                                    <p className="text-sm text-red-600 mt-1">يجب اختيار ميزة واحدة على الأقل</p>
                                )}
                            </div>
                        )}

                        {formData.type === 'first-activation' && (
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-800">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                                            <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="mr-4 flex-1">
                                        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
                                            رمز التفعيل الأول
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="flex items-center">
                                                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                                                <span className="text-sm text-blue-800 dark:text-blue-200">صلاحية دائمة (لا تنتهي)</span>
                                            </div>
                                            <div className="flex items-center">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                                                <span className="text-sm text-blue-800 dark:text-blue-200">بدون ميزات محددة (رمز فارغ)</span>
                                            </div>
                                            <div className="flex items-center">
                                                <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                                                <span className="text-sm text-blue-800 dark:text-blue-200">مثالي للتفعيل الأول للأجهزة</span>
                                            </div>
                                            <div className="flex items-center">
                                                <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                                                <span className="text-sm text-blue-800 dark:text-blue-200">استخدام واحد فقط</span>
                                            </div>
                                        </div>
                                        <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-md border border-blue-200 dark:border-blue-700">
                                            <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                                                💡 هذا النوع من الرموز لا يحتاج إلى اختيار ميزات. سيتم إنشاء رمز فارغ مناسب للتفعيل الأول.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <Button
                                type="submit"
                                isLoading={isGenerating || generateMutation.isPending}
                                disabled={(formData.type === 'custom' || formData.type === 'custom-lifetime') && formData.features.length === 0}
                                className="flex-1"
                            >
                                إنشاء رمز تفعيل
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setShowForm(false)}
                                className="flex-1"
                            >
                                إلغاء
                            </Button>
                        </div>
                    </form>
                    </div>
                </div>
                </div>
            )}

        {/* Bulk Code Generation Modal */}
            {showBulkForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                        إنشاء رموز تفعيل بالجملة
                    </h2>
                        <button
                            onClick={() => setShowBulkForm(false)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="p-6">
                    <form onSubmit={handleBulkSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                الكمية
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="100"
                                value={bulkFormData.quantity}
                                onChange={(e) => setBulkFormData(prev => ({ ...prev, quantity: Math.min(100, Math.max(1, parseInt(e.target.value))) }))}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="1"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                نوع الترخيص
                            </label>
                            <select
                                value={bulkFormData.type}
                                onChange={(e) => setBulkFormData(prev => ({ 
                                    ...prev, 
                                    type: e.target.value as 'lifetime' | 'custom' | 'custom-lifetime' | 'first-activation' 
                                }))}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                                {Object.entries(typeLabels).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                                </div>
                        </div>

                        {bulkFormData.type === 'custom' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    مدة الصلاحية
                                </label>
                                <div className="flex gap-2">
                                    <select
                                        value={bulkFormData.duration_type}
                                        onChange={(e) => setBulkFormData(prev => ({ 
                                            ...prev, 
                                            duration_type: e.target.value as 'days' | 'months',
                                            duration_value: e.target.value === 'months' ? 6 : 30
                                        }))}
                                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    >
                                        <option value="days">أيام</option>
                                        <option value="months">أشهر</option>
                                    </select>
                                    <input
                                        type="number"
                                        min="1"
                                        max={bulkFormData.duration_type === 'months' ? '36' : '3650'}
                                        value={bulkFormData.duration_value || ''}
                                        onChange={(e) => setBulkFormData(prev => ({ 
                                            ...prev, 
                                            duration_value: parseInt(e.target.value) || (prev.duration_type === 'months' ? 6 : 30)
                                        }))}
                                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        placeholder={bulkFormData.duration_type === 'months' ? '6' : '30'}
                                    />
                                </div>
                                {bulkFormData.duration_type === 'months' && (
                                    <div className="text-xs text-gray-500 mt-1">
                                        الخيارات المتاحة: 6، 12، 18، 24، 36 شهر
                                    </div>
                                )}
                            </div>
                        )}

                        {(bulkFormData.type === 'custom' || bulkFormData.type === 'custom-lifetime') && (
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        الميزات المتضمنة
                                        <span className="text-xs text-gray-500 mr-2">
                                            ({bulkFormData.features.length} من {availableFeatures.length})
                                        </span>
                                    </label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={handleBulkSelectAllFeatures}
                                            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
                                        >
                                            تحديد الكل
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleBulkDeselectAllFeatures}
                                            className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                                        >
                                            إلغاء التحديد
                                        </button>
                                    </div>
                                </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 border rounded-md p-3">
                                    {availableFeatures.map(feature => (
                                        <label key={feature._id} className="inline-flex items-start">
                                            <input
                                                type="checkbox"
                                                checked={bulkFormData.features.includes(feature.name)}
                                                onChange={() => setBulkFormData(prev => ({
                                                    ...prev,
                                                    features: prev.features.includes(feature.name)
                                                        ? prev.features.filter(id => id !== feature.name)
                                                        : [...prev.features, feature.name]
                                                }))}
                                                className="mt-1 rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                                            />
                                            <span className="mr-2 text-sm">
                                                <span className="text-gray-700 dark:text-gray-300 font-medium">
                                                    {feature.name}
                                                </span>
                                                <span className="text-xs text-gray-500 block">
                                                    {feature.description}
                                                </span>
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {bulkFormData.type === 'first-activation' && (
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-800">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                                            <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="mr-4 flex-1">
                                        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
                                            رمز التفعيل الأول
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="flex items-center">
                                                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                                                <span className="text-sm text-blue-800 dark:text-blue-200">صلاحية دائمة (لا تنتهي)</span>
                                            </div>
                                            <div className="flex items-center">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                                                <span className="text-sm text-blue-800 dark:text-blue-200">بدون ميزات محددة (رمز فارغ)</span>
                                            </div>
                                            <div className="flex items-center">
                                                <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                                                <span className="text-sm text-blue-800 dark:text-blue-200">مثالي للتفعيل الأول للأجهزة</span>
                                            </div>
                                            <div className="flex items-center">
                                                <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                                                <span className="text-sm text-blue-800 dark:text-blue-200">استخدام واحد فقط</span>
                                            </div>
                                        </div>
                                        <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-md border border-blue-200 dark:border-blue-700">
                                            <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                                                💡 هذا النوع من الرموز لا يحتاج إلى اختيار ميزات. سيتم إنشاء رموز فارغة مناسبة للتفعيل الأول.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <Button
                                type="submit"
                                isLoading={bulkGenerateMutation.isPending}
                                className="flex-1"
                            >
                                إنشاء رموز
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setShowBulkForm(false)}
                                className="flex-1"
                            >
                                إلغاء
                            </Button>
                        </div>
                    </form>

                    {generatedBulkCodes && (
                        <div className="mt-6 border-t pt-4">
                            <h3 className="text-base font-medium text-gray-900 dark:text-white mb-2">
                                تم إنشاء الرموز بنجاح!
                            </h3>
                            <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-3 max-h-48 overflow-y-auto">
                                <pre className="text-sm font-mono text-gray-800 dark:text-gray-200">
                                    {generatedBulkCodes.codes.map((code: any) => code.code).join('\n')}
                                </pre>
                            </div>
                            <div className="flex gap-2 mt-3">
                                <Button
                                    size="sm"
                                    onClick={downloadBulkCodes}
                                    variant="secondary"
                                >
                                    تحميل كـ .txt
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={copyAllBulkCodes}
                                    variant="secondary"
                                >
                                    نسخ جميع الرموز
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
                            </div>
                        </div>
                    )}
        
        </>
    );
}
