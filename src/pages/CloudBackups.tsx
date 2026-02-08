import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/Button';
import Skeleton from '../components/Skeleton';
import {
  getAllUserBackups,
  downloadUserBackup,
  deleteUserBackup,
  resetUserPassword,
  getUserById,
  type UserBackup
} from '../api/client';
import {
  Database,
  FileText,
  Archive,
  FileArchive,
  Download,
  Trash2,
  Eye,
  EyeOff,
  RotateCcw,
  RefreshCw,
  FolderOpen,
  HardDrive,
  CheckCircle,
  Clock,
  User,
  Key,
  Server,
  Copy,
  Smartphone
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
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

const CloudBackups: React.FC = () => {
  const [backups, setBackups] = useState<UserBackup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>({});
  const [downloadingBackup, setDownloadingBackup] = useState<string | null>(null);
  const [deletingBackup, setDeletingBackup] = useState<string | null>(null);
  const [resettingPassword, setResettingPassword] = useState<string | null>(null);

  useEffect(() => {
    fetchAllBackups();
  }, []);

  const fetchAllBackups = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllUserBackups();

      if (data && data.length > 0) {
        // Enhance user data by fetching missing information
        const enhancedData = await Promise.all(
          data.map(async (backup) => {
            if (!backup.user || !backup.user.username || !backup.user.password || !backup.user.device_id) {
              if (backup.user?._id) {
                try {
                  const userData = await getUserById(backup.user._id);
                  backup.user = {
                    ...backup.user,
                    ...userData,
                    username: userData.username || backup.user?.username,
                    password: userData.password || backup.user?.password,
                    device_id: userData.device_id || backup.user?.device_id
                  };
                } catch (userError) {
                  console.error(`Failed to fetch user data for ${backup.user._id}:`, userError);
                }
              }
            }
            return backup;
          })
        );
        setBackups(enhancedData);
      } else {
        setBackups(data);
      }
    } catch (err: any) {
      console.error('Error fetching backups:', err);
      setError(err.message || 'فشل في جلب النسخ الاحتياطية');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (backup: UserBackup) => {
    try {
      setDownloadingBackup(backup._id);
      const blob = await downloadUserBackup(backup._id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = backup.originalName || backup.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('تم تحميل النسخة بنجاح', { icon: '✅' });
    } catch (err: any) {
      toast.error(err.message || 'فشل في تحميل النسخة الاحتياطية', { icon: '❌' });
    } finally {
      setDownloadingBackup(null);
    }
  };

  const handleDelete = async (backupId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه النسخة الاحتياطية؟')) {
      return;
    }

    try {
      setDeletingBackup(backupId);
      await deleteUserBackup(backupId);
      setBackups(backups.filter(backup => backup._id !== backupId));
      toast.success('تم حذف النسخة بنجاح', { icon: '🗑️' });
    } catch (err: any) {
      toast.error(err.message || 'فشل في حذف النسخة الاحتياطية', { icon: '❌' });
    } finally {
      setDeletingBackup(null);
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!confirm('هل أنت متأكد من إعادة تعيين كلمة مرور هذا المستخدم؟')) {
      return;
    }

    try {
      setResettingPassword(userId);
      const result = await resetUserPassword(userId);
      toast.success(`تمت إعادة التعيين: ${result.newPassword}`, { duration: 5000, icon: '🔑' });
      await fetchAllBackups();
    } catch (err: any) {
      toast.error(err.message || 'فشل في إعادة تعيين كلمة المرور', { icon: '❌' });
    } finally {
      setResettingPassword(null);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('تم النسخ', { icon: '📋' });
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 بايت';
    const k = 1024;
    const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ar-IQ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isPasswordHashed = (password: string) => {
    if (!password) return false;
    return password.length === 64 && /^[a-f0-9]{64}$/i.test(password);
  };

  const getPasswordDisplay = (user: any, isVisible: boolean = false) => {
    if (!user?.password) return '••••••••';
    const hashed = isPasswordHashed(user.password);
    if (hashed) {
      return 'كلمة مرور مشفرة';
    } else {
      return isVisible ? user.password : '••••••••';
    }
  };

  const getFileTypeIcon = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (type.includes('db') || type.includes('sqlite')) return <Database className="h-6 w-6 text-blue-500" />;
    if (type.includes('sql')) return <FileText className="h-6 w-6 text-emerald-500" />;
    if (type.includes('zip') || type.includes('rar')) return <Archive className="h-6 w-6 text-purple-500" />;
    return <FileArchive className="h-6 w-6 text-orange-500" />;
  };

  if (loading) {
    return (
      <div className="space-y-8 p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="space-y-2">
            <Skeleton width={300} height={32} />
            <Skeleton width={400} height={20} />
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} height={200} variant="rectangular" className="rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 glass-card">
        <Server className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">خطأ في التحميل</h3>
        <p className="text-slate-500 dark:text-slate-400 mt-2">{error}</p>
        <Button onClick={fetchAllBackups} className="mt-6" variant="secondary">
          <RefreshCw className="h-4 w-4 ml-2" />
          إعادة المحاولة
        </Button>
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
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300">
            النسخ الاحتياطية السحابية
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            إدارة نسخ احتياطية قواعد البيانات للمستخدمين في AWS S3
          </p>
          <div className="flex items-center gap-3 mt-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              <Server className="h-3 w-3 mr-1" />
              Google Cloud Integration
            </span>
            {backups.length > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                <HardDrive className="h-3 w-3 mr-1" />
                المساحة الكلية: {formatFileSize(backups.reduce((total, b) => total + b.size, 0))}
              </span>
            )}
          </div>
        </div>
        <Button
          onClick={fetchAllBackups}
          variant="secondary"
          className="glass shadow-none border-slate-200 dark:border-slate-800"
        >
          <RefreshCw className="h-4 w-4 ml-2" />
          تحديث السحابة
        </Button>
      </header>

      {/* Backups List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {backups.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-12 text-center"
            >
              <FolderOpen className="h-16 w-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">لا توجد نسخ سحابية</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-2">لم يقم أي مستخدم برفع نسخة احتياطية بعد.</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {backups.map((backup) => (
                <motion.div
                  key={backup._id}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass-card overflow-hidden group hover:border-emerald-500/30 transition-all duration-300"
                >
                  <div className="flex flex-col lg:flex-row items-stretch">
                    {/* User Profile Section */}
                    <div className="lg:w-1/3 p-6 bg-slate-50/50 dark:bg-slate-900/20 border-b lg:border-b-0 lg:border-l border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center">
                          <User className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider">المستخدم</p>
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                            {backup.user?.username || 'مستخدم غير معروف'}
                          </h3>
                        </div>
                        <button
                          onClick={() => copyToClipboard(backup.user?.username || '')}
                          className="p-2 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-lg text-emerald-600 transition-colors"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div className="p-3 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                              <Key className="h-3 w-3" /> كلمة المرور
                            </span>
                            {backup.user?.password && (
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isPasswordHashed(backup.user.password)
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                }`}>
                                {isPasswordHashed(backup.user.password) ? 'مشفرة' : 'آمنة'}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 font-mono text-sm text-slate-700 dark:text-emerald-400 bg-slate-100 dark:bg-slate-900/50 px-2 py-1 rounded">
                              {getPasswordDisplay(backup.user, showPassword[backup._id])}
                            </code>
                            {!isPasswordHashed(backup.user?.password || '') && (
                              <button
                                onClick={() => setShowPassword(p => ({ ...p, [backup._id]: !p[backup._id] }))}
                                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors text-slate-500"
                              >
                                {showPassword[backup._id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            )}
                            <button
                              onClick={() => handleResetPassword(backup.user?._id || '')}
                              disabled={resettingPassword === backup.user?._id}
                              className="p-1.5 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded transition-colors text-amber-600 disabled:opacity-50"
                              title="إعادة تعيين"
                            >
                              <RotateCcw className={`h-4 w-4 ${resettingPassword === backup.user?._id ? 'animate-spin' : ''}`} />
                            </button>
                          </div>
                        </div>

                        <div className="p-3 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                          <span className="text-xs font-bold text-slate-500 flex items-center gap-1 mb-2">
                            <Smartphone className="h-3 w-3" /> معرف الجهاز
                          </span>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 font-mono text-xs text-slate-500 truncate bg-slate-100 dark:bg-slate-900/50 px-2 py-1 rounded">
                              {backup.user?.device_id || 'غير متوفر'}
                            </code>
                            <button
                              onClick={() => copyToClipboard(backup.user?.device_id || '')}
                              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors text-slate-500"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Backup Info Section */}
                    <div className="flex-1 p-6 flex flex-col justify-between">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl flex items-center justify-center">
                            {getFileTypeIcon(backup.fileType)}
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-lg font-bold text-slate-900 dark:text-white break-all leading-tight">
                              {backup.backupName || backup.filename}
                            </h4>
                            <p className="text-slate-400 text-sm font-medium">{backup.originalName}</p>
                            <div className="flex flex-wrap items-center gap-3 pt-1">
                              <span className="flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                                <HardDrive className="h-3 w-3" /> {formatFileSize(backup.size)}
                              </span>
                              <span className="flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                                <FileArchive className="h-3 w-3" /> {backup.fileType}
                              </span>
                              {backup.validation?.isValid && (
                                <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded-lg">
                                  <CheckCircle className="h-3 w-3" /> صالح
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex lg:flex-col gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                          {backup.fileExists && (
                            <Button
                              onClick={() => handleDownload(backup)}
                              isLoading={downloadingBackup === backup._id}
                              variant="primary"
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 flex-1"
                            >
                              <Download className="h-4 w-4 ml-2" />
                              تحميل النسخة
                            </Button>
                          )}
                          <Button
                            onClick={() => handleDelete(backup._id)}
                            isLoading={deletingBackup === backup._id}
                            variant="danger"
                            size="sm"
                            className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 shadow-none flex-1"
                          >
                            <Trash2 className="h-4 w-4 ml-2" />
                            حذف السجل
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                            <Clock className="h-4 w-4 text-blue-500" />
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">تاريخ الرفع</p>
                            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">{formatDate(backup.uploadedAt)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                            <Clock className="h-4 w-4 text-amber-500" />
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">تاريخ الإنشاء</p>
                            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">{formatDate(backup.createdAt)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default CloudBackups;