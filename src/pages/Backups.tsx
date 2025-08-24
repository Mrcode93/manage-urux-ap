import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Backup, BackupStats, BackupLocation } from '../api/client';
import { 
    createBackup, 
    getBackups, 
    getBackupStats, 
    getBackupLocations,
    downloadBackup,
    deleteBackup,
    restoreBackup
} from '../api/client';
import Button from '../components/Button';
import Table, { type Column } from '../components/Table';
import { toast } from 'react-hot-toast';
import { usePermissions } from '../hooks/usePermissions';
import { BackupsReadGuard, BackupsWriteGuard, BackupsDeleteGuard } from '../components/PermissionGuard';
import { 
    PlusIcon, 
    CloudArrowDownIcon, 
    TrashIcon, 
    ArrowPathIcon,
    DocumentArrowDownIcon,
    InformationCircleIcon,
    ExclamationTriangleIcon,
    FolderIcon,
    ClockIcon,
    ArchiveBoxIcon,
    ShieldCheckIcon
} from '@heroicons/react/24/outline';

export default function Backups() {
    const { canReadBackups, canWriteBackups, canDeleteBackups } = usePermissions();
    const [selectedLocation, setSelectedLocation] = useState<string>('');
    const [locations, setLocations] = useState<BackupLocation[]>([]);
    const [isCreating, setIsCreating] = useState(false);

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

    // Fetch backup locations
    const { data: backupLocations = [] } = useQuery<BackupLocation[]>({
        queryKey: ['backup-locations'],
        queryFn: () => getBackupLocations()
    });

    // Set default location when locations are loaded
    useEffect(() => {
        if (backupLocations.length > 0 && !selectedLocation) {
            const defaultLocation = backupLocations.find(loc => loc.type === 'default');
            if (defaultLocation) {
                setSelectedLocation(defaultLocation.path);
            }
        }
    }, [backupLocations, selectedLocation]);

    // Fetch backups for selected location
    const { data: backups = [], isLoading } = useQuery<Backup[]>({
        queryKey: ['backups', selectedLocation],
        queryFn: () => getBackups(selectedLocation),
        enabled: !!selectedLocation
    });

    // Fetch backup stats for selected location
    const { data: stats } = useQuery<BackupStats>({
        queryKey: ['backup-stats', selectedLocation],
        queryFn: () => getBackupStats(selectedLocation),
        enabled: !!selectedLocation
    });

    // Create backup mutation
    const createMutation = useMutation({
        mutationFn: () => createBackup(selectedLocation),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['backups', selectedLocation] });
            queryClient.invalidateQueries({ queryKey: ['backup-stats', selectedLocation] });
            toast.success('تم إنشاء النسخة الاحتياطية بنجاح');
            setIsCreating(false);
        },
        onError: (error: any) => {
            toast.error(error.message || 'حدث خطأ أثناء إنشاء النسخة الاحتياطية');
        }
    });

    // Delete backup mutation
    const deleteMutation = useMutation({
        mutationFn: (filename: string) => deleteBackup(filename, selectedLocation),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['backups', selectedLocation] });
            queryClient.invalidateQueries({ queryKey: ['backup-stats', selectedLocation] });
            toast.success('تم حذف النسخة الاحتياطية بنجاح');
        },
        onError: (error: any) => {
            toast.error(error.message || 'حدث خطأ أثناء حذف النسخة الاحتياطية');
        }
    });

    // Restore backup mutation
    const restoreMutation = useMutation({
        mutationFn: (filename: string) => restoreBackup(filename, selectedLocation),
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
        setIsCreating(true);
        await createMutation.mutateAsync();
    };

    const handleDeleteBackup = async (backup: Backup) => {
        if (!canDeleteBackups()) {
            toast.error('ليس لديك صلاحية لحذف النسخ الاحتياطية');
            return;
        }
        if (window.confirm(`هل أنت متأكد من حذف النسخة الاحتياطية "${backup.filename}"؟`)) {
            await deleteMutation.mutateAsync(backup.filename);
        }
    };

    const handleRestoreBackup = async (backup: Backup) => {
        if (!canWriteBackups()) {
            toast.error('ليس لديك صلاحية لاستعادة النسخ الاحتياطية');
            return;
        }
        if (window.confirm(`هل أنت متأكد من استعادة النسخة الاحتياطية "${backup.filename}"؟ سيتم استبدال قاعدة البيانات الحالية!`)) {
            await restoreMutation.mutateAsync(backup.filename);
        }
    };

    const handleDownloadBackup = async (backup: Backup) => {
        try {
            const blob = await downloadBackup(backup.filename, selectedLocation);
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

    const getLocationName = (path: string): string => {
        const location = backupLocations.find(loc => loc.path === path);
        return location ? location.name : path;
    };

    const columns: Column<Backup>[] = [
        { 
            header: 'اسم الملف', 
            accessorKey: 'filename',
            cell: ({ row }) => (
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <CloudArrowDownIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">
                        {row.original.filename}
                    </span>
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
                        إنشاء وإدارة نسخ احتياطية لقاعدة البيانات
                    </p>
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
                    {/* Location Selector */}
                    <div className="relative">
                        <select
                            value={selectedLocation}
                            onChange={(e) => setSelectedLocation(e.target.value)}
                            className="w-full sm:w-auto appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-10 text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            {backupLocations.map((location) => (
                                <option key={location.path} value={location.path}>
                                    {location.name}
                                </option>
                            ))}
                        </select>
                        <FolderIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                    
                    <BackupsWriteGuard>
                        <Button
                            onClick={handleCreateBackup}
                            disabled={isCreating || !selectedLocation}
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

            {/* Current Location Info */}
            {selectedLocation && (
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                    <div className="flex items-center gap-2">
                        <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                                <FolderIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                        <div className="ml-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                موقع النسخ الاحتياطية الحالي
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                {getLocationName(selectedLocation)}
                            </p>
                        </div>
                        <div className="ml-auto">
                            <ShieldCheckIcon className="h-8 w-8 text-green-500" />
                        </div>
                    </div>
                </div>
            )}

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
        </div>
    );
} 