import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    uploadUpdate, 
    getUpdates, 
    deleteUpdate, 
    getUpdateStats,
    downloadUpdate,
    syncUpdates,
    testS3Connection,
    getUploadProgress
} from '../api/client';
import type { Update } from '../api/client';
import Button from '../components/Button';
import { toast } from 'react-hot-toast';
import { 
  Upload, 
  Download, 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  FileText, 
  Monitor, 
  Smartphone, 
  Laptop, 
  RefreshCw, 
  Plus,
  X,
  Package,
  Tag,
  Calendar,
  HardDrive,
  Activity,
  Zap,
  Shield,
  Info,
  AlertCircle,
  TrendingUp,
  Database,
  Server,
  Cloud,
  Globe,
  Search,
  Copy,
  ExternalLink,
  Filter,
  SortAsc,
  SortDesc
} from 'lucide-react';

interface UploadStats {
    totalUploads: number;
    totalFileSize: number;
    successRate: number;
    lastUploadDate?: string;
    platformStats?: Record<string, {
        totalUpdates: number;
        totalSize: number;
        latestVersion: string;
        versions: string[];
    }>;
}

export default function Updates() {
    const [platform, setPlatform] = useState('windows');
    const [version, setVersion] = useState('');
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
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [currentUpload, setCurrentUpload] = useState<{platform: string; version: string} | null>(null);
    const uploadStartTime = useRef<number>(0);
    const uploadInterval = useRef<ReturnType<typeof setInterval> | null>(null);
    const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);

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

    // Fetch updates with platform filtering
    const { data: updates = [], isLoading } = useQuery<Update[]>({
        queryKey: ['updates', selectedPlatform],
        queryFn: () => getUpdates(),
        select: (data) => {
            let filtered = data;
            
            // Filter by platform
            if (selectedPlatform !== 'all') {
                filtered = filtered.filter(update => update.platform === selectedPlatform);
            }
            
            // Filter by search term
            if (searchTerm) {
                filtered = filtered.filter(update => 
                    update.fileName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    update.version?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    update.platform?.toLowerCase().includes(searchTerm.toLowerCase())
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
        queryKey: ['updateStats'],
        queryFn: getUpdateStats,
        refetchInterval: 30000,
    });

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
        mutationFn: (formData: FormData) => uploadUpdate(formData, false),
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
            toast.error(`حجم الملف كبير جداً. الحد الأقصى هو 2GB`, {
                icon: '📁',
                duration: 6000,
            });
            return;
        }

        const allowedTypes = ['.exe', '.dmg', '.deb', '.rpm', '.zip', '.tar.gz', '.msi', '.app'];
        const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
        if (!allowedTypes.includes(fileExtension)) {
            toast.error(`نوع الملف غير مدعوم. الأنواع المسموحة: ${allowedTypes.join(', ')}`, {
                icon: '📄',
                duration: 6000,
            });
            return;
        }

        const formData = new FormData();
        formData.append('platform', platform);
        formData.append('version', version);
        formData.append('updateFile', file);

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
                
                toast.success(`تم بدء التحميل: ${update.fileName}`, {
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
            toast.error(`فشل في تحميل الملف: ${errorMessage}`, {
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">تحديثات اوركاش</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        إدارة وتحميل الإصدارات الجديدة من نظام إدارة اوركاش
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={() => syncMutation.mutate()}
                        variant="secondary"
                        size="sm"
                        isLoading={syncMutation.isPending}
                        className="flex items-center gap-2"
                    >
                        <RefreshCw className="h-4 w-4" />
                        مزامنة
                    </Button>
                    <Button
                        onClick={() => setShowUploadForm(!showUploadForm)}
                        className="flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        رفع تحديث
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                            <Package className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي التحديثات</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalUpdates}</p>
                        </div>
                    </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                            <HardDrive className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي الحجم</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatFileSize(totalSize)}</p>
                        </div>
                    </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                            <Cloud className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">التخزين</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">S3</p>
                        </div>
                    </div>
                </div>
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
                                            style={{ width: `${Math.max(uploadProgress, 1)}%` }}
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
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white">التحديثات المتاحة</h2>
                        <span className="bg-primary-100 text-primary-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-primary-900/30 dark:text-primary-400">
                            {updates.length}
                        </span>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <RefreshCw className="h-8 w-8 text-primary-600 animate-spin" />
                        <span className="mr-3 text-gray-600 dark:text-gray-400">جاري التحميل...</span>
                    </div>
                ) : updates.length === 0 ? (
                    <div className="text-center py-12">
                        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">
                            {searchTerm || selectedPlatform !== 'all' 
                                ? 'لا توجد نتائج تطابق البحث.' 
                                : 'لا توجد تحديثات متاحة.'
                            }
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {updates.map((update) => (
                            <div key={update._id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="flex-shrink-0">
                                            {getPlatformIcon(update.platform)}
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-gray-900 dark:text-white">
                                                {getPlatformName(update.platform)} - الإصدار {update.version}
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                {update.fileName}
                                            </p>
                                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                                                <span className="flex items-center gap-1">
                                                    <HardDrive className="h-3 w-3" />
                                                    {formatFileSize(update.fileSize)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {formatDate(update.updatedAt)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => handleDownload(update)}
                                            className="flex items-center gap-1"
                                        >
                                            <Download className="h-4 w-4" />
                                            تحميل
                                        </Button>
                                        {update.url && (
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={async () => {
                                                    try {
                                                        await navigator.clipboard.writeText(update.url);
                                                        toast.success('تم نسخ الرابط', {
                                                            icon: '📋',
                                                            duration: 3000,
                                                        });
                                                    } catch (error) {
                                                        toast.error('فشل في نسخ الرابط', {
                                                            icon: '❌',
                                                            duration: 3000,
                                                        });
                                                    }
                                                }}
                                                className="flex items-center gap-1"
                                            >
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={() => handleDelete(update.platform || 'unknown', update.version || 'unknown', update.fileName)}
                                            className="flex items-center gap-1"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
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
            )}
        </div>
    );
}
