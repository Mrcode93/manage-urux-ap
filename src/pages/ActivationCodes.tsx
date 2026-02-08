import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ActivationCode, Feature, App } from '../api/client';
import {
    generateActivationCode,
    getActivationCodes,
    validateActivationCode,
    getFeatures,
    generateBulkCodes,
    deleteActivationCode,
    getApps
} from '../api/client';
import Button from '../components/Button';
import { toast } from 'react-hot-toast';
import { confirm } from '../components/toastifyConfirm';
import { exportActivationCodes } from '../utils/exportUtils';
import { usePermissions } from '../hooks/usePermissions';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Key,
    Plus,
    Copy,
    Trash2,
    Search,
    RefreshCw,
    CheckCircle2,
    XCircle,
    Clock,
    Smartphone,
    Zap,
    Layers,
    Download,
    MoreVertical,
    Check,
    ChevronRight,
    FileText,
    FileSpreadsheet,
    Terminal,
    ShieldCheck,
    AlertCircle,
    AlertTriangle
} from 'lucide-react';

const typeLabels = {
    lifetime: 'دائم',
    custom: 'مخصص',
    'custom-lifetime': 'مخصص دائم',
    'first-activation': 'التفعيل الأول'
};

export default function ActivationCodes() {
    const { canReadActivationCodes, canWriteActivationCodes, canDeleteActivationCodes } = usePermissions();
    const [showForm, setShowForm] = useState(false);
    const [showBulkForm, setShowBulkForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [showDetails, setShowDetails] = useState<string | null>(null);
    const [showExportModal, setShowExportModal] = useState(false);
    const [generatedBulkCodes, setGeneratedBulkCodes] = useState<any>(null);
    const [showValidationModal, setShowValidationModal] = useState(false);
    const [validatingCode, setValidatingCode] = useState('');
    const [validationResult, setValidationResult] = useState<{
        status: 'success' | 'error' | 'used';
        message: string;
        data?: any
    } | null>(null);

    const [formData, setFormData] = useState({
        features: [] as string[],
        type: 'lifetime' as 'lifetime' | 'custom' | 'custom-lifetime' | 'first-activation',
        expires_in_days: 30,
        duration_type: 'days' as 'days' | 'months',
        duration_value: 30,
        app_id: '' as string
    });

    const [bulkFormData, setBulkFormData] = useState({
        quantity: 1,
        type: 'lifetime' as 'lifetime' | 'custom' | 'custom-lifetime' | 'first-activation',
        duration_type: 'days' as 'days' | 'months',
        duration_value: 30,
        features: [] as string[],
        app_id: '' as string
    });

    const queryClient = useQueryClient();

    // Fetch dependencies
    const { data: codes = [], isLoading } = useQuery<ActivationCode[]>({
        queryKey: ['activationCodes'],
        queryFn: getActivationCodes
    });

    const { data: availableApps = [] } = useQuery<App[]>({
        queryKey: ['apps'],
        queryFn: () => getApps({ active: true })
    });

    const { data: availableFeatures = [] } = useQuery<Feature[]>({
        queryKey: ['features', formData.app_id || 'all'],
        queryFn: () => getFeatures({
            active: true,
            ...(formData.app_id && { app_id: formData.app_id })
        })
    });

    const { data: availableFeaturesBulk = [] } = useQuery<Feature[]>({
        queryKey: ['features-bulk', bulkFormData.app_id || 'all'],
        queryFn: () => getFeatures({
            active: true,
            ...(bulkFormData.app_id && { app_id: bulkFormData.app_id })
        })
    });

    // Mutations
    const generateMutation = useMutation({
        mutationFn: generateActivationCode,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['activationCodes'] });
            toast.success(`تم إنشاء رمز التفعيل بنجاح: ${data.code}`);
            setShowForm(false);
            resetForm();
        },
        onError: (error: any) => toast.error(error.message || 'حدث خطأ أثناء إنشاء رمز التفعيل')
    });

    const validateMutation = useMutation({
        mutationFn: validateActivationCode,
        onSuccess: (data) => {
            const isActuallyUsed = data.used || (data.current_uses >= (data.max_uses || 1));
            if (isActuallyUsed) {
                setValidationResult({ status: 'used', message: 'هذا الرمز صالح ولكنه قد استُخدم بالكامل بالفعل.', data });
            } else {
                setValidationResult({ status: 'success', message: data.message || 'رمز صالح للاستخدام', data });
            }
        },
        onError: (error: any) => {
            const errorMsg = error.response?.data?.message || '';
            const isUsedMsg = errorMsg.toLowerCase().includes('used') || errorMsg.includes('استخدم');

            setValidationResult({
                status: isUsedMsg ? 'used' : 'error',
                message: isUsedMsg
                    ? 'هذا الرمز قد تم استخدامه مسبقاً.'
                    : (error.response?.data?.message || 'الرمز المدخل غير صحيح أو منتهي الصلاحية.')
            });
        }
    });

    const bulkGenerateMutation = useMutation({
        mutationFn: generateBulkCodes,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['activationCodes'] });
            setGeneratedBulkCodes(data.data);
            toast.success(`تم إنشاء ${data.data.quantity} رمز تفعيل بنجاح`);
        },
        onError: (error: any) => toast.error(error.message || 'حدث خطأ أثناء إنشاء الرموز')
    });

    const deleteMutation = useMutation({
        mutationFn: deleteActivationCode,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['activationCodes'] });
            toast.success('تم حذف الرمز بنجاح');
        },
        onError: (error: any) => toast.error(error.message || 'حدث خطأ أثناء حذف الرمز')
    });

    const resetForm = () => {
        setFormData({
            features: [],
            type: 'lifetime',
            expires_in_days: 30,
            duration_type: 'days',
            duration_value: 30,
            app_id: ''
        });
    };

    const filteredCodes = useMemo(() => {
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

    const stats = {
        total: codes.length,
        active: Array.isArray(codes) ? codes.filter(c => !c.used && (!c.expires_at || new Date(c.expires_at) > new Date())).length : 0,
        used: Array.isArray(codes) ? codes.filter(c => c.used || c.current_uses > 0).length : 0,
        expired: Array.isArray(codes) ? codes.filter(c => c.expires_at && new Date(c.expires_at) <= new Date()).length : 0
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canWriteActivationCodes()) return toast.error('ليس لديك صلاحية لإنشاء رموز التفعيل');

        if ((formData.type === 'custom' || formData.type === 'custom-lifetime') && formData.features.length === 0) {
            return toast.error('يرجى اختيار ميزة واحدة على الأقل');
        }

        let durationInDays: number | undefined;
        if (formData.type === 'custom' && formData.duration_type && formData.duration_value) {
            durationInDays = formData.duration_type === 'months' ? formData.duration_value * 30 : formData.duration_value;
        }

        const submitData = {
            type: formData.type,
            features: (formData.type !== 'lifetime') ? formData.features : undefined,
            expires_in_days: durationInDays,
            app_id: formData.app_id || undefined
        };

        generateMutation.mutate(submitData);
    };

    const handleBulkSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canWriteActivationCodes()) return toast.error('ليس لديك صلاحية لإنشاء رموز التفعيل');

        if (bulkFormData.quantity < 1 || bulkFormData.quantity > 100) {
            return toast.error('الكمية يجب أن تكون بين 1 و 100');
        }

        let durationInDays: number | undefined;
        if (bulkFormData.type === 'custom' && bulkFormData.duration_type && bulkFormData.duration_value) {
            durationInDays = bulkFormData.duration_type === 'months' ? bulkFormData.duration_value * 30 : bulkFormData.duration_value;
        }

        const submitData = {
            quantity: bulkFormData.quantity,
            type: bulkFormData.type,
            duration: durationInDays,
            features: (bulkFormData.type !== 'lifetime') ? bulkFormData.features : undefined,
            app_id: bulkFormData.app_id || undefined
        };

        bulkGenerateMutation.mutate(submitData);
    };

    const handleValidateCode = async () => {
        if (!canReadActivationCodes()) return toast.error('ليس لديك صلاحية للتحقق من الرموز');
        if (!validatingCode.trim()) return toast.error('يرجى إدخال رمز التفعيل');
        validateMutation.mutate(validatingCode);
    };

    const handleExport = async (format: 'pdf' | 'excel') => {
        try {
            await exportActivationCodes({
                format,
                allCodes: codes,
                availableFeatures
            });
            toast.success('تم التصدير بنجاح');
            setShowExportModal(false);
        } catch (error: any) {
            toast.error(error.message || 'حدث خطأ أثناء التصدير');
        }
    };

    const handleFeatureToggle = (featureName: string, isBulk: boolean = false) => {
        if (isBulk) {
            setBulkFormData(prev => ({
                ...prev,
                features: prev.features.includes(featureName)
                    ? prev.features.filter(name => name !== featureName)
                    : [...prev.features, featureName]
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                features: prev.features.includes(featureName)
                    ? prev.features.filter(name => name !== featureName)
                    : [...prev.features, featureName]
            }));
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('تم نسخ الرمز بنجاح');
    };

    // Permission Check Layout
    if (!canReadActivationCodes()) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card max-w-md w-full text-center p-8 border-red-500/20"
                >
                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldCheck className="w-10 h-10 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4 italic">دخول غير مصرح به</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                        ليس لديك الصلاحيات الكافية لعرض رموز التفعيل. يرجى التواصل مع مدير النظام للحصول على الصلاحيات المطلوبة.
                    </p>
                    <Button onClick={() => window.history.back()} className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 font-black">
                        العودة للخلف
                    </Button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-2"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                            <Key className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl italic">
                                رموز <span className="text-blue-600 dark:text-blue-400">التفعيل</span>
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 font-medium">إدارة وتوليد تراخيص النظام والأجهزة</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex flex-wrap gap-3"
                >
                    <button
                        onClick={() => setShowValidationModal(true)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl font-black border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all active:scale-95"
                    >
                        <Terminal className="h-4 w-4" />
                        تحقق من كود
                    </button>
                    {canWriteActivationCodes() && (
                        <>
                            <button
                                onClick={() => setShowBulkForm(true)}
                                className="flex items-center gap-2 px-6 py-2.5 bg-blue-50 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 rounded-xl font-black border border-blue-200 dark:border-blue-400/20 hover:bg-blue-100 transition-all active:scale-95"
                            >
                                <Layers className="h-4 w-4" />
                                توليد بالجملة
                            </button>
                            <button
                                onClick={() => setShowForm(true)}
                                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-black shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all active:scale-95"
                            >
                                <Plus className="h-4 w-4" />
                                كود جديد
                            </button>
                        </>
                    )}
                </motion.div>
            </div>

            {/* Stats Dashboard */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
                {[
                    { label: 'إجمالي الأكواد', value: stats.total, icon: Key, color: 'blue', sub: 'كل التراخيص' },
                    { label: 'أكواد متاحة', value: stats.active, icon: CheckCircle2, color: 'emerald', sub: 'جاهزة للاستعمال' },
                    { label: 'أكواد مستعملة', value: stats.used, icon: Zap, color: 'purple', sub: 'تراخيص مفعلة' },
                    { label: 'منتهية الصلاحية', value: stats.expired, icon: XCircle, color: 'rose', sub: 'تحتاج تجديد' },
                ].map((stat, i) => (
                    <div key={i} className="glass-card group hover:scale-[1.02] transition-all duration-300">
                        <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 bg-${stat.color}-500/10 dark:bg-${stat.color}-500/20 rounded-2xl flex items-center justify-center text-${stat.color}-600 dark:text-${stat.color}-400 group-hover:bg-${stat.color}-500 group-hover:text-white transition-all duration-500 shadow-inner`}>
                                <stat.icon className="h-7 w-7" />
                            </div>
                            <div>
                                <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{stat.label}</p>
                                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{stat.value}</h3>
                                <p className="text-[10px] font-bold text-slate-400">{stat.sub}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </motion.div>

            {/* Filter & Search Bar */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col md:flex-row gap-4 items-center bg-white/50 dark:bg-slate-800/50 p-4 rounded-3xl border border-white/20 dark:border-white/5 backdrop-blur-md"
            >
                <div className="relative flex-1 group w-full">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="ابحث عن كود، تطبيق، أو نوع الترخيص..."
                        className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-2xl py-3 pr-12 pl-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/50 dark:text-white transition-all outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    {['all', 'unused', 'used', 'expired'].map((type) => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`px-6 py-2.5 rounded-2xl text-xs font-black whitespace-nowrap transition-all border ${filterType === type
                                ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/25'
                                : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-blue-400'
                                }`}
                        >
                            {type === 'all' && 'الكل'}
                            {type === 'unused' && 'متاح'}
                            {type === 'used' && 'مستعمل'}
                            {type === 'expired' && 'منتهي'}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => setShowExportModal(true)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 rounded-2xl font-black text-xs hover:bg-slate-200 dark:hover:bg-white/10 transition-all border border-slate-200 dark:border-white/10"
                >
                    <FileSpreadsheet className="h-4 w-4" />
                    تصدير
                </button>
            </motion.div>

            {/* Results Table */}
            {isLoading ? (
                <div className="glass-card animate-pulse h-96 bg-slate-100 dark:bg-white/5"></div>
            ) : filteredCodes.length > 0 ? (
                <div className="glass-card p-0 overflow-hidden border-slate-200/50 dark:border-white/5">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-right border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-white/5 border-b border-slate-200/50 dark:border-white/5">
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">التطبيق</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">الرمز</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">النوع</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">الاستخدام</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">تاريخ الانتهاء</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">الحالة</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 text-center">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence mode="popLayout">
                                    {filteredCodes.map((code, index) => {
                                        const isExpired = code.expires_at && new Date() > new Date(code.expires_at);
                                        const isUsed = code.used || (code.current_uses >= (code.max_uses || 1));

                                        return (
                                            <motion.tr
                                                layout
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                transition={{ delay: index * 0.03 }}
                                                key={code._id || code.code}
                                                className="group border-b border-slate-100 dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-600">
                                                            <Smartphone className="h-4 w-4" />
                                                        </div>
                                                        <span className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[120px]">
                                                            {code.app?.name || 'أي تطبيق'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 group/code">
                                                        <span className="font-mono font-black text-sm tracking-wider text-slate-900 dark:text-white px-2 py-1 bg-slate-100 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10 group-hover/code:border-blue-500/50 transition-colors">
                                                            {code.code}
                                                        </span>
                                                        <button
                                                            onClick={() => copyToClipboard(code.code)}
                                                            className="p-1.5 opacity-0 group-hover/code:opacity-100 transition-opacity text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                                                        >
                                                            <Copy className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-xs font-bold dark:text-slate-300">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                                        {typeLabels[code.type as keyof typeof typeLabels] || code.type}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-1.5">
                                                        <div className="flex justify-between text-[10px] font-black text-slate-400">
                                                            <span>{code.current_uses}/{code.max_uses || 1}</span>
                                                        </div>
                                                        <div className="w-24 h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden border border-slate-200/50 dark:border-white/10">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${Math.min(((code.current_uses) / (code.max_uses || 1)) * 100, 100)}%` }}
                                                                className={`h-full rounded-full ${isUsed ? 'bg-indigo-500' : 'bg-blue-500'}`}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-xs font-bold dark:text-slate-300">
                                                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                                                        {code.expires_at ? new Date(code.expires_at).toLocaleDateString('ar-IQ') : 'دائم'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${isExpired ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                                                        isUsed ? 'bg-slate-500/10 text-slate-500 border border-slate-500/20' :
                                                            'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                                        }`}>
                                                        {isExpired ? 'منتهي' : isUsed ? 'مستعمل' : 'نشط'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            onClick={() => setShowDetails(showDetails === code.code ? null : code.code)}
                                                            className={`p-2 rounded-xl transition-all ${showDetails === code.code ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'}`}
                                                        >
                                                            <MoreVertical className="h-4 w-4" />
                                                        </button>
                                                        {canDeleteActivationCodes() && !code.used && (
                                                            <button
                                                                onClick={async () => {
                                                                    const confirmed = await confirm('هل أنت متأكد من حذف هذا الكود؟');
                                                                    if (confirmed) deleteMutation.mutate(code._id || code.code);
                                                                }}
                                                                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="text-center py-20 glass-card">
                    <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-10 h-10 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 italic">لم يتم العثور على نتائج</h3>
                    <p className="text-slate-500 dark:text-slate-400">جرب البحث بكلمات مختلفة أو تغيير معايير التصفية</p>
                </div>
            )}

            {/* Modal: Single Code Generation */}
            <AnimatePresence>
                {showForm && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                            onClick={() => setShowForm(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white dark:bg-[#0a0f18] w-full max-w-2xl rounded-[2.5rem] shadow-2xl relative overflow-hidden border border-white/20 dark:border-white/5"
                        >
                            <div className="p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
                                <div className="flex justify-between items-center mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                                            <Plus className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black italic text-slate-900 dark:text-white leading-none">توليد <span className="text-blue-600">كود</span> جديد</h2>
                                            <p className="text-slate-500 text-xs mt-1 font-bold">يرجى ملء تفاصيل الترخيص المطلوبة</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowForm(false)} className="p-3 hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl text-slate-500 transition-all"><XCircle className="h-6 w-6" /></button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-500 uppercase px-2">نوع الترخيص</label>
                                            <select
                                                value={formData.type}
                                                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                                className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/50 dark:text-white transition-all outline-none appearance-none"
                                            >
                                                <option value="lifetime">دائم (تفعيل لكل الميزات)</option>
                                                <option value="custom">مخصص (مدة محددة + ميزات مختارة)</option>
                                                <option value="custom-lifetime">مخصص دائم (ميزات مختارة فقط)</option>
                                                <option value="first-activation">التفعيل الأول</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-500 uppercase px-2">التطبيق الموجه له</label>
                                            <select
                                                value={formData.app_id}
                                                onChange={(e) => setFormData({ ...formData, app_id: e.target.value })}
                                                className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/50 dark:text-white transition-all outline-none appearance-none"
                                            >
                                                <option value="">كل التطبيقات</option>
                                                {availableApps.map(app => <option key={app._id} value={app._id}>{app.name}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    {(formData.type === 'custom' || formData.type === 'custom-lifetime' || formData.type === 'first-activation') && (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between px-2">
                                                <label className="text-xs font-black text-slate-500 uppercase flex items-center gap-2">
                                                    <ShieldCheck className="h-3 w-3" />
                                                    اختيار الميزات المصرح بـها
                                                </label>
                                                <div className="flex gap-2">
                                                    <button type="button" onClick={() => setFormData({ ...formData, features: availableFeatures.map(f => f.name) })} className="text-[10px] font-black text-blue-600">اختيار الكل</button>
                                                    <span className="text-slate-300">|</span>
                                                    <button type="button" onClick={() => setFormData({ ...formData, features: [] })} className="text-[10px] font-black text-slate-500">مسح</button>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-4 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-200/50 dark:border-white/5 custom-scrollbar">
                                                {availableFeatures.map(feature => (
                                                    <button
                                                        key={feature._id}
                                                        type="button"
                                                        onClick={() => handleFeatureToggle(feature.name)}
                                                        className={`p-3 rounded-xl text-[10px] font-black text-right transition-all border ${formData.features.includes(feature.name)
                                                            ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                                                            }`}
                                                    >
                                                        {feature.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {formData.type === 'custom' && (
                                        <div className="space-y-4">
                                            <label className="text-xs font-black text-slate-500 uppercase px-2">مدة الصلاحية</label>
                                            <div className="flex gap-3">
                                                <input
                                                    type="number"
                                                    value={formData.duration_value}
                                                    onChange={(e) => setFormData({ ...formData, duration_value: parseInt(e.target.value) })}
                                                    className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/50 dark:text-white transition-all outline-none"
                                                />
                                                <select
                                                    value={formData.duration_type}
                                                    onChange={(e) => setFormData({ ...formData, duration_type: e.target.value as any })}
                                                    className="w-32 bg-slate-100 dark:bg-white/5 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/50 dark:text-white transition-all outline-none appearance-none"
                                                >
                                                    <option value="days">أيام</option>
                                                    <option value="months">شهور</option>
                                                </select>
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-4 flex gap-3">
                                        <button
                                            type="submit"
                                            disabled={generateMutation.isPending}
                                            className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-500/25 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                                        >
                                            {generateMutation.isPending ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5 group-hover:scale-110 transition-transform" />}
                                            إنشاء الكود الآن
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowForm(false)}
                                            className="px-8 bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white py-4 rounded-2xl font-black hover:bg-slate-200 transition-all"
                                        >
                                            إلغاء
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal: Bulk Generation */}
            <AnimatePresence>
                {showBulkForm && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                            onClick={() => setShowBulkForm(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-[#0a0f18] w-full max-w-2xl rounded-[2.5rem] shadow-2xl relative overflow-hidden border border-white/20 dark:border-white/5"
                        >
                            <div className="p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
                                {generatedBulkCodes ? (
                                    <div className="space-y-8 py-4">
                                        <div className="text-center">
                                            <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/20">
                                                <Check className="w-10 h-10 text-white" />
                                            </div>
                                            <h2 className="text-3xl font-black italic dark:text-white">تم التوليد بنجاح!</h2>
                                            <p className="text-slate-500 text-sm mt-2 font-bold font-mono">الدفعة: {generatedBulkCodes.batchId}</p>
                                        </div>

                                        <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-[2rem] border border-slate-200 dark:border-white/5">
                                            <p className="text-[10px] font-black text-slate-400 uppercase mb-4 px-2">الأكواد الجديدة ({generatedBulkCodes.codes.length})</p>
                                            <div className="space-y-3 max-h-60 overflow-y-auto px-1 custom-scrollbar">
                                                {generatedBulkCodes.codes.map((c: any, i: number) => (
                                                    <div key={i} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-white/5">
                                                        <span className="font-mono text-sm font-black dark:text-white">{c.code}</span>
                                                        <span className="text-[10px] font-bold text-slate-400">{typeLabels[c.type as keyof typeof typeLabels]}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                onClick={() => {
                                                    const text = generatedBulkCodes.codes.map((c: any) => c.code).join('\n');
                                                    navigator.clipboard.writeText(text);
                                                    toast.success('تم نسخ كل الرموز');
                                                }}
                                                className="flex flex-col items-center gap-2 p-6 bg-blue-50 dark:bg-blue-600/10 rounded-3xl border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 hover:scale-[1.02] transition-all"
                                            >
                                                <Copy className="h-6 w-6" />
                                                <span className="text-xs font-black">نسخ الكل</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const text = generatedBulkCodes.codes.map((c: any) => `${c.code}\t${c.type}`).join('\n');
                                                    const blob = new Blob([text], { type: 'text/plain' });
                                                    const url = window.URL.createObjectURL(blob);
                                                    const a = document.createElement('a');
                                                    a.href = url;
                                                    a.download = `URUX_Codes_${generatedBulkCodes.batchId}.txt`;
                                                    a.click();
                                                }}
                                                className="flex flex-col items-center gap-2 p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:scale-[1.02] transition-all"
                                            >
                                                <Download className="h-6 w-6" />
                                                <span className="text-xs font-black">تحميل TXT</span>
                                            </button>
                                        </div>

                                        <button
                                            onClick={() => {
                                                setGeneratedBulkCodes(null);
                                                setShowBulkForm(false);
                                            }}
                                            className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 py-4 rounded-2xl font-black transition-all hover:scale-[0.98]"
                                        >
                                            إغلاق
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex justify-between items-center mb-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
                                                    <Layers className="h-6 w-6 text-white" />
                                                </div>
                                                <div>
                                                    <h2 className="text-2xl font-black italic text-slate-900 dark:text-white leading-none">توليد <span className="text-indigo-600">بالجملة</span></h2>
                                                    <p className="text-slate-500 text-xs mt-1 font-bold">توليد مجموعة كاملة من التراخيص مرة واحدة</p>
                                                </div>
                                            </div>
                                            <button onClick={() => setShowBulkForm(false)} className="p-3 hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl"><XCircle className="h-6 w-6" /></button>
                                        </div>

                                        <form onSubmit={handleBulkSubmit} className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-black text-slate-500 uppercase px-2 text-right block">الكمية المطلوبة</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max="100"
                                                        value={bulkFormData.quantity}
                                                        onChange={(e) => setBulkFormData({ ...bulkFormData, quantity: parseInt(e.target.value) })}
                                                        className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500/50 dark:text-white outline-none"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-black text-slate-500 uppercase px-2 text-right block">نوع الترخيص</label>
                                                    <select
                                                        value={bulkFormData.type}
                                                        onChange={(e) => setBulkFormData({ ...bulkFormData, type: e.target.value as any })}
                                                        className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500/50 dark:text-white outline-none appearance-none"
                                                    >
                                                        <option value="lifetime">دائم</option>
                                                        <option value="custom">مخصص</option>
                                                        <option value="custom-lifetime">مخصص دائم</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-500 uppercase px-2 text-right block">التطبيق الموجه له</label>
                                                <select
                                                    value={bulkFormData.app_id}
                                                    onChange={(e) => setBulkFormData({ ...bulkFormData, app_id: e.target.value })}
                                                    className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500/50 dark:text-white outline-none appearance-none"
                                                >
                                                    <option value="">كل التطبيقات</option>
                                                    {availableApps.map(app => <option key={app._id} value={app._id}>{app.name}</option>)}
                                                </select>
                                            </div>

                                            {(bulkFormData.type === 'custom' || bulkFormData.type === 'custom-lifetime') && (
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between px-2">
                                                        <label className="text-xs font-black text-slate-500 uppercase">الميزات المصرح بها</label>
                                                        <button type="button" onClick={() => setBulkFormData({ ...bulkFormData, features: availableFeaturesBulk.map(f => f.name) })} className="text-[10px] font-black text-indigo-600">اختيار الجميع</button>
                                                    </div>
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-4 bg-slate-50 dark:bg-white/5 rounded-[2rem] border border-slate-200/50 dark:border-white/5">
                                                        {availableFeaturesBulk.map(feature => (
                                                            <button
                                                                key={feature._id}
                                                                type="button"
                                                                onClick={() => handleFeatureToggle(feature.name, true)}
                                                                className={`p-3 rounded-xl text-[10px] font-black transition-all border ${bulkFormData.features.includes(feature.name)
                                                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                                                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                                                                    }`}
                                                            >
                                                                {feature.name}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="pt-4 flex gap-3">
                                                <button
                                                    type="submit"
                                                    disabled={bulkGenerateMutation.isPending}
                                                    className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                                                >
                                                    {bulkGenerateMutation.isPending ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Layers className="h-5 w-5" />}
                                                    توليد {bulkFormData.quantity} كود الآن
                                                </button>
                                                <button type="button" onClick={() => setShowBulkForm(false)} className="px-8 bg-slate-100 dark:bg-white/10 py-4 rounded-2xl font-black">إلغاء</button>
                                            </div>
                                        </form>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal: Verification */}
            <AnimatePresence>
                {showValidationModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                            onClick={() => setShowValidationModal(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-[#0a0f18] w-full max-w-lg rounded-[2.5rem] shadow-2xl relative overflow-hidden p-8 border border-white/20 dark:border-white/5"
                        >
                            <div className="text-center space-y-6">
                                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto transition-colors duration-500 ${validationResult
                                        ? (validationResult.status === 'success' ? 'bg-emerald-500/20 text-emerald-500' :
                                            validationResult.status === 'used' ? 'bg-amber-500/20 text-amber-500' :
                                                'bg-rose-500/20 text-rose-500')
                                        : 'bg-blue-600/10 text-blue-600'
                                    }`}>
                                    {validationResult ? (
                                        validationResult.status === 'success' ? <CheckCircle2 className="w-10 h-10" /> :
                                            validationResult.status === 'used' ? <AlertTriangle className="w-10 h-10" /> :
                                                <XCircle className="w-10 h-10" />
                                    ) : <Terminal className="w-10 h-10" />}
                                </div>

                                <div>
                                    <h2 className="text-2xl font-black italic dark:text-white">
                                        {validationResult ? (
                                            validationResult.status === 'success' ? 'الرمز صالح' :
                                                validationResult.status === 'used' ? 'الرمز مستخدم' :
                                                    'خطأ في التحقق'
                                        ) : 'التحقق من الرمز'}
                                    </h2>
                                    <p className="text-slate-500 text-sm font-bold leading-relaxed px-4 mt-2">
                                        {validationResult ? validationResult.message : 'أدخل رمز التفعيل أدناه للتحقق من صلاحيته وتفاصيله الحالية في النظام.'}
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    {!validationResult ? (
                                        <div className="space-y-4">
                                            <input
                                                type="text"
                                                placeholder="EX: URUX-XXXX-XXXX"
                                                className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-2xl p-5 text-center font-mono font-black text-xl tracking-[0.2em] focus:ring-4 focus:ring-blue-500/20 dark:text-white transition-all outline-none"
                                                value={validatingCode}
                                                onChange={(e) => setValidatingCode(e.target.value)}
                                            />
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={handleValidateCode}
                                                    disabled={validateMutation.isPending}
                                                    className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-500/25 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                                                >
                                                    {validateMutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Terminal className="h-4 w-4" />}
                                                    بدء التحقق
                                                </button>
                                                <button onClick={() => setShowValidationModal(false)} className="px-6 bg-slate-100 dark:bg-white/10 py-4 rounded-2xl font-black">إلغاء</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {(validationResult.status === 'success' || validationResult.status === 'used') && validationResult.data && (
                                                <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 text-right space-y-2">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase">نوع الرمز</span>
                                                        <span className="text-xs font-bold dark:text-white">{validationResult.data.type || '---'}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase">تاريخ الانتهاء</span>
                                                        <span className="text-xs font-bold dark:text-white">
                                                            {validationResult.data.expiresAt ? new Date(validationResult.data.expiresAt).toLocaleDateString('ar-IQ') : 'دائم'}
                                                        </span>
                                                    </div>
                                                    {validationResult.status === 'used' && (
                                                        <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-white/5">
                                                            <span className="text-[10px] font-black text-amber-500 uppercase italic">حالة الاستخدام</span>
                                                            <span className="text-[10px] font-black text-amber-500">تم استنفاد جميع المحاولات</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => {
                                                        setValidationResult(null);
                                                        setValidatingCode('');
                                                    }}
                                                    className="flex-1 bg-slate-900 dark:bg-white dark:text-slate-900 py-4 rounded-2xl font-black transition-all"
                                                >
                                                    تحقق من رمز آخر
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setShowValidationModal(false);
                                                        setValidationResult(null);
                                                        setValidatingCode('');
                                                    }}
                                                    className="px-8 bg-slate-100 dark:bg-white/10 py-4 rounded-2xl font-black"
                                                >
                                                    إغلاق
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal: Exporting */}
            <AnimatePresence>
                {showExportModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowExportModal(false)} />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-[#0a0f18] w-full max-w-sm rounded-[2.5rem] shadow-2xl relative p-8 border border-white/20 dark:border-white/5 text-center"
                        >
                            <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <FileSpreadsheet className="w-8 h-8 text-blue-600" />
                            </div>
                            <h2 className="text-xl font-black italic mb-6 dark:text-white truncate">تصدير <span className="text-blue-600">البيانات</span></h2>

                            <div className="space-y-4">
                                <button
                                    onClick={() => handleExport('excel')}
                                    className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all border border-slate-200 dark:border-white/10 group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-500 rounded-lg text-white"><FileSpreadsheet className="w-4 h-4" /></div>
                                        <span className="text-sm font-black dark:text-white">Excel Spreadsheet</span>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-[-4px] transition-transform" />
                                </button>
                                <button
                                    onClick={() => handleExport('pdf')}
                                    className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all border border-slate-200 dark:border-white/10 group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-rose-500 rounded-lg text-white"><FileText className="w-4 h-4" /></div>
                                        <span className="text-sm font-black dark:text-white">PDF Document</span>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-[-4px] transition-transform" />
                                </button>
                            </div>
                            <button onClick={() => setShowExportModal(false)} className="mt-8 text-xs font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors">إغلاق النافذة</button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
