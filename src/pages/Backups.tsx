import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import Table, { type Column } from '../components/Table';
import ConfirmDialog from '../components/ConfirmDialog';
import { toast } from 'react-hot-toast';
import { usePermissions } from '../hooks/usePermissions';
import { BackupsWriteGuard } from '../components/PermissionGuard';
import { 
    PlusIcon, 
    CloudArrowDownIcon, 
    TrashIcon, 
    ArrowPathIcon,
    DocumentArrowDownIcon,
    InformationCircleIcon,
    ClockIcon,
    ArchiveBoxIcon,
    ShieldCheckIcon
} from '@heroicons/react/24/outline';

export default function Backups() {
    const { canReadBackups, canWriteBackups, canDeleteBackups } = usePermissions();
    const [isCreating, setIsCreating] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; backup: Backup | null }>({ isOpen: false, backup: null });
    const [restoreConfirm, setRestoreConfirm] = useState<{ isOpen: boolean; backup: Backup | null }>({ isOpen: false, backup: null });

    // Page-level permission check
    if (!canReadBackups()) {
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
                                <p>ليس لديك صلاحية لقراءة النسخ الاحتياطية. مطلوب صلاحية: <strong>backups:read</strong></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const queryClient = useQueryClient();

    // Fetch backups from S3 (no location filtering needed)
    const { data: backups = [], isLoading } = useQuery<Backup[]>({
        queryKey: ['backups'],
        queryFn: () => getBackups() // Get all S3 backups
    });

    // Fetch backup stats from S3
    const { data: stats } = useQuery<BackupStats>({
        queryKey: ['backup-stats'],
        queryFn: () => getBackupStats() // Get S3 backup stats
    });

    // Create backup mutation - always creates to S3
    const createMutation = useMutation({
        mutationFn: () => createBackup(), // No location needed - always S3
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['backups'] });
            queryClient.invalidateQueries({ queryKey: ['backup-stats'] });
            toast.success('تم إنشاء النسخة الاحتياطية بنجاح في AWS S3');
            setIsCreating(false);
        },
        onError: (error: any) => {
            console.error('Backup creation error:', error);
            toast.error(error.message || 'حدث خطأ أثناء إنشاء النسخة الاحتياطية');
            setIsCreating(false);
        }
    });

    // Delete backup mutation - S3 only
    const deleteMutation = useMutation({
        mutationFn: (filename: string) => deleteBackup(filename), // No location needed for S3
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['backups'] });
            queryClient.invalidateQueries({ queryKey: ['backup-stats'] });
            toast.success('تم حذف النسخة الاحتياطية بنجاح');
        },
        onError: (error: any) => {
            toast.error(error.message || 'حدث خطأ أثناء حذف النسخة الاحتياطية');
        }
    });

    // Restore backup mutation - S3 only
    const restoreMutation = useMutation({
        mutationFn: (filename: string) => restoreBackup(filename), // No location needed for S3
        onSuccess: () => {
            toast.success('تم استعادة النسخة الاحتياطية بنجاح');
        },
        onError: (error: any) => {
            toast.error(error.message || 'حدث خطأ أثناء استعادة النسخة الاحتياطية');
        }
    });

    const handleCreateBackup = async () => {
        if (!canWriteBackups()) {
            toast.error('ليس لديك صلاحية لإنشاء نسخ احتياطية');
            return;
        }
        
        // Backups are now restricted to S3 only - no location selection needed
        setIsCreating(true);
        createMutation.mutate();
    };

    const handleDeleteBackup = (backup: Backup) => {
        if (!canDeleteBackups()) {
            toast.error('ليس لديك صلاحية لحذف النسخ الاحتياطية');
            return;
        }
        setDeleteConfirm({ isOpen: true, backup });
    };

    const confirmDelete = async () => {
        if (deleteConfirm.backup) {
            await deleteMutation.mutateAsync(deleteConfirm.backup.filename);
            setDeleteConfirm({ isOpen: false, backup: null });
        }
    };

    const handleRestoreBackup = (backup: Backup) => {
        if (!canWriteBackups()) {
            toast.error('ليس لديك صلاحية لاستعادة النسخ الاحتياطية');
            return;
        }
        setRestoreConfirm({ isOpen: true, backup });
    };

    const confirmRestore = async () => {
        if (restoreConfirm.backup) {
            await restoreMutation.mutateAsync(restoreConfirm.backup.filename);
            setRestoreConfirm({ isOpen: false, backup: null });
        }
    };

    const handleDownloadBackup = async (backup: Backup) => {
        try {
            const blob = await downloadBackup(backup.filename); // No location needed for S3
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', backup.filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success('تم بدء تحميل النسخة الاحتياطية');
        } catch (error: any) {
            toast.error(error.message || 'حدث خطأ أثناء تحميل النسخة الاحتياطية');
        }
    };

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (date: Date): string => {
        return new Date(date).toLocaleString('ar-IQ');
    };


    const columns: Column<Backup>[] = [
        { 
            header: 'اسم الملف', 
            accessorKey: 'filename',
            cell: ({ row }) => (
                <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        row.original.storageType === 's3' 
                            ? 'bg-green-100 dark:bg-green-900' 
                            : 'bg-blue-100 dark:bg-blue-900'
                    }`}>
                        {row.original.storageType === 's3' ? (
                            <ShieldCheckIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                        ) : (
                            <CloudArrowDownIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        )}
                    </div>
                    <div>
                        <span className="font-medium text-gray-900 dark:text-white">
                            {row.original.filename}
                        </span>
                        {row.original.storageType && (
                            <div className="flex items-center gap-1 mt-1">
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                                    row.original.storageType === 's3'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                }`}>
                                    {row.original.storageType === 's3' ? 'S3' : 'محلي'}
                                </span>
                                {row.original.backupType && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                        {row.original.backupType}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )
        },
        { 
            header: 'الحجم',
            accessorKey: 'size',
            cell: ({ row }) => (
                <span className="text-sm text-gray-600 dark:text-gray-300">
                    {formatBytes(row.original.size)}
                </span>
            )
        },
        { 
            header: 'تاريخ الإنشاء',
            accessorKey: 'createdAt',
            cell: ({ row }) => (
                <span className="text-sm text-gray-600 dark:text-gray-300">
                    {formatDate(row.original.createdAt)}
                </span>
            )
        },
        { 
            header: 'آخر تعديل',
            accessorKey: 'modifiedAt',
            cell: ({ row }) => (
                <span className="text-sm text-gray-600 dark:text-gray-300">
                    {formatDate(row.original.modifiedAt)}
                </span>
            )
        },
        {
            header: 'التخزين',
            accessorKey: 'storageType',
            cell: ({ row }) => (
                <div className="flex flex-col gap-1">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        row.original.storageType === 's3'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}>
                        {row.original.storageType === 's3' ? 'S3 السحابي' : 'محلي'}
                    </span>
                    {row.original.database && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            {row.original.database}
                        </span>
                    )}
                </div>
            )
        },
        {
            header: 'الإجراءات',
            accessorKey: 'actions',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleDownloadBackup(row.original)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        title="تحميل"
                    >
                        <DocumentArrowDownIcon className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => handleRestoreBackup(row.original)}
                        disabled={restoreMutation.isPending}
                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50"
                        title="استعادة"
                    >
                        {restoreMutation.isPending ? (
                            <ArrowPathIcon className="h-4 w-4 animate-spin" />
                        ) : (
                            <CloudArrowDownIcon className="h-4 w-4" />
                        )}
                    </button>
                    <button
                        onClick={() => handleDeleteBackup(row.original)}
                        disabled={deleteMutation.isPending}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                        title="حذف"
                    >
                        {deleteMutation.isPending ? (
                            <ArrowPathIcon className="h-4 w-4 animate-spin" />
                        ) : (
                            <TrashIcon className="h-4 w-4" />
                        )}
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                    <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">إدارة النسخ الاحتياطية</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        إنشاء وإدارة نسخ احتياطية لقاعدة البيانات في AWS S3
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            <ShieldCheckIcon className="h-3 w-3 mr-1" />
                            AWS S3
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            <ShieldCheckIcon className="h-3 w-3 mr-1" />
                            متكامل
                        </span>
                    </div>
                    {/* Permission Indicators */}
                    <div className="mt-2 flex flex-wrap gap-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            canReadBackups() ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                            قراءة النسخ الاحتياطية {canReadBackups() ? '✓' : '✗'}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            canWriteBackups() ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                            إنشاء/استعادة النسخ الاحتياطية {canWriteBackups() ? '✓' : '✗'}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            canDeleteBackups() ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                            حذف النسخ الاحتياطية {canDeleteBackups() ? '✓' : '✗'}
                        </span>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {/* S3 Location Indicator - Backups are now S3 only */}
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <ShieldCheckIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-medium text-green-800 dark:text-green-200">
                            AWS S3
                        </span>
                    </div>
                    
                    <BackupsWriteGuard>
                        <Button
                            onClick={handleCreateBackup}
                            disabled={isCreating}
                            className="w-full sm:w-auto flex items-center justify-center gap-2"
                        >
                            {isCreating ? (
                                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                            ) : (
                                <PlusIcon className="h-4 w-4" />
                            )}
                            <span className="hidden sm:inline">
                                {isCreating ? 'جاري الإنشاء...' : 'إنشاء نسخة احتياطية'}
                            </span>
                            <span className="sm:hidden">
                                {isCreating ? 'جاري الإنشاء...' : 'إنشاء نسخة'}
                            </span>
                        </Button>
                    </BackupsWriteGuard>
                </div>
            </div>

            {/* S3 Storage Info */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <div className="flex items-center gap-2">
                    <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                            <ShieldCheckIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                    <div className="ml-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            التخزين السحابي AWS S3
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            جميع النسخ الاحتياطية يتم تخزينها في AWS S3 بشكل آمن
                        </p>
                    </div>
                    <div className="ml-auto">
                        <ShieldCheckIcon className="h-8 w-8 text-green-500" />
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                        <div className="flex items-center gap-2">
                            <div className="flex-shrink-0 ">
                                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                                    <ArchiveBoxIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">إجمالي النسخ الاحتياطية</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalBackups}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                        <div className="flex items-center gap-2">
                            <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                                    <DocumentArrowDownIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">إجمالي الحجم</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalSizeFormatted}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                        <div className="flex items-center gap-2">
                            <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                                    <InformationCircleIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">متوسط الحجم</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.averageSizeFormatted}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                        <div className="flex items-center gap-2">
                            <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                                    <ClockIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">آخر نسخة احتياطية</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {stats.newestBackup ? formatDate(stats.newestBackup) : 'لا توجد'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Backups Table */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        النسخ الاحتياطية المتاحة ({backups.length})
                    </h2>
                    <Table
                        columns={columns}
                        data={backups}
                        isLoading={isLoading}
                        emptyMessage="لا توجد نسخ احتياطية"
                    />
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                title="تأكيد الحذف"
                message={`هل أنت متأكد من حذف النسخة الاحتياطية "${deleteConfirm.backup?.filename}"؟`}
                confirmText="حذف"
                cancelText="إلغاء"
                onConfirm={confirmDelete}
                onCancel={() => setDeleteConfirm({ isOpen: false, backup: null })}
                variant="danger"
            />

            {/* Restore Confirmation Dialog */}
            <ConfirmDialog
                isOpen={restoreConfirm.isOpen}
                title="تأكيد الاستعادة"
                message={`هل أنت متأكد من استعادة النسخة الاحتياطية "${restoreConfirm.backup?.filename}"؟ سيتم استبدال قاعدة البيانات الحالية!`}
                confirmText="استعادة"
                cancelText="إلغاء"
                onConfirm={confirmRestore}
                onCancel={() => setRestoreConfirm({ isOpen: false, backup: null })}
                variant="warning"
            />
        </div>
    );
} 