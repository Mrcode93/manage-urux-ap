import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import type { Backup, BackupStats } from '../api/client';
import {
    createBackup,
    getBackups,
    getBackupStats,
    downloadBackup,
    deleteBackup,
    restoreBackup
} from '../api/client';
import Button from '../components/Button';
import Skeleton from '../components/Skeleton';
import { toast } from 'react-hot-toast';
import { usePermissions } from '../hooks/usePermissions';
import { BackupsWriteGuard } from '../components/PermissionGuard';
import {
    Plus,
    RefreshCw,
    Download,
    Trash2,
    Database,
    Cloud,
    HardDrive,
    ShieldCheck,
    Clock,
    Archive,
    Info,
    AlertTriangle,
    RotateCcw,
    FileText,
    CheckCircle
} from 'lucide-react';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: 'spring',
            stiffness: 100
        }
    }
};

export default function Backups() {
    const { canReadBackups, canWriteBackups, canDeleteBackups } = usePermissions();
    const [isCreating, setIsCreating] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<Backup | null>(null);
    const [restoreConfirm, setRestoreConfirm] = useState<Backup | null>(null);

    // Page-level permission check
    if (!canReadBackups()) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="p-6 glass-card border-red-500/20 text-center space-y-4 max-w-md">
                    <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        لا توجد صلاحية للوصول
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400">
                        ليس لديك صلاحية لقراءة النسخ الاحتياطية. مطلوب صلاحية: <code className="px-2 py-1 bg-red-100 dark:bg-red-900/30 rounded text-red-600 dark:text-red-400 font-mono text-sm">backups:read</code>
                    </p>
                </div>
            </div>
        );
    }

    const queryClient = useQueryClient();

    // Fetch backups
    const { data: backups = [], isLoading } = useQuery<Backup[]>({
        queryKey: ['backups'],
        queryFn: () => getBackups()
    });

    // Fetch backup stats
    const { data: stats } = useQuery<BackupStats>({
        queryKey: ['backup-stats'],
        queryFn: () => getBackupStats()
    });

    // Create backup mutation
    const createMutation = useMutation({
        mutationFn: () => createBackup(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['backups'] });
            queryClient.invalidateQueries({ queryKey: ['backup-stats'] });
            toast.success('تم إنشاء النسخة الاحتياطية بنجاح في Google Cloud', { icon: '✅' });
            setIsCreating(false);
        },
        onError: (error: any) => {
            toast.error(error.message || 'حدث خطأ أثناء إنشاء النسخة الاحتياطية', { icon: '❌' });
            setIsCreating(false);
        }
    });

    // Delete backup mutation
    const deleteMutation = useMutation({
        mutationFn: (filename: string) => deleteBackup(filename),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['backups'] });
            queryClient.invalidateQueries({ queryKey: ['backup-stats'] });
            toast.success('تم حذف النسخة الاحتياطية بنجاح', { icon: '🗑️' });
            setDeleteConfirm(null);
        },
        onError: (error: any) => {
            toast.error(error.message || 'حدث خطأ أثناء حذف النسخة الاحتياطية', { icon: '❌' });
        }
    });

    // Restore backup mutation
    const restoreMutation = useMutation({
        mutationFn: (filename: string) => restoreBackup(filename),
        onSuccess: () => {
            toast.success('تم استعادة النسخة الاحتياطية بنجاح', { icon: '🔄' });
            setRestoreConfirm(null);
        },
        onError: (error: any) => {
            toast.error(error.message || 'حدث خطأ أثناء استعادة النسخة الاحتياطية', { icon: '❌' });
        }
    });

    const handleCreateBackup = () => {
        if (!canWriteBackups()) {
            toast.error('ليس لديك صلاحية لإنشاء نسخ احتياطية');
            return;
        }
        setIsCreating(true);
        createMutation.mutate();
    };

    const handleDownloadBackup = async (backup: Backup) => {
        try {
            const blob = await downloadBackup(backup.filename);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', backup.filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success('تم بدء تحميل النسخة الاحتياطية', { icon: '⬇️' });
        } catch (error: any) {
            toast.error(error.message || 'حدث خطأ أثناء تحميل النسخة الاحتياطية', { icon: '❌' });
        }
    };

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (date: string | Date): string => {
        return new Date(date).toLocaleString('ar-IQ', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (isLoading) {
        return (
            <div className="space-y-8 p-4">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="space-y-2">
                        <Skeleton width={300} height={32} />
                        <Skeleton width={400} height={20} />
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} height={100} variant="rectangular" className="rounded-2xl" />
                    ))}
                </div>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <Skeleton key={i} height={80} variant="rectangular" className="rounded-2xl" />
                    ))}
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
            {/* Header */}
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300">
                        إدارة النسخ الاحتياطية
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">
                        إنشاء وإدارة نسخ احتياطية لقاعدة البيانات في Google Cloud بشكل آمن
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    <Button
                        onClick={() => queryClient.invalidateQueries({ queryKey: ['backups'] })}
                        variant="secondary"
                        size="sm"
                        className="glass shadow-none border-slate-200 dark:border-slate-800 flex-1 sm:flex-none"
                    >
                        <RefreshCw className="h-4 w-4 ml-2" />
                        تحديث
                    </Button>
                    <BackupsWriteGuard>
                        <Button
                            onClick={handleCreateBackup}
                            isLoading={isCreating}
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 flex-1 sm:flex-none"
                        >
                            <Plus className="h-4 w-4 ml-2" />
                            إنشاء نسخة احتياطية
                        </Button>
                    </BackupsWriteGuard>
                </div>
            </header>

            {/* Stats Overview */}
            {stats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <motion.div variants={itemVariants} className="glass-card p-4 border border-slate-200 dark:border-slate-800/50 flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                            <Archive className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">إجمالي النسخ</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalBackups}</p>
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="glass-card p-4 border border-slate-200 dark:border-slate-800/50 flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                            <HardDrive className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">إجمالي الحجم</p>
                            <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.totalSizeFormatted}</p>
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="glass-card p-4 border border-slate-200 dark:border-slate-800/50 flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                            <Info className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">متوسط الحجم</p>
                            <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.averageSizeFormatted}</p>
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="glass-card p-4 border border-slate-200 dark:border-slate-800/50 flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                            <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">آخر نسخة</p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[150px]">
                                {stats.newestBackup ? formatDate(stats.newestBackup) : 'لا توجد'}
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* S3 Info Banner */}
            <motion.div variants={itemVariants} className="glass-card p-6 border border-green-500/20 bg-green-50/30 dark:bg-green-900/10 flex items-center gap-4">
                <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center">
                    <Cloud className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        التخزين السحابي الآمن Google Cloud
                        <ShieldCheck className="h-5 w-5 text-green-500" />
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 font-medium">
                        يتم تشفير وتأمين جميع بياناتك في مراكز بيانات AWS المتعددة لضمان استمرارية العمل.
                    </p>
                </div>
            </motion.div>

            {/* Backups List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        النسخ المتاحة ({backups.length})
                    </h2>
                </div>

                <AnimatePresence mode="popLayout">
                    {backups.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-card p-12 text-center"
                        >
                            <Archive className="h-16 w-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">لا توجد نسخ احتياطية</h3>
                            <p className="text-slate-500 dark:text-slate-400 mt-2">ابدأ بإنشاء نسخة احتياطية جديدة الآن.</p>
                        </motion.div>
                    ) : (
                        <div className="space-y-4">
                            {backups.map((backup) => (
                                <motion.div
                                    key={backup.filename}
                                    variants={itemVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="glass-card group hover:border-blue-500/30 transition-all duration-300"
                                >
                                    <div className="p-4 sm:p-6">
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                            <div className="flex items-start gap-4">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${backup.storageType === 's3'
                                                    ? 'bg-green-100 dark:bg-green-900/30 group-hover:bg-green-200 dark:group-hover:bg-green-900/50'
                                                    : 'bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50'
                                                    }`}>
                                                    {backup.storageType === 's3' ? (
                                                        <ShieldCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
                                                    ) : (
                                                        <Database className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                                    )}
                                                </div>
                                                <div className="space-y-1">
                                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white break-all">
                                                        {backup.filename}
                                                    </h3>
                                                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                                                        <span className="flex items-center gap-1">
                                                            <HardDrive className="h-3.5 w-3.5" />
                                                            {formatBytes(backup.size)}
                                                        </span>
                                                        <span className="flex items-center gap-1 border-r border-slate-200 dark:border-slate-800 pr-3 mr-3">
                                                            <Clock className="h-3.5 w-3.5" />
                                                            {formatDate(backup.createdAt)}
                                                        </span>
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${backup.storageType === 's3'
                                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                            }`}>
                                                            {backup.storageType === 's3' ? 'سحابي (S3)' : 'محلي'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => handleDownloadBackup(backup)}
                                                    className="p-2 h-9 w-9 glass-card shadow-none border-slate-200 dark:border-slate-800 hover:text-blue-500"
                                                    title="تحميل"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => setRestoreConfirm(backup)}
                                                    className="p-2 h-9 w-9 glass-card shadow-none border-slate-200 dark:border-slate-800 hover:text-green-500"
                                                    title="استعادة"
                                                >
                                                    <RotateCcw className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => setDeleteConfirm(backup)}
                                                    className="p-2 h-9 w-9 glass-card shadow-none border-slate-200 dark:border-slate-800 hover:text-red-500 text-red-400"
                                                    title="حذف"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {deleteConfirm && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="glass-card max-w-md w-full p-6 shadow-2xl border border-red-500/20"
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center">
                                    <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">تأكيد الحذف</h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm">لا يمكن التراجع عن هذا الإجراء</p>
                                </div>
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
                                هل أنت متأكد من حذف النسخة الاحتياطية <span className="font-bold text-red-500 break-all">"{deleteConfirm.filename}"</span>؟
                            </p>
                            <div className="flex gap-3">
                                <Button
                                    variant="secondary"
                                    onClick={() => setDeleteConfirm(null)}
                                    className="flex-1 glass-card shadow-none border-slate-200 dark:border-slate-800"
                                >
                                    إلغاء
                                </Button>
                                <Button
                                    variant="danger"
                                    onClick={() => deleteMutation.mutate(deleteConfirm.filename)}
                                    isLoading={deleteMutation.isPending}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/25"
                                >
                                    حذف نهائي
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {restoreConfirm && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="glass-card max-w-md w-full p-6 shadow-2xl border border-blue-500/20"
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
                                    <RotateCcw className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">تأكيد الاستعادة</h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm">سيتم استبدال قاعدة البيانات الحالية!</p>
                                </div>
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
                                هل أنت متأكد من استعادة النسخة الاحتياطية <span className="font-bold text-blue-500 break-all">"{restoreConfirm.filename}"</span>؟
                                هذا الإجراء سيقوم بتحديث جميع بيانات النظام الحالية لتطابق محتوى النسخة.
                            </p>
                            <div className="flex gap-3">
                                <Button
                                    variant="secondary"
                                    onClick={() => setRestoreConfirm(null)}
                                    className="flex-1 glass-card shadow-none border-slate-200 dark:border-slate-800"
                                >
                                    إلغاء
                                </Button>
                                <Button
                                    onClick={() => restoreMutation.mutate(restoreConfirm.filename)}
                                    isLoading={restoreMutation.isPending}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25"
                                >
                                    تأكيد الاستعادة
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
