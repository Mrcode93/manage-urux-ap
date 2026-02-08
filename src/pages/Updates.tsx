import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getUpdates,
    deleteUpdate,
    getApps,
    getTauriUpdateJson,

    downloadUpdate,
    syncUpdates,
    getUploadProgress,
    updateMetadata,
    uploadUpdate,
    getUpdateStats,
    getAppDownloadStats,
    getDownloadStats
} from '../api/client';
import type { Update, App, TauriUpdateJson, AppDownloadStats } from '../api/client';
import Button from '../components/Button';
import { toast } from 'react-hot-toast';

import {
    Package,
    Plus,
    RefreshCw,
    Download,
    HardDrive,
    Cloud,
    Copy,
    Edit,
    ChevronDown,
    ChevronUp,
    Monitor,
    Laptop,
    Server,
    Smartphone,
    X,
    Info,
    Activity,
    Search,
    Calendar,
    Trash2,
    AlertTriangle,
    FileText,
    SortAsc,
    SortDesc
} from 'lucide-react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import Skeleton from '../components/Skeleton';

export default function Updates() {
    const [platform, setPlatform] = useState('windows');
    const [version, setVersion] = useState('');
    const [appId, setAppId] = useState<string>('');
    const [description, setDescription] = useState('');
    const [releaseNotes, setReleaseNotes] = useState('');
    const [changelog, setChangelog] = useState('');
    const [deleteOld, setDeleteOld] = useState(true);
    const [file, setFile] = useState<File | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadSpeed, setUploadSpeed] = useState<string>('');
    const [uploadDetails, setUploadDetails] = useState<{
        percent: number;
        loadedMB: number;
        totalMB: number;
        speedMBps: number;
        elapsed: number;
        estimatedTimeRemaining: number;
    } | null>(null);
    const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
    const [selectedApp, setSelectedApp] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [showTauriJson, setShowTauriJson] = useState(false);
    const [tauriJsonData, setTauriJsonData] = useState<TauriUpdateJson | null>(null);
    const [selectedAppForTauri, setSelectedAppForTauri] = useState<string>('');
    const [currentUpload, setCurrentUpload] = useState<{ platform: string; version: string } | null>(null);
    const [selectedUpdates, setSelectedUpdates] = useState<Set<string>>(new Set());
    const [downloadStats, setDownloadStats] = useState<AppDownloadStats | null>(null);
    const [loadingDownloadStats, setLoadingDownloadStats] = useState(false);
    const [editingUpdate, setEditingUpdate] = useState<Update | null>(null);
    const [editDescription, setEditDescription] = useState('');
    const [editReleaseNotes, setEditReleaseNotes] = useState('');
    const [editChangelog, setEditChangelog] = useState('');
    const [expandedSections, setExpandedSections] = useState<Record<string, {
        description?: boolean;
        releaseNotes?: boolean;
        changelog?: boolean;
    }>>({});
    const uploadStartTime = useRef<number>(0);
    const uploadInterval = useRef<ReturnType<typeof setInterval> | null>(null);
    const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);

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
    } as const;

    const queryClient = useQueryClient();

    // Cleanup function to clear intervals on component unmount
    useEffect(() => {
        return () => {
            if (uploadInterval.current) {
                clearInterval(uploadInterval.current);
            }
            if (progressInterval.current) {
                clearInterval(progressInterval.current);
            }
        };
    }, []);

    // Fetch apps
    const { data: apps = [], isLoading: appsLoading, error: appsError } = useQuery<App[]>({
        queryKey: ['apps'],
        queryFn: () => getApps({ active: true })
    });

    // Handle apps error
    useEffect(() => {
        if (appsError) {
            console.error('Error fetching apps:', appsError);
            toast.error('فشل في تحميل التطبيقات', {
                icon: '❌',
                duration: 4000,
            });
        }
    }, [appsError]);

    // Set default app filter when apps are loaded (if not already set)
    useEffect(() => {
        if (apps.length > 0 && selectedApp === 'all') {
            // Keep it as 'all' or default to first app if desired
            // For now, keep it as 'all'
        }
    }, [apps, selectedApp]);

    // Fetch updates with platform and app filtering
    const { data: updates = [], isLoading } = useQuery<Update[]>({
        queryKey: ['updates', selectedPlatform, selectedApp, searchTerm, sortBy, sortOrder],
        queryFn: () => {
            const params: { platform?: string; appId?: string } = {};

            // Set platform filter
            if (selectedPlatform !== 'all') {
                params.platform = selectedPlatform;
            }

            // Set appId filter
            if (selectedApp === 'all') {
                // Don't set appId - get all updates
                // params.appId is undefined
            } else if (selectedApp === '') {
                // Empty string means "عام" (general/app-agnostic updates)
                // Send empty string - backend will treat it as null
                params.appId = '';
            } else {
                // Specific app ID
                params.appId = selectedApp;
            }

            return getUpdates(params);
        },
        select: (data) => {
            let filtered = [...data];

            // Filter by search term (client-side filtering for better UX)
            if (searchTerm) {
                filtered = filtered.filter(update =>
                    update.fileName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    update.version?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    update.platform?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    update.description?.toLowerCase().includes(searchTerm.toLowerCase())
                );
            }

            // Sort
            filtered.sort((a, b) => {
                let aValue: any, bValue: any;

                switch (sortBy) {
                    case 'date':
                        aValue = new Date(a.updatedAt).getTime();
                        bValue = new Date(b.updatedAt).getTime();
                        break;
                    case 'name':
                        aValue = a.fileName?.toLowerCase() || '';
                        bValue = b.fileName?.toLowerCase() || '';
                        break;
                    case 'size':
                        aValue = a.fileSize || 0;
                        bValue = b.fileSize || 0;
                        break;
                    default:
                        return 0;
                }

                if (sortOrder === 'asc') {
                    return aValue > bValue ? 1 : -1;
                } else {
                    return aValue < bValue ? 1 : -1;
                }
            });

            return filtered;
        }
    });

    // Fetch update statistics
    const { data: updateStats } = useQuery({
        queryKey: ['updateStats', selectedApp],
        queryFn: () => getUpdateStats(selectedApp === 'all' ? undefined : selectedApp),
        refetchInterval: 30000,
    });

    // Fetch download statistics for selected app
    useEffect(() => {
        const fetchDownloadStatsData = async () => {
            setLoadingDownloadStats(true);
            try {
                let stats: any;
                if (selectedApp === 'all') {
                    // Try to get global stats
                    const globalStats = await getDownloadStats();

                    if (globalStats && globalStats.summary && globalStats.summary.totalDownloads > 0) {
                        stats = {
                            total_downloads: globalStats.summary.totalDownloads,
                            total_unique_devices: globalStats.summary.totalUniqueDevices,
                            app_id: 'all'
                        };
                    } else if (apps.length > 0) {
                        // Fallback: Sum up stats for all apps
                        console.log('🔄 Global stats empty, summing up per-app stats...');
                        const allStats = await Promise.all(
                            apps.map(app => getAppDownloadStats(app._id).catch(() => null))
                        );

                        const totalDownloads = allStats.reduce((sum, s) => sum + (s?.total_downloads || 0), 0);
                        const totalDevices = allStats.reduce((sum, s) => sum + (s?.total_unique_devices || 0), 0);

                        stats = {
                            total_downloads: totalDownloads,
                            total_unique_devices: totalDevices,
                            app_id: 'all'
                        };
                    } else {
                        stats = { total_downloads: 0, total_unique_devices: 0, app_id: 'all' };
                    }
                } else {
                    // Specific app or "General" (empty string)
                    stats = await getAppDownloadStats(selectedApp);
                }
                setDownloadStats(stats);
            } catch (error) {
                console.error('Error fetching download stats:', error);
                // Fallback: sum up from current updates list
                const sum = updates.reduce((acc, u) => acc + (u.downloadCount || 0), 0);
                setDownloadStats({
                    total_downloads: sum,
                    total_unique_devices: 0,
                    app_id: selectedApp
                } as any);
            } finally {
                setLoadingDownloadStats(false);
            }
        };

        fetchDownloadStatsData();
    }, [selectedApp, updates, apps]);

    // Cleanup intervals on unmount
    useEffect(() => {
        return () => {
            if (uploadInterval.current) {
                clearInterval(uploadInterval.current);
            }
            if (progressInterval.current) {
                clearInterval(progressInterval.current);
            }
        };
    }, []);

    const uploadMutation = useMutation({
        mutationFn: (formData: FormData) => uploadUpdate(formData),
        retry: 1,
        retryDelay: 2000,
        onMutate: (formData) => {
            // Extract platform and version from form data for progress tracking
            const platform = formData.get('platform') as string;
            const version = formData.get('version') as string;

            // Set initial upload state
            setCurrentUpload({ platform, version });
            setUploadProgress(0);
            setUploadSpeed('');
            setUploadDetails(null);

            // Start progress polling after a short delay
            setTimeout(() => {
                startServerProgressPolling(platform, version);
            }, 1500); // Give server time to process the upload

            return { platform, version };
        },
        onSuccess: (data, variables, context) => {
            console.log('✅ Upload mutation succeeded, cleaning up...');
            toast.success('تم رفع التحديث بنجاح', {
                icon: '✅',
                duration: 4000,
            });
            setVersion('');
            setAppId('');
            setDescription('');
            setReleaseNotes('');
            setChangelog('');
            setFile(null);
            setUploadProgress(100); // Set to 100% to show completion
            setUploadSpeed('');
            setUploadDetails(null);
            setCurrentUpload(null);
            setShowUploadForm(false);

            // Clean up progress polling immediately
            if (progressInterval.current) {
                console.log('🛑 Clearing progress interval on success');
                clearInterval(progressInterval.current);
                progressInterval.current = null;
            }

            queryClient.invalidateQueries({ queryKey: ['updates'] });
            queryClient.invalidateQueries({ queryKey: ['updateStats'] });
        },
        onError: (error: any, variables, context) => {
            console.error('Upload error:', error);
            let errorMessage = 'فشل في رفع التحديث';

            if (error.response?.status === 408) {
                errorMessage = 'انتهت مهلة التحميل. يرجى المحاولة مرة أخرى.';
            } else if (error.response?.status === 413) {
                errorMessage = 'الملف كبير جداً. الحد الأقصى هو 2GB.';
            } else if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            } else if (error.message) {
                errorMessage = error.message;
            }

            toast.error(errorMessage, {
                icon: '❌',
                duration: 8000,
            });
            setUploadProgress(0);
            setUploadSpeed('');
            setUploadDetails(null);
            setCurrentUpload(null);

            // Clean up progress polling immediately
            if (progressInterval.current) {
                console.log('🛑 Clearing progress interval on error');
                clearInterval(progressInterval.current);
                progressInterval.current = null;
            }
        },
    });

    const deleteMutation = useMutation({
        mutationFn: ({ platform, version }: { platform: string; version: string }) => deleteUpdate(platform, version),
        onSuccess: (data) => {
            toast.success(`تم حذف التحديث بنجاح`, {
                icon: '🗑️',
                duration: 3000,
            });
            setDeleteConfirm(null);
            queryClient.invalidateQueries({ queryKey: ['updates'] });
            queryClient.invalidateQueries({ queryKey: ['updateStats'] });
        },
        onError: (error: any) => {
            toast.error(error.message || 'فشل في حذف التحديث', {
                icon: '❌',
                duration: 4000,
            });
            setDeleteConfirm(null);
        },
    });

    const syncMutation = useMutation({
        mutationFn: syncUpdates,
        onSuccess: (data) => {
            toast.success('تم مزامنة التحديثات بنجاح', {
                icon: '✅',
                duration: 3000,
            });
            queryClient.invalidateQueries({ queryKey: ['updates'] });
            queryClient.invalidateQueries({ queryKey: ['updateStats'] });
        },
        onError: (error: any) => {
            toast.error(error.message || 'فشل في مزامنة التحديثات', {
                icon: '❌',
                duration: 4000,
            });
        },
    });

    const updateMetadataMutation = useMutation({
        mutationFn: ({ platform, version, metadata }: { platform: string; version: string; metadata: { description?: string; releaseNotes?: string; changelog?: string } }) =>
            updateMetadata(platform, version, metadata),
        onSuccess: (data) => {
            toast.success('تم تحديث البيانات بنجاح', {
                icon: '✅',
                duration: 3000,
            });
            setEditingUpdate(null);
            setEditDescription('');
            setEditReleaseNotes('');
            setEditChangelog('');
            queryClient.invalidateQueries({ queryKey: ['updates'] });
        },
        onError: (error: any) => {
            toast.error(error.message || 'فشل في تحديث البيانات', {
                icon: '❌',
                duration: 4000,
            });
        },
    });

    const startServerProgressPolling = (platform: string, version: string) => {
        console.log('🚀 Starting progress polling for:', platform, version);

        let retryCount = 0;
        const maxRetries = 5;
        let isCompleted = false;
        const startTime = Date.now();
        const maxPollingTime = 10 * 60 * 1000; // 10 minutes max polling time

        // Start polling immediately
        const pollProgress = async () => {
            // Don't poll if upload is already completed
            if (isCompleted) {
                console.log('✅ Upload already completed, skipping poll');
                return;
            }

            // Check if we've been polling too long
            if (Date.now() - startTime > maxPollingTime) {
                console.log('⏰ Max polling time reached, stopping progress polling');
                isCompleted = true;
                if (progressInterval.current) {
                    clearInterval(progressInterval.current);
                    progressInterval.current = null;
                }
                setCurrentUpload(null);
                toast.error('انتهت مهلة تتبع التقدم، لكن الرفع قد يكون مكتملاً', {
                    icon: '⏰',
                    duration: 4000,
                });
                return;
            }

            try {
                const progress = await getUploadProgress(platform, version);
                console.log('📊 Progress update:', progress);
                retryCount = 0; // Reset retry count on success

                setUploadProgress(progress.percent);
                setUploadSpeed(progress.speedMBps.toFixed(2));
                setUploadDetails({
                    percent: progress.percent,
                    loadedMB: progress.loadedMB,
                    totalMB: progress.totalMB,
                    speedMBps: progress.speedMBps,
                    elapsed: progress.elapsed,
                    estimatedTimeRemaining: progress.estimatedTimeRemaining
                });

                // Stop polling when upload is complete
                if (progress.percent >= 100) {
                    console.log('✅ Upload completed, stopping progress polling');
                    isCompleted = true;
                    if (progressInterval.current) {
                        clearInterval(progressInterval.current);
                        progressInterval.current = null;
                    }
                    setCurrentUpload(null);
                }
            } catch (error) {
                console.warn('Failed to get upload progress:', error);
                retryCount++;

                // Check if error indicates upload is complete (404 with specific message)
                if (error instanceof Error && error.message.includes('No active upload found')) {
                    console.log('✅ Upload completed (no active upload found), stopping progress polling');
                    isCompleted = true;
                    if (progressInterval.current) {
                        clearInterval(progressInterval.current);
                        progressInterval.current = null;
                    }
                    setCurrentUpload(null);
                    return;
                }

                // Stop polling if we've retried too many times
                if (retryCount >= maxRetries) {
                    console.log('❌ Max retries reached, stopping progress polling');
                    isCompleted = true;
                    if (progressInterval.current) {
                        clearInterval(progressInterval.current);
                        progressInterval.current = null;
                    }
                    setCurrentUpload(null);
                    toast.error('فشل في تتبع تقدم الرفع', {
                        icon: '⚠️',
                        duration: 4000,
                    });
                }
            }
        };

        // Poll immediately and then every 2 seconds to reduce server load
        pollProgress();
        progressInterval.current = setInterval(pollProgress, 2000);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !version || !platform) {
            toast.error('يرجى ملء جميع الحقول واختيار ملف.', {
                icon: '⚠️',
            });
            return;
        }

        const maxSize = 2 * 1024 * 1024 * 1024; // 2GB
        if (file.size > maxSize) {
            toast.error(`حجم الملف كبير جداً.الحد الأقصى هو 2GB`, {
                icon: '📁',
                duration: 6000,
            });
            return;
        }

        const allowedTypes = ['.exe', '.dmg', '.deb', '.rpm', '.zip', '.tar.gz', '.msi', '.app'];
        const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
        if (!allowedTypes.includes(fileExtension)) {
            toast.error(`نوع الملف غير مدعوم.الأنواع المسموحة: ${allowedTypes.join(', ')} `, {
                icon: '📄',
                duration: 6000,
            });
            return;
        }

        const formData = new FormData();
        formData.append('platform', platform);
        formData.append('version', version);
        formData.append('updateFile', file);

        // Add optional fields
        if (appId) {
            formData.append('appId', appId);
        }
        if (description) {
            formData.append('description', description);
        }
        if (releaseNotes) {
            formData.append('releaseNotes', releaseNotes);
        }
        if (changelog) {
            formData.append('changelog', changelog);
        }
        formData.append('deleteOld', deleteOld.toString());

        uploadMutation.mutate(formData);
    };

    const handleDelete = (platform: string, version: string, fileName: string) => {
        setDeleteConfirm(JSON.stringify({ platform, version, fileName }));
    };

    const confirmDelete = () => {
        if (deleteConfirm) {
            try {
                const deleteData = JSON.parse(deleteConfirm);
                deleteMutation.mutate({ platform: deleteData.platform, version: deleteData.version });
            } catch (error) {
                toast.error('خطأ في تنسيق البيانات', {
                    icon: '❌',
                    duration: 4000,
                });
            }
        }
    };

    const handleDownload = async (update: Update) => {
        try {
            toast.loading('جاري تحضير التحميل...', {
                icon: '⏳',
                duration: 2000,
            });

            try {
                const blob = await downloadUpdate(update.platform || 'unknown', update.version || 'unknown');

                if (!blob || blob.size === 0) {
                    throw new Error('الملف فارغ أو تالف');
                }

                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = update.fileName;
                a.style.display = 'none';

                a.addEventListener('click', () => {
                    setTimeout(() => {
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(a);
                    }, 1000);
                });

                document.body.appendChild(a);
                a.click();

                toast.success(`تم بدء التحميل: ${update.fileName} `, {
                    icon: '⬇️',
                    duration: 5000,
                });

            } catch (apiError) {
                if (update.url) {
                    const a = document.createElement('a');
                    a.href = update.url;
                    a.download = update.fileName;
                    a.style.display = 'none';
                    a.target = '_blank';
                    a.rel = 'noopener noreferrer';

                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);

                    toast.success(`تم فتح رابط التحميل في نافذة جديدة`, {
                        icon: '⬇️',
                        duration: 5000,
                    });
                } else {
                    throw new Error('لا يمكن العثور على رابط التحميل');
                }
            }

        } catch (error) {
            console.error('Download error:', error);
            const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
            toast.error(`فشل في تحميل الملف: ${errorMessage} `, {
                icon: '❌',
                duration: 6000,
            });
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('ar-IQ', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const toggleSection = (updateId: string, section: 'description' | 'releaseNotes' | 'changelog') => {
        setExpandedSections(prev => ({
            ...prev,
            [updateId]: {
                ...prev[updateId],
                [section]: !prev[updateId]?.[section]
            }
        }));
    };

    const handleEdit = (update: Update) => {
        setEditingUpdate(update);
        setEditDescription(update.description || '');
        setEditReleaseNotes(update.releaseNotes || '');
        setEditChangelog(update.changelog || '');
    };

    const handleSaveEdit = () => {
        if (!editingUpdate) return;

        updateMetadataMutation.mutate({
            platform: editingUpdate.platform,
            version: editingUpdate.version,
            metadata: {
                description: editDescription,
                releaseNotes: editReleaseNotes,
                changelog: editChangelog
            }
        });
    };

    const getPlatformIcon = (platform: string | undefined) => {
        if (!platform) return <Package className="h-5 w-5 text-gray-600" />;

        switch (platform.toLowerCase()) {
            case 'windows': return <Monitor className="h-5 w-5 text-blue-600" />;
            case 'mac': return <Laptop className="h-5 w-5 text-gray-600" />;
            case 'linux': return <Server className="h-5 w-5 text-orange-600" />;
            case 'android': return <Smartphone className="h-5 w-5 text-green-600" />;
            default: return <Package className="h-5 w-5 text-gray-600" />;
        }
    };

    const getPlatformName = (platform: string | undefined) => {
        if (!platform) return 'غير محدد';

        switch (platform.toLowerCase()) {
            case 'windows': return 'ويندوز';
            case 'mac': return 'ماك';
            case 'linux': return 'لينكس';
            default: return platform;
        }
    };

    const totalUpdates = updates.length;
    const totalSize = updates.reduce((sum, update) => sum + (update.fileSize || 0), 0);

    if (isLoading) {
        return (
            <div className="space-y-8 p-4">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="space-y-2">
                        <Skeleton width={300} height={32} />
                        <Skeleton width={400} height={20} />
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Skeleton width={120} height={40} variant="rectangular" />
                        <Skeleton width={120} height={40} variant="rectangular" />
                        <Skeleton width={150} height={40} variant="rectangular" />
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {[1, 2, 3, 4, 5].map(i => (
                        <Skeleton key={i} height={100} variant="rectangular" className="rounded-2xl" />
                    ))}
                </div>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <Skeleton key={i} height={150} variant="rectangular" className="rounded-2xl" />
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
            className="space-y-6 sm:space-y-8"
        >
            {/* Header */}
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300">
                        تحديثات البرامج
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">
                        إدارة وتوزيع الإصدارات البرمجية ومتابعة حالة الرفع
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Button
                        onClick={() => syncMutation.mutate(undefined)}
                        variant="secondary"
                        size="sm"
                        isLoading={syncMutation.isPending}
                        className="glass shadow-none border-slate-200 dark:border-slate-800"
                    >
                        <RefreshCw className="h-4 w-4 ml-2" />
                        مزامنة S3
                    </Button>
                    <Button
                        onClick={() => setShowTauriJson(!showTauriJson)}
                        variant="secondary"
                        size="sm"
                        className="glass shadow-none border-slate-200 dark:border-slate-800"
                    >
                        <FileText className="h-4 w-4 ml-2" />
                        Tauri JSON
                    </Button>
                    <Button
                        onClick={() => setShowUploadForm(!showUploadForm)}
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25"
                    >
                        <Plus className="h-4 w-4 ml-2" />
                        رفع تحديث جديد
                    </Button>
                </div>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                    { label: 'إجمالي التحديثات', value: totalUpdates, icon: Package, color: 'blue' },
                    { label: 'إجمالي الحجم', value: formatFileSize(totalSize), icon: HardDrive, color: 'green' },
                    { label: 'نوع التخزين', value: 'Google Cloud', icon: Cloud, color: 'purple' },
                    { label: 'التحميلات', value: loadingDownloadStats ? '...' : (downloadStats?.total_downloads || 0), icon: Download, color: 'orange' },
                    { label: 'أجهزة فريدة', value: loadingDownloadStats ? '...' : (downloadStats?.total_unique_devices || 0), icon: Monitor, color: 'indigo' },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        variants={itemVariants}
                        className="glass-card flex flex-col items-center justify-center text-center p-4 border border-slate-200 dark:border-slate-800/50"
                    >
                        <div className={`p-3 rounded-2xl bg-${stat.color}-100 dark:bg-${stat.color}-900/20 text-${stat.color}-600 dark:text-${stat.color}-400 mb-3`}>
                            <stat.icon className="h-6 w-6" />
                        </div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">{stat.label}</p>
                        <p className="text-xl font-bold dark:text-white">{stat.value}</p>
                    </motion.div>
                ))}
            </div>


            {/* Upload Form */}
            {showUploadForm && (
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white">رفع تحديث جديد</h2>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setShowUploadForm(false)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    التطبيق (اختياري)
                                </label>
                                <select
                                    value={appId}
                                    onChange={(e) => setAppId(e.target.value)}
                                    disabled={appsLoading}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <option value="">
                                        {appsLoading ? 'جاري التحميل...' : 'عام (لجميع التطبيقات)'}
                                    </option>
                                    {appsError ? (
                                        <option value="" disabled>خطأ في تحميل التطبيقات</option>
                                    ) : apps.length === 0 && !appsLoading ? (
                                        <option value="" disabled>لا توجد تطبيقات متاحة</option>
                                    ) : (
                                        apps.map((app) => (
                                            <option key={app._id} value={app._id}>
                                                {app.name}
                                            </option>
                                        ))
                                    )}
                                </select>
                                {appsError && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                        فشل في تحميل التطبيقات. يرجى تحديث الصفحة.
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    المنصة
                                </label>
                                <select
                                    value={platform}
                                    onChange={(e) => setPlatform(e.target.value)}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                >
                                    <option value="windows">ويندوز</option>
                                    <option value="mac">ماك</option>
                                    <option value="linux">لينكس</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    الإصدار
                                </label>
                                <input
                                    type="text"
                                    placeholder="مثال: 1.2.3"
                                    value={version}
                                    onChange={(e) => setVersion(e.target.value)}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                ملف التحديث
                            </label>
                            <input
                                type="file"
                                onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-900/20 dark:file:text-primary-400"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                الوصف
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="وصف مختصر للتحديث..."
                                rows={2}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                ملاحظات الإصدار
                            </label>
                            <textarea
                                value={releaseNotes}
                                onChange={(e) => setReleaseNotes(e.target.value)}
                                placeholder="ملاحظات الإصدار..."
                                rows={3}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                سجل التغييرات
                            </label>
                            <textarea
                                value={changelog}
                                onChange={(e) => setChangelog(e.target.value)}
                                placeholder="قائمة بالتغييرات في هذا الإصدار..."
                                rows={4}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="deleteOld"
                                checked={deleteOld}
                                onChange={(e) => setDeleteOld(e.target.checked)}
                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <label htmlFor="deleteOld" className="text-sm text-gray-700 dark:text-gray-300">
                                حذف التحديثات القديمة لنفس المنصة (والتطبيق إن تم تحديده)
                            </label>
                        </div>

                        {file && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <Info className="h-5 w-5 text-blue-600" />
                                    <div>
                                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                            {file.name} ({formatFileSize(file.size)})
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {(currentUpload || uploadMutation.isPending) && (
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                                    <span className="flex items-center gap-2">
                                        <Activity className="h-4 w-4 animate-pulse" />
                                        {uploadMutation.isPending && !currentUpload ? 'جاري إرسال الملف...' :
                                            uploadProgress === 0 ? 'جاري بدء الرفع...' : 'جاري الرفع إلى S3...'}
                                    </span>
                                    <span className="font-medium">{uploadProgress.toFixed(0)}%</span>
                                </div>

                                <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                                    {uploadMutation.isPending && !currentUpload ? (
                                        <div className="bg-primary-600 h-2 rounded-full animate-pulse" style={{ width: '10%' }} />
                                    ) : (
                                        <div
                                            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${Math.max(uploadProgress, 1)}% ` }}
                                        />
                                    )}
                                </div>

                                {uploadDetails && uploadProgress > 0 && (
                                    <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 dark:text-gray-400">
                                        <div>
                                            <span className="font-medium">السرعة:</span> {uploadSpeed} MB/s
                                        </div>
                                        <div>
                                            <span className="font-medium">البيانات:</span> {uploadDetails.loadedMB.toFixed(1)} / {uploadDetails.totalMB.toFixed(1)} MB
                                        </div>
                                        <div>
                                            <span className="font-medium">الوقت المنقضي:</span> {Math.round(uploadDetails.elapsed / 1000)}s
                                        </div>
                                        <div>
                                            <span className="font-medium">الوقت المتبقي:</span> {uploadDetails.estimatedTimeRemaining > 0 ? Math.round(uploadDetails.estimatedTimeRemaining / 1000) : 0}s
                                        </div>
                                    </div>
                                )}

                                {uploadProgress === 0 && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                        {uploadMutation.isPending && !currentUpload ? 'جاري إرسال الملف إلى الخادم...' : 'جاري الاتصال بالخادم...'}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex justify-end gap-3">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setShowUploadForm(false)}
                            >
                                إلغاء
                            </Button>
                            <Button
                                type="submit"
                                isLoading={uploadMutation.isPending}
                            >
                                رفع التحديث
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filters and Search */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="البحث في التحديثات..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>
                    </div>

                    {/* App Filter */}
                    <div className="flex gap-2">
                        <select
                            value={selectedApp}
                            onChange={(e) => setSelectedApp(e.target.value)}
                            className="block px-3 py-2 border border-gray-300 rounded-md text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                        >
                            <option value="all">جميع التطبيقات</option>
                            <option value="">عام</option>
                            {apps.map((app) => (
                                <option key={app._id} value={app._id}>
                                    {app.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Platform Filter */}
                    <div className="flex gap-2">
                        <Button
                            variant={selectedPlatform === 'all' ? 'primary' : 'secondary'}
                            size="sm"
                            onClick={() => setSelectedPlatform('all')}
                        >
                            الكل
                        </Button>
                        <Button
                            variant={selectedPlatform === 'windows' ? 'primary' : 'secondary'}
                            size="sm"
                            onClick={() => setSelectedPlatform('windows')}
                        >
                            ويندوز
                        </Button>
                        <Button
                            variant={selectedPlatform === 'mac' ? 'primary' : 'secondary'}
                            size="sm"
                            onClick={() => setSelectedPlatform('mac')}
                        >
                            ماك
                        </Button>
                        <Button
                            variant={selectedPlatform === 'linux' ? 'primary' : 'secondary'}
                            size="sm"
                            onClick={() => setSelectedPlatform('linux')}
                        >
                            لينكس
                        </Button>
                    </div>

                    {/* Sort */}
                    <div className="flex gap-2">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as 'date' | 'name' | 'size')}
                            className="block px-3 py-2 border border-gray-300 rounded-md text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                        >
                            <option value="date">التاريخ</option>
                            <option value="name">الاسم</option>
                            <option value="size">الحجم</option>
                        </select>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        >
                            {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Updates List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-xl font-bold dark:text-white">التحديثات المؤرشفة</h2>
                    <div className="px-3 py-1 glass rounded-full text-xs font-bold text-blue-600 dark:text-blue-400">
                        {updates.length} إصدار
                    </div>
                </div>

                <AnimatePresence>
                    <div className="grid grid-cols-1 gap-4">
                        {updates.map((update, idx) => (
                            <motion.div
                                key={update._id}
                                variants={itemVariants}
                                initial="hidden"
                                animate="visible"
                                className="glass-card group hover:border-blue-500/30 transition-all duration-300"
                            >
                                <div className="flex flex-col lg:flex-row gap-6">
                                    {/* Platform Icon & Status */}
                                    <div className="flex lg:flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl min-w-[120px]">
                                        <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm mb-2 group-hover:scale-110 transition-transform">
                                            {getPlatformIcon(update.platform)}
                                        </div>
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            {update.platform}
                                        </span>
                                    </div>

                                    {/* Info Content */}
                                    <div className="flex-1 space-y-4">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <h3 className="text-lg font-bold dark:text-white">
                                                Version {update.version}
                                            </h3>
                                            {update.app && (
                                                <div className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-lg border border-indigo-100 dark:border-indigo-800">
                                                    {update.app.name}
                                                </div>
                                            )}
                                            {update.isActive === false && (
                                                <div className="px-3 py-1 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold rounded-lg border border-red-100 dark:border-red-800">
                                                    Inactive
                                                </div>
                                            )}
                                        </div>

                                        <p className="text-sm font-mono text-slate-500 dark:text-slate-400 break-all bg-slate-50 dark:bg-black/20 p-2 rounded-lg border border-slate-100 dark:border-white/5">
                                            {update.fileName}
                                        </p>

                                        <div className="flex flex-wrap items-center gap-6 text-xs font-medium text-slate-400">
                                            <div className="flex items-center gap-2">
                                                <HardDrive className="h-4 w-4" />
                                                {formatFileSize(update.fileSize)}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4" />
                                                {formatDate(update.updatedAt)}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Download className="h-4 w-4" />
                                                {update.downloadCount || 0} Downloads
                                            </div>
                                        </div>

                                        {/* Expandable Meta */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                                            {['description', 'releaseNotes', 'changelog'].map((sect) => (
                                                update[sect as keyof Update] && (
                                                    <div key={sect} className="space-y-1">
                                                        <button
                                                            onClick={() => toggleSection(update._id, sect as any)}
                                                            className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-blue-500 flex items-center gap-1 transition-colors"
                                                        >
                                                            {sect === 'description' ? 'Description' : sect === 'releaseNotes' ? 'Release Notes' : 'Changelog'}
                                                            {expandedSections[update._id]?.[sect as keyof typeof expandedSections[string]] ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                                        </button>
                                                        {expandedSections[update._id]?.[sect as keyof typeof expandedSections[string]] && (
                                                            <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-xs text-slate-600 dark:text-slate-400 animate-entrance border border-slate-100 dark:border-white/5">
                                                                {update[sect as keyof Update] as string}
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            ))}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex lg:flex-col gap-2 justify-end lg:border-l lg:border-slate-100 lg:dark:border-white/5 lg:pl-6">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => handleDownload(update)}
                                            className="glass hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-none"
                                        >
                                            <Download className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => handleEdit(update)}
                                            className="glass border-none"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={() => handleDelete(update.platform!, update.version!, update.fileName)}
                                            className="glass border-none bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </AnimatePresence>
            </div>
            {/* Tauri JSON Modal */}
            {showTauriJson && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                Tauri Update JSON
                            </h3>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                    setShowTauriJson(false);
                                    setTauriJsonData(null);
                                    setSelectedAppForTauri('');
                                }}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    اختر التطبيق
                                </label>
                                <select
                                    value={selectedAppForTauri}
                                    onChange={(e) => setSelectedAppForTauri(e.target.value)}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                >
                                    <option value="">اختر تطبيق...</option>
                                    {apps.map((app) => (
                                        <option key={app._id} value={app.name.toLowerCase()}>
                                            {app.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedAppForTauri && (
                                <div>
                                    <Button
                                        onClick={async () => {
                                            try {
                                                const json = await getTauriUpdateJson(selectedAppForTauri);
                                                setTauriJsonData(json);
                                            } catch (error: any) {
                                                toast.error(error.message || 'فشل في جلب البيانات', {
                                                    icon: '❌',
                                                });
                                            }
                                        }}
                                        className="w-full"
                                    >
                                        جلب JSON
                                    </Button>
                                </div>
                            )}

                            {tauriJsonData && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Endpoint URL:
                                        </p>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={async () => {
                                                const url = `${API_BASE_URL} /api/s3 - updates / check / ${selectedAppForTauri}/update.json`;
                                                try {
                                                    await navigator.clipboard.writeText(url);
                                                    toast.success('تم نسخ الرابط', {
                                                        icon: '📋',
                                                    });
                                                } catch (error) {
                                                    toast.error('فشل في نسخ الرابط', {
                                                        icon: '❌',
                                                    });
                                                }
                                            }}
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button >
                                    </div >
                                    <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto text-xs">
                                        {JSON.stringify(tauriJsonData, null, 2)}
                                    </pre>
                                </div >
                            )}
                        </div >
                    </div >
                </div >
            )}

            {/* Edit Update Modal */}
            {
                editingUpdate && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                    تعديل التحديث
                                </h3>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => {
                                        setEditingUpdate(null);
                                        setEditDescription('');
                                        setEditReleaseNotes('');
                                        setEditChangelog('');
                                    }}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        الوصف
                                    </label>
                                    <textarea
                                        value={editDescription}
                                        onChange={(e) => setEditDescription(e.target.value)}
                                        placeholder="وصف مختصر للتحديث..."
                                        rows={3}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        ملاحظات الإصدار
                                    </label>
                                    <textarea
                                        value={editReleaseNotes}
                                        onChange={(e) => setEditReleaseNotes(e.target.value)}
                                        placeholder="ملاحظات الإصدار..."
                                        rows={4}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        سجل التغييرات
                                    </label>
                                    <textarea
                                        value={editChangelog}
                                        onChange={(e) => setEditChangelog(e.target.value)}
                                        placeholder="قائمة بالتغييرات في هذا الإصدار..."
                                        rows={5}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <Button
                                        variant="secondary"
                                        onClick={() => {
                                            setEditingUpdate(null);
                                            setEditDescription('');
                                            setEditReleaseNotes('');
                                            setEditChangelog('');
                                        }}
                                    >
                                        إلغاء
                                    </Button>
                                    <Button
                                        onClick={handleSaveEdit}
                                        isLoading={updateMetadataMutation.isPending}
                                    >
                                        حفظ التغييرات
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Delete Confirmation Modal */}
            {
                deleteConfirm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                            <div className="flex items-center gap-3 mb-4">
                                <AlertTriangle className="h-6 w-6 text-red-600" />
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                    تأكيد الحذف
                                </h3>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                هل أنت متأكد من حذف هذا التحديث؟ لا يمكن التراجع عن هذا الإجراء.
                            </p>
                            <div className="flex justify-end gap-3">
                                <Button
                                    variant="secondary"
                                    onClick={() => setDeleteConfirm(null)}
                                >
                                    إلغاء
                                </Button>
                                <Button
                                    variant="danger"
                                    onClick={confirmDelete}
                                    isLoading={deleteMutation.isPending}
                                >
                                    حذف
                                </Button>
                            </div>
                        </div>
                    </div>
                )
            }
        </motion.div >
    );
}
