import React, { useState, useEffect } from 'react';
import Table from '../components/Table';
import Button from '../components/Button';
import { 
  getAllUserBackups, 
  downloadUserBackup, 
  deleteUserBackup, 
  resetUserPassword,
  getUserById,
  getUserWithDeviceById,
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
  Search, 
  Minimize2, 
  FolderOpen,
  HardDrive,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  Key,
  Server,
  Copy,
  Check
} from 'lucide-react';

const CloudBackups: React.FC = () => {
  const [backups, setBackups] = useState<UserBackup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBackup, setSelectedBackup] = useState<UserBackup | null>(null);
  const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>({});
  const [downloadingBackup, setDownloadingBackup] = useState<string | null>(null);
  const [deletingBackup, setDeletingBackup] = useState<string | null>(null);
  const [resettingPassword, setResettingPassword] = useState<string | null>(null);
  const [expandedDeviceIds, setExpandedDeviceIds] = useState<{ [key: string]: boolean }>({});
  const [copiedText, setCopiedText] = useState<{ [key: string]: boolean }>({});

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
            

            // If user data is missing or incomplete, try to fetch it
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
        
        // Log final enhanced data
        enhancedData.forEach((backup, index) => {
          
        });
        
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
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = backup.originalName || backup.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error downloading backup:', err);
      alert(err.message || 'فشل في تحميل النسخة الاحتياطية');
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
    } catch (err: any) {
      console.error('Error deleting backup:', err);
      alert(err.message || 'فشل في حذف النسخة الاحتياطية');
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
      alert(`تم إعادة تعيين كلمة المرور بنجاح!\nكلمة المرور الجديدة: ${result.newPassword}`);
      // Refresh the backups to get updated data
      await fetchAllBackups();
    } catch (err: any) {
      console.error('Error resetting password:', err);
      alert(err.message || 'فشل في إعادة تعيين كلمة المرور');
    } finally {
      setResettingPassword(null);
    }
  };

  const togglePasswordVisibility = (userId: string) => {
    setShowPassword(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const toggleDeviceIdExpansion = (deviceId: string) => {
    setExpandedDeviceIds(prev => ({
      ...prev,
      [deviceId]: !prev[deviceId]
    }));
  };

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(prev => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopiedText(prev => ({ ...prev, [key]: false }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const truncateDeviceId = (deviceId: string | undefined, maxLength: number = 12) => {
    if (!deviceId) return 'غير محدد';
    if (deviceId.length <= maxLength) return deviceId;
    return `${deviceId.substring(0, maxLength)}...`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 بايت';
    const k = 1024;
    const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ar-IQ');
  };

  // Helper function to detect if password is hashed (SHA-256 hex string)
  const isPasswordHashed = (password: string) => {
    if (!password) return false;
    // SHA-256 hash is 64 characters of hexadecimal
    return password.length === 64 && /^[a-f0-9]{64}$/i.test(password);
  };

  // Helper function to get password display value
  const getPasswordDisplay = (user: any, isVisible: boolean = false) => {
    if (!user?.password) return '••••••••';
    
    const hashed = isPasswordHashed(user.password);
    if (hashed) {
      return 'مشفرة - اضغط إعادة تعيين للحصول على كلمة مرور قابلة للقراءة';
    } else {
      return isVisible ? user.password : '••••••••';
    }
  };

  const getFileTypeIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case '.db':
      case '.sqlite':
      case '.sqlite3':
        return <Database className="h-5 w-5 text-blue-600" />;
      case '.sql':
        return <FileText className="h-5 w-5 text-green-600" />;
      case '.zip':
        return <Archive className="h-5 w-5 text-purple-600" />;
      case '.tar':
      case '.gz':
        return <FileArchive className="h-5 w-5 text-orange-600" />;
      default:
        return <HardDrive className="h-5 w-5 text-gray-600" />;
    }
  };

  const columns = [
    {
      header: 'معلومات المستخدم',
      accessorKey: 'user',
      cell: ({ row }: { row: { original: UserBackup } }) => {
        const user = row.original.user;
        
        if (!user) {
          return (
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
              <div className="text-red-600 dark:text-red-400 font-medium">لا توجد معلومات مستخدم</div>
            </div>
          );
        }

        return (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 space-y-3">
            {/* Username Section */}
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">👤 اسم المستخدم</div>
                <div className="flex items-center gap-2">
                  <div className="font-bold text-gray-900 dark:text-white text-lg font-mono">
                    {user.username || 'غير محدد'}
                  </div>
                  {user.username && (
                    <button
                      onClick={() => copyToClipboard(user.username, `username-${user._id}`)}
                      className="bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 p-1 rounded transition-colors"
                      title="نسخ اسم المستخدم"
                    >
                      {copiedText[`username-${user._id}`] ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Password Section */}
            <div className="bg-white dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Key className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-700 dark:text-green-400">🔑 كلمة المرور</span>
                {user.password ? (
                  isPasswordHashed(user.password) ? (
                    <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-2 py-1 rounded-full text-xs font-medium">
                      مشفرة
                    </span>
                  ) : (
                    <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded-full text-xs font-medium">
                      قابلة للقراءة
                    </span>
                  )
                ) : (
                  <span className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-2 py-1 rounded-full text-xs font-medium">
                    غير متوفرة
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono bg-green-100 dark:bg-green-900/30 px-3 py-2 rounded-lg text-sm font-medium text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800 flex-1">
                  {user.password ? getPasswordDisplay(user, showPassword[user._id]) : 'غير متوفرة'}
                </span>
                {user.password && !isPasswordHashed(user.password) && (
                  <button
                    onClick={() => togglePasswordVisibility(user._id)}
                    className="bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-600 dark:text-green-400 p-2 rounded-lg transition-colors"
                    title={showPassword[user._id] ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  >
                    {showPassword[user._id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                )}
                {user.password && (
                  <button
                    onClick={() => copyToClipboard(user.password || '', `password-${user._id}`)}
                    className="bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-600 dark:text-green-400 p-2 rounded-lg transition-colors"
                    title="نسخ كلمة المرور"
                  >
                    {copiedText[`password-${user._id}`] ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                )}
                {user.password && isPasswordHashed(user.password) && (
                  <button
                    onClick={() => handleResetPassword(user._id)}
                    disabled={resettingPassword === user._id}
                    className="bg-orange-100 hover:bg-orange-200 dark:bg-orange-900/30 dark:hover:bg-orange-900/50 text-orange-600 dark:text-orange-400 p-2 rounded-lg transition-colors disabled:opacity-50"
                    title="إعادة تعيين كلمة المرور"
                  >
                    {resettingPassword === user._id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                  </button>
                )}
              </div>
              {user.password && isPasswordHashed(user.password) && (
                <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
                  💡 كلمة المرور مشفرة. اضغط على "إعادة تعيين" للحصول على كلمة مرور جديدة قابلة للقراءة.
                </div>
              )}
              {!user.password && (
                <div className="mt-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                  ⚠️ كلمة المرور غير متوفرة لهذا المستخدم
                </div>
              )}
            </div>
          </div>
        );
      }
    },
    {
      header: 'معرف الجهاز',
      accessorKey: 'device_id',
      cell: ({ row }: { row: { original: UserBackup } }) => (
        <div className="space-y-3">
          {/* User Registered Device ID */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-purple-700 dark:text-purple-400">معرف الجهاز المسجل</span>
              {row.original.user?.device_id ? (
                <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-2 py-1 rounded-full text-xs font-medium">
                  المستخدم
                </span>
              ) : (
                <span className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-2 py-1 rounded-full text-xs font-medium">
                  غير متوفر
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="font-mono text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-3 py-2 rounded-lg border border-purple-200 dark:border-purple-800 flex-1 font-bold">
                {row.original.user?.device_id ? (
                  expandedDeviceIds[`user-device-${row.original.user._id}`] 
                    ? row.original.user.device_id 
                    : truncateDeviceId(row.original.user.device_id)
                ) : 'غير محدد'}
              </div>
              {row.original.user?.device_id && (
                <>
                  <button
                    onClick={() => copyToClipboard(row.original.user.device_id || '', `user-device-column-${row.original.user._id}`)}
                    className="bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 text-purple-600 dark:text-purple-400 p-2 rounded-lg transition-colors"
                    title="نسخ معرف الجهاز المسجل"
                  >
                    {copiedText[`user-device-column-${row.original.user._id}`] ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => toggleDeviceIdExpansion(`user-device-${row.original.user._id}`)}
                    className="bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 text-purple-600 dark:text-purple-400 p-2 rounded-lg transition-colors"
                    title={expandedDeviceIds[`user-device-${row.original.user._id}`] ? 'تصغير' : 'توسيع'}
                  >
                    {expandedDeviceIds[`user-device-${row.original.user._id}`] ? <Minimize2 className="h-4 w-4" /> : <Search className="h-4 w-4" />}
                  </button>
                </>
              )}
            </div>
            <div className="mt-2 text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 p-2 rounded">
              {row.original.user?.device_id ? '📱 معرف الجهاز المسجل للمستخدم في النظام' : '⚠️ معرف الجهاز المسجل غير متوفر'}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'تفاصيل النسخة الاحتياطية',
      accessorKey: 'backupName',
      cell: ({ row }: { row: { original: UserBackup } }) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {getFileTypeIcon(row.original.fileType)}
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                {row.original.backupName}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {row.original.originalName}
              </div>
            </div>
          </div>
          {row.original.description && (
            <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded">
              {row.original.description}
            </div>
          )}
        </div>
      )
    },
    {
      header: 'معلومات الملف',
      accessorKey: 'size',
      cell: ({ row }: { row: { original: UserBackup } }) => (
        <div className="space-y-2">
          <div className="text-sm">
            <span className="text-gray-600 dark:text-gray-400">الحجم: </span>
            <span className="font-medium text-gray-900 dark:text-white">{formatFileSize(row.original.size)}</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-600 dark:text-gray-400">النوع: </span>
            <span className="font-medium text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
              {row.original.fileType}
            </span>
          </div>
          {row.original.validation && (
            <div className="text-sm">
              <span className="text-gray-600 dark:text-gray-400">الحالة: </span>
              <div className="inline-flex items-center gap-1">
                {row.original.validation.isValid ? (
                  <CheckCircle className="h-3 w-3 text-green-600" />
                ) : (
                  <AlertCircle className="h-3 w-3 text-red-600" />
                )}
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  row.original.validation.isValid 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {row.original.validation.isValid ? 'صالح' : 'غير صالح'}
                </span>
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      header: 'التواريخ',
      accessorKey: 'uploadedAt',
      cell: ({ row }: { row: { original: UserBackup } }) => (
        <div className="space-y-2 text-sm">
          <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
            <div className="flex items-center gap-1 mb-1">
              <Clock className="h-3 w-3 text-gray-500" />
              <div className="text-gray-600 dark:text-gray-400 text-xs">تم الرفع:</div>
            </div>
            <div className="font-medium text-gray-900 dark:text-white">{formatDate(row.original.uploadedAt)}</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
            <div className="flex items-center gap-1 mb-1">
              <Clock className="h-3 w-3 text-gray-500" />
              <div className="text-gray-600 dark:text-gray-400 text-xs">تم الإنشاء:</div>
            </div>
            <div className="font-medium text-gray-900 dark:text-white">{formatDate(row.original.createdAt)}</div>
          </div>
        </div>
      )
    },
    {
      header: 'الإجراءات',
      accessorKey: 'actions',
      cell: ({ row }: { row: { original: UserBackup } }) => (
        <div className="flex flex-col gap-2">
          {row.original.fileExists && row.original.downloadUrl && (
            <Button
              onClick={() => handleDownload(row.original)}
              disabled={downloadingBackup === row.original._id}
              variant="primary"
              size="sm"
              className="w-full"
            >
              {downloadingBackup === row.original._id ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span className="mr-1">
                {downloadingBackup === row.original._id ? 'جاري التحميل...' : 'تحميل'}
              </span>
            </Button>
          )}
          <Button
            onClick={() => handleDelete(row.original._id)}
            disabled={deletingBackup === row.original._id}
            variant="danger"
            size="sm"
            className="w-full"
          >
            {deletingBackup === row.original._id ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            <span className="mr-1">
              {deletingBackup === row.original._id ? 'جاري الحذف...' : 'حذف'}
            </span>
          </Button>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-12 w-12 text-primary-600 animate-spin" />
          <div className="text-lg text-gray-600 dark:text-gray-400">جاري تحميل النسخ الاحتياطية...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-lg text-red-600 dark:text-red-400 mb-4 text-center">{error}</div>
        <Button
          onClick={fetchAllBackups}
          variant="primary"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          إعادة المحاولة
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">النسخ الاحتياطية السحابية</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            إدارة جميع نسخ احتياطية قواعد البيانات للمستخدمين في السحابة
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={fetchAllBackups}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            تحديث
          </Button>
        </div>
      </div>


      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              جميع نسخ احتياطية المستخدمين ({backups.length})
            </h2>
            {backups.length > 0 && (
              <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <HardDrive className="h-4 w-4" />
                إجمالي المساحة: {formatFileSize(backups.reduce((total, backup) => total + backup.size, 0))}
              </div>
            )}
          </div>
        </div>
        
        {backups.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <FolderOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <div className="text-gray-500 dark:text-gray-400 text-lg font-medium">لم يتم العثور على نسخ احتياطية</div>
            <p className="text-gray-400 dark:text-gray-500 mt-2">لم يقم المستخدمون برفع أي نسخ احتياطية بعد.</p>
          </div>
        ) : (
          <Table
            columns={columns}
            data={backups}
            className="min-w-full"
          />
        )}
      </div>
    </div>
  );
};

export default CloudBackups;