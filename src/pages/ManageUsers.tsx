import React, { useState, useEffect } from 'react';
import Button from '../components/Button';
import { User, Plus, Edit, Trash2, Eye, EyeOff, Search, RefreshCw, ChevronDown, ChevronUp, Shield } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { 
  getAllAdminUsers, 
  createAdminUser, 
  updateAdminUser, 
  deleteAdminUser, 
  toggleAdminUserStatus,
  type AdminUser,
  type CreateUserData
} from '../api/client';
import { usePermissions } from '../hooks/usePermissions';
import { 
  UsersWriteGuard, 
  UsersDeleteGuard
} from '../components/PermissionGuard';

interface EditUserData {
  name?: string;
  role?: string;
  permissions?: string[];
  password?: string;
}

const ManageUsers: React.FC = () => {
  const { canReadUsers, canWriteUsers, canDeleteUsers } = usePermissions();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showPasswords, setShowPasswords] = useState({
    create: false,
    edit: false,
  });
  const [expandedPermissions, setExpandedPermissions] = useState<Set<string>>(new Set());

  const [createForm, setCreateForm] = useState<CreateUserData>({
    username: '',
    name: '',
    password: '',
    role: 'user',
    permissions: ['users:read', 'users:write'],
  });

  const [editForm, setEditForm] = useState<EditUserData>({
    name: '',
    role: 'user',
    permissions: ['users:read', 'users:write'],
    password: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const availableRoles = ['super_admin', 'admin', 'manager', 'user'];
  const availablePermissions = [
    // Core System
    'dashboard:read', 'profile:read', 'profile:write',
    
    // User Management
    'users:read', 'users:write', 'users:delete',
    'customers:read', 'customers:write', 'customers:delete',
    
    // License System
    'licenses:read', 'licenses:write', 'licenses:delete',
    'activation_codes:read', 'activation_codes:write', 'activation_codes:delete',
    'license_verification:read', 'license_verification:write',
    
    // Content Management
    'features:read', 'features:write', 'features:delete',
    'plans:read', 'plans:write', 'plans:delete',
    'updates:read', 'updates:write', 'updates:delete',
    
    // System Operations
    'backups:read', 'backups:write', 'backups:delete',
    'cloud_backups:read', 'cloud_backups:write', 'cloud_backups:delete',
    
    // System Management
    'settings:read', 'settings:write',
    'logs:read', 'system_health:read',
    
    // Analytics & Monitoring
    'analytics:read'
  ];

  // Function to translate permissions to Arabic with better organization
  const translatePermission = (permission: string): string => {
    const permissionMap: { [key: string]: string } = {
      // Core System
      'dashboard:read': 'لوحة التحكم',
      'profile:read': 'قراءة الملف الشخصي',
      'profile:write': 'تعديل الملف الشخصي',
      
      // User Management
      'users:read': 'قراءة المستخدمين',
      'users:write': 'إدارة المستخدمين',
      'users:delete': 'حذف المستخدمين',
      'customers:read': 'قراءة العملاء',
      'customers:write': 'إدارة العملاء',
      'customers:delete': 'حذف العملاء',
      
      // License System
      'licenses:read': 'قراءة التراخيص',
      'licenses:write': 'إدارة التراخيص',
      'licenses:delete': 'حذف التراخيص',
      'activation_codes:read': 'قراءة رموز التفعيل',
      'activation_codes:write': 'إدارة رموز التفعيل',
      'activation_codes:delete': 'حذف رموز التفعيل',
      'license_verification:read': 'قراءة التحقق من التراخيص',
      'license_verification:write': 'إدارة التحقق من التراخيص',
      
      // Content Management
      'features:read': 'قراءة الميزات',
      'features:write': 'إدارة الميزات',
      'features:delete': 'حذف الميزات',
      'plans:read': 'قراءة الخطط',
      'plans:write': 'إدارة الخطط',
      'plans:delete': 'حذف الخطط',
      'updates:read': 'قراءة التحديثات',
      'updates:write': 'إدارة التحديثات',
      'updates:delete': 'حذف التحديثات',
      
      // System Operations
      'backups:read': 'قراءة النسخ الاحتياطية',
      'backups:write': 'إدارة النسخ الاحتياطية',
      'backups:delete': 'حذف النسخ الاحتياطية',
      'cloud_backups:read': 'قراءة النسخ السحابية',
      'cloud_backups:write': 'إدارة النسخ السحابية',
      'cloud_backups:delete': 'حذف النسخ السحابية',
      
      // System Management
      'settings:read': 'قراءة الإعدادات',
      'settings:write': 'إدارة الإعدادات',
      'logs:read': 'قراءة السجلات',
      'system_health:read': 'مراقبة صحة النظام',
      
      // Analytics & Monitoring
      'analytics:read': 'قراءة التحليلات',
      
      // Fallback for unknown permissions
      'default': 'صلاحية غير معروفة'
    };

    return permissionMap[permission] || permission;
  };

  // Function to group permissions by category
  const groupPermissionsByCategory = (permissions: string[]) => {
    const categories = {
      'النظام الأساسي': ['dashboard:read', 'profile:read', 'profile:write'],
      'إدارة المستخدمين': ['users:read', 'users:write', 'users:delete', 'customers:read', 'customers:write', 'customers:delete'],
      'نظام التراخيص': ['licenses:read', 'licenses:write', 'licenses:delete', 'activation_codes:read', 'activation_codes:write', 'activation_codes:delete', 'license_verification:read', 'license_verification:write'],
      'إدارة المحتوى': ['features:read', 'features:write', 'features:delete', 'plans:read', 'plans:write', 'plans:delete', 'updates:read', 'updates:write', 'updates:delete'],
      'عمليات النظام': ['backups:read', 'backups:write', 'backups:delete', 'cloud_backups:read', 'cloud_backups:write', 'cloud_backups:delete'],
      'إدارة النظام': ['settings:read', 'settings:write', 'logs:read', 'system_health:read'],
      'التحليلات والمراقبة': ['analytics:read']
    };

    const grouped: { [key: string]: string[] } = {};
    
    Object.entries(categories).forEach(([category, categoryPermissions]) => {
      const userPermissions = permissions.filter(p => categoryPermissions.includes(p));
      if (userPermissions.length > 0) {
        grouped[category] = userPermissions;
      }
    });

    return grouped;
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getAllAdminUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  const validateCreateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!createForm.username.trim()) {
      newErrors.username = 'اسم المستخدم مطلوب';
    } else if (createForm.username.length < 3) {
      newErrors.username = 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل';
    }

    if (!createForm.name.trim()) {
      newErrors.name = 'الاسم مطلوب';
    }

    if (!createForm.password.trim()) {
      newErrors.password = 'كلمة المرور مطلوبة';
    } else if (createForm.password.length < 6) {
      newErrors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    }

    if (!createForm.role) {
      newErrors.role = 'الدور مطلوب';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateEditForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!editForm.name?.trim()) {
      newErrors.name = 'الاسم مطلوب';
    }

    if (!editForm.role) {
      newErrors.role = 'الدور مطلوب';
    }

    if (editForm.password && editForm.password.length < 6) {
      newErrors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // STRICT PERMISSION CHECK - Prevent unauthorized access
    if (!canWriteUsers()) {
      toast.error('ليس لديك صلاحية لإنشاء مستخدمين جديد');
      return;
    }
    
    if (!validateCreateForm()) {
      return;
    }

    try {
      await createAdminUser(createForm);
      toast.success('تم إنشاء المستخدم بنجاح');
      setShowCreateModal(false);
              setCreateForm({
          username: '',
          name: '',
          password: '',
          role: 'user',
          permissions: ['users:read', 'users:write'],
        });
      fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('خطأ في الاتصال بالخادم');
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // STRICT PERMISSION CHECK - Prevent unauthorized access
    if (!canWriteUsers()) {
      toast.error('ليس لديك صلاحية لتعديل المستخدمين');
      return;
    }
    
    if (!validateEditForm() || !selectedUser) {
      return;
    }

    try {
      const updateData = { ...editForm };
      if (!updateData.password) {
        delete updateData.password;
      }

      await updateAdminUser(selectedUser._id, updateData);
      toast.success('تم تحديث المستخدم بنجاح');
      setShowEditModal(false);
      setSelectedUser(null);
              setEditForm({
          name: '',
          role: 'user',
          permissions: ['users:read', 'users:write'],
          password: '',
        });
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('خطأ في الاتصال بالخادم');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    // STRICT PERMISSION CHECK - Prevent unauthorized access
    if (!canDeleteUsers()) {
      toast.error('ليس لديك صلاحية لحذف المستخدمين');
      return;
    }
    
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
      return;
    }

    try {
      await deleteAdminUser(userId);
      toast.success('تم حذف المستخدم بنجاح');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('خطأ في الاتصال بالخادم');
    }
  };

  const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
    // STRICT PERMISSION CHECK - Prevent unauthorized access
    if (!canWriteUsers()) {
      toast.error('ليس لديك صلاحية لتغيير حالة المستخدمين');
      return;
    }
    
    try {
      await toggleAdminUserStatus(userId, !isActive);
      toast.success(`تم ${isActive ? 'إيقاف' : 'تفعيل'} المستخدم بنجاح`);
      fetchUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast.error('خطأ في الاتصال بالخادم');
    }
  };

  const openEditModal = (user: AdminUser) => {
    // STRICT PERMISSION CHECK - Prevent unauthorized access
    if (!canWriteUsers()) {
      toast.error('ليس لديك صلاحية لتعديل المستخدمين');
      return;
    }
    
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      role: user.role,
      permissions: user.permissions,
      password: '',
    });
    setShowEditModal(true);
  };

  const togglePermissionsExpansion = (userId: string) => {
    const newExpanded = new Set(expandedPermissions);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedPermissions(newExpanded);
  };

  const toggleAllPermissions = () => {
    if (expandedPermissions.size === filteredUsers.length) {
      // All are expanded, collapse all
      setExpandedPermissions(new Set());
    } else {
      // Some or none are expanded, expand all
      setExpandedPermissions(new Set(filteredUsers.map(user => user._id)));
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // Check if user has read permission - STRICT ENFORCEMENT
  if (!canReadUsers()) {
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
                <p>ليس لديك صلاحية لقراءة بيانات المستخدمين. مطلوب صلاحية: <strong>users:read</strong></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">إدارة مستخدمين النظام</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            إدارة حسابات مستخدمي النظام
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              canReadUsers() ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}>
              قراءة المستخدمين {canReadUsers() ? '✓' : '✗'}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              canWriteUsers() ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}>
              إدارة المستخدمين {canWriteUsers() ? '✓' : '✗'}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              canDeleteUsers() ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}>
              حذف المستخدمين {canDeleteUsers() ? '✓' : '✗'}
            </span>
          </div>
        </div>
        <div className="flex-shrink-0">
          <UsersWriteGuard>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center px-6 sm:px-8 py-3 text-sm sm:text-base font-medium"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5 ml-2 sm:ml-3" />
              <span className="hidden sm:inline">إضافة مستخدم جديد</span>
              <span className="sm:hidden">إضافة مستخدم</span>
            </Button>
          </UsersWriteGuard>
        </div>
      </div>

      {/* Search and Refresh */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="بحث بالمستخدمين..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
          />
        </div>
        <Button
          onClick={fetchUsers}
          variant="secondary"
          className="w-full sm:w-auto flex items-center justify-center"
        >
          <RefreshCw className="h-4 w-4 ml-2" />
          تحديث
        </Button>
        {filteredUsers.length > 0 && (
          <Button
            onClick={toggleAllPermissions}
            variant="secondary"
            className="w-full sm:w-auto flex items-center justify-center bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 dark:text-purple-300"
          >
            {expandedPermissions.size === filteredUsers.length ? (
              <>
                <ChevronUp className="h-4 w-4 ml-2" />
                طي جميع الصلاحيات
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 ml-2" />
                عرض جميع الصلاحيات
                {expandedPermissions.size > 0 && (
                  <span className="mr-1 text-xs bg-purple-200 dark:bg-purple-800 px-1.5 py-0.5 rounded-full">
                    {expandedPermissions.size}/{filteredUsers.length}
                  </span>
                )}
              </>
            )}
          </Button>
        )}
      </div>

      {/* Modern Users Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
        {filteredUsers.map((user) => (
          <div key={user._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* User Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 sm:p-6 text-white">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm flex-shrink-0">
                    <User className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-lg font-semibold truncate">{user.name}</h3>
                    <p className="text-blue-100 text-xs sm:text-sm truncate">@{user.username}</p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <span className={`inline-flex px-2 sm:px-3 py-1 text-xs font-semibold rounded-full ${
                    user.role === 'super_admin' 
                      ? 'bg-purple-500/30 text-purple-100'
                      : user.role === 'admin'
                      ? 'bg-red-500/30 text-red-100'
                      : user.role === 'manager'
                      ? 'bg-yellow-500/30 text-yellow-100'
                      : 'bg-green-500/30 text-green-100'
                  }`}>
                    {user.role === 'super_admin' ? 'مدير عام' : 
                     user.role === 'admin' ? 'مدير' : 
                     user.role === 'manager' ? 'مشرف' : 
                     user.role === 'user' ? 'مستخدم' : user.role}
                  </span>
                </div>
              </div>
            </div>

            {/* User Content */}
            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">الحالة:</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user.isActive
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    user.isActive ? 'bg-green-400' : 'bg-red-400'
                  }`}></div>
                  {user.isActive ? 'نشط' : 'موقوف'}
                </span>
              </div>

              {/* Last Login */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">آخر تسجيل دخول:</span>
                <span className="text-sm text-gray-900 dark:text-white">
                  {user.lastLogin 
                    ? new Date(user.lastLogin).toLocaleDateString('ar-IQ')
                    : 'لم يسجل دخول بعد'
                  }
                </span>
              </div>

              {/* Permissions Summary */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <button
                  onClick={() => togglePermissionsExpansion(user._id)}
                  className="flex items-center justify-between w-full text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-2 -m-2 transition-colors duration-200"
                >
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-gray-500" />
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      الصلاحيات ({user.permissions.length})
                    </h4>
                  </div>
                  {expandedPermissions.has(user._id) ? (
                    <ChevronUp className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  )}
                </button>
                
                {/* Collapsed State - Show only summary */}
                {!expandedPermissions.has(user._id) && (
                  <div className="mt-3">
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(groupPermissionsByCategory(user.permissions)).slice(0, 2).map(([category, permissions]) => (
                        <div key={category} className="flex items-center gap-1">
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded">
                            {category}
                          </span>
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            ({permissions.length})
                          </span>
                        </div>
                      ))}
                      {Object.entries(groupPermissionsByCategory(user.permissions)).length > 2 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          +{Object.entries(groupPermissionsByCategory(user.permissions)).length - 2} فئات أخرى
                        </span>
                      )}
                    </div>
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      اضغط لعرض جميع الصلاحيات
                    </div>
                  </div>
                )}

                {/* Expanded State - Show all permissions */}
                {expandedPermissions.has(user._id) && (
                  <div className="mt-3 space-y-3 animate-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-1 gap-3">
                      {Object.entries(groupPermissionsByCategory(user.permissions)).map(([category, permissions]) => (
                        <div key={category} className="space-y-2">
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded">
                            {category} ({permissions.length})
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {permissions.map((permission) => (
                              <span
                                key={permission}
                                className="inline-flex px-2 py-1 text-xs font-medium rounded-md bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                title={translatePermission(permission)}
                              >
                                {translatePermission(permission)}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex gap-2">
                  <UsersWriteGuard>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => openEditModal(user)}
                      className="flex-1 flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-300"
                    >
                      <Edit className="h-4 w-4 ml-1" />
                      تعديل
                    </Button>
                  </UsersWriteGuard>
                  <UsersWriteGuard>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleToggleUserStatus(user._id, user.isActive)}
                      className={`flex-1 flex items-center justify-center ${
                        user.isActive 
                          ? 'bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-300'
                          : 'bg-green-50 hover:bg-green-100 text-green-700 dark:bg-green-900/30 dark:hover:bg-green-900/50 dark:text-green-300'
                      }`}
                    >
                      {user.isActive ? 'إيقاف' : 'تفعيل'}
                    </Button>
                  </UsersWriteGuard>
                  <UsersDeleteGuard>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleDeleteUser(user._id)}
                      className="flex-1 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-300"
                    >
                      <Trash2 className="h-4 w-4 ml-1" />
                      حذف
                    </Button>
                  </UsersDeleteGuard>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto h-24 w-24 text-gray-400">
            <User className="h-24 w-24 mx-auto" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">لا توجد مستخدمين</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {searchTerm ? 'لم يتم العثور على مستخدمين يطابقون البحث.' : 'ابدأ بإضافة مستخدم جديد.'}
          </p>
          {!searchTerm && (
            <div className="mt-6">
              <UsersWriteGuard>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-base font-medium"
                >
                  <Plus className="h-5 w-5 ml-3" />
                  إضافة مستخدم جديد
                </Button>
              </UsersWriteGuard>
            </div>
          )}
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                إضافة مستخدم جديد
              </h3>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    اسم المستخدم
                  </label>
                  <input
                    type="text"
                    value={createForm.username}
                    onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                    className={`block w-full px-3 py-2 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${
                      errors.username ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="أدخل اسم المستخدم"
                  />
                  {errors.username && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.username}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    الاسم الكامل
                  </label>
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    className={`block w-full px-3 py-2 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${
                      errors.name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="أدخل الاسم الكامل"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    كلمة المرور
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.create ? 'text' : 'password'}
                      value={createForm.password}
                      onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                      className={`block w-full pr-10 pl-3 py-2 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${
                        errors.password ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="أدخل كلمة المرور"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 left-0 pl-3 flex items-center"
                      onClick={() => setShowPasswords({ ...showPasswords, create: !showPasswords.create })}
                    >
                      {showPasswords.create ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    الدور
                  </label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                    className={`block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      errors.role ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                    }`}
                  >
                    {availableRoles.map((role) => (
                      <option key={role} value={role}>
                        {role === 'super_admin' ? 'مدير عام' : 
                         role === 'admin' ? 'مدير' : 
                         role === 'manager' ? 'مشرف' : 
                         role === 'user' ? 'مستخدم' : role}
                      </option>
                    ))}
                  </select>
                  {errors.role && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.role}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    الصلاحيات
                  </label>
                  <div className="space-y-4 max-h-60 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-4">
                    {Object.entries(groupPermissionsByCategory(availablePermissions)).map(([category, permissions]) => (
                      <div key={category} className="space-y-2">
                        <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-1">
                          {category}
                        </div>
                        <div className="space-y-1">
                          {permissions.map((permission) => (
                            <label key={permission} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={createForm.permissions.includes(permission)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setCreateForm({
                                      ...createForm,
                                      permissions: [...createForm.permissions, permission],
                                    });
                                  } else {
                                    setCreateForm({
                                      ...createForm,
                                      permissions: createForm.permissions.filter((p) => p !== permission),
                                    });
                                  }
                                }}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <span className="mr-2 text-sm text-gray-700 dark:text-gray-300">
                                {translatePermission(permission)}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 space-x-reverse">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowCreateModal(false)}
                  >
                    إلغاء
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                    إنشاء المستخدم
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                تعديل المستخدم: {selectedUser.username}
              </h3>
              <form onSubmit={handleEditUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    الاسم الكامل
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className={`block w-full px-3 py-2 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${
                      errors.name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="أدخل الاسم الكامل"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    كلمة المرور الجديدة (اختياري)
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.edit ? 'text' : 'password'}
                      value={editForm.password}
                      onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                      className={`block w-full pr-10 pl-3 py-2 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${
                        errors.password ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="اتركها فارغة إذا لم ترد تغييرها"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 left-0 pl-3 flex items-center"
                      onClick={() => setShowPasswords({ ...showPasswords, edit: !showPasswords.edit })}
                    >
                      {showPasswords.edit ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    الدور
                  </label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className={`block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      errors.role ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                    }`}
                  >
                    {availableRoles.map((role) => (
                      <option key={role} value={role}>
                        {role === 'super_admin' ? 'مدير عام' : 
                         role === 'admin' ? 'مدير' : 
                         role === 'manager' ? 'مشرف' : 
                         role === 'user' ? 'مستخدم' : role}
                      </option>
                    ))}
                  </select>
                  {errors.role && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.role}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    الصلاحيات
                  </label>
                  <div className="space-y-4 max-h-60 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-4">
                    {Object.entries(groupPermissionsByCategory(availablePermissions)).map(([category, permissions]) => (
                      <div key={category} className="space-y-2">
                        <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-1">
                          {category}
                        </div>
                        <div className="space-y-1">
                          {permissions.map((permission) => (
                            <label key={permission} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={editForm.permissions?.includes(permission)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setEditForm({
                                      ...editForm,
                                      permissions: [...(editForm.permissions || []), permission],
                                    });
                                  } else {
                                    setEditForm({
                                      ...editForm,
                                      permissions: editForm.permissions?.filter((p) => p !== permission) || [],
                                    });
                                  }
                                }}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <span className="mr-2 text-sm text-gray-700 dark:text-gray-300">
                                {translatePermission(permission)}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 space-x-reverse">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowEditModal(false)}
                  >
                    إلغاء
                  </Button>
                  <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
                    حفظ التغييرات
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;
