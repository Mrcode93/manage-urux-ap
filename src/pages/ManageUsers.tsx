import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import Button from '../components/Button';
import Skeleton from '../components/Skeleton';
import {
  User, Plus, Trash2, Search,
  RefreshCw, ChevronDown, ChevronUp, Shield
} from 'lucide-react';
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
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [expandedPermissions, setExpandedPermissions] = useState<Set<string>>(new Set());

  // Fetch users using React Query
  const { data: users = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['admin-users'],
    queryFn: getAllAdminUsers,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

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

  const availableRoles = ['super_admin', 'admin', 'manager', 'user'];
  const availablePermissions = [
    'dashboard:read', 'profile:read', 'profile:write',
    'users:read', 'users:write', 'users:delete',
    'customers:read', 'customers:write', 'customers:delete',
    'licenses:read', 'licenses:write', 'licenses:delete',
    'activation_codes:read', 'activation_codes:write', 'activation_codes:delete',
    'license_verification:read', 'license_verification:write',
    'features:read', 'features:write', 'features:delete',
    'plans:read', 'plans:write', 'plans:delete',
    'updates:read', 'updates:write', 'updates:delete',
    'backups:read', 'backups:write', 'backups:delete',
    'cloud_backups:read', 'cloud_backups:write', 'cloud_backups:delete',
    'settings:read', 'settings:write',
    'logs:read', 'system_health:read',
    'analytics:read'
  ];

  const translatePermission = (permission: string): string => {
    const permissionMap: { [key: string]: string } = {
      'dashboard:read': 'لوحة التحكم',
      'profile:read': 'قراءة الملف الشخصي',
      'profile:write': 'تعديل الملف الشخصي',
      'users:read': 'قراءة المستخدمين',
      'users:write': 'إدارة المستخدمين',
      'users:delete': 'حذف المستخدمين',
      'customers:read': 'قراءة العملاء',
      'customers:write': 'إدارة العملاء',
      'customers:delete': 'حذف العملاء',
      'licenses:read': 'قراءة التراخيص',
      'licenses:write': 'إدارة التراخيص',
      'licenses:delete': 'حذف التراخيص',
      'activation_codes:read': 'قراءة رموز التفعيل',
      'activation_codes:write': 'إدارة رموز التفعيل',
      'activation_codes:delete': 'حذف رموز التفعيل',
      'license_verification:read': 'قراءة التحقق',
      'license_verification:write': 'إدارة التحقق',
      'features:read': 'قراءة الميزات',
      'features:write': 'إدارة الميزات',
      'features:delete': 'حذف الميزات',
      'plans:read': 'قراءة الخطط',
      'plans:write': 'إدارة الخطط',
      'plans:delete': 'حذف الخطط',
      'updates:read': 'قراءة التحديثات',
      'updates:write': 'إدارة التحديثات',
      'updates:delete': 'حذف التحديثات',
      'backups:read': 'قراءة النسخ الاحتياطية',
      'backups:write': 'إدارة النسخ الاحتياطية',
      'backups:delete': 'حذف النسخ الاحتياطية',
      'cloud_backups:read': 'قراءة النسخ السحابية',
      'cloud_backups:write': 'إدارة النسخ السحابية',
      'cloud_backups:delete': 'حذف النسخ السحابية',
      'settings:read': 'قراءة الإعدادات',
      'settings:write': 'إدارة الإعدادات',
      'logs:read': 'قراءة السجلات',
      'system_health:read': 'صحة النظام',
      'analytics:read': 'التحليلات'
    };
    return permissionMap[permission] || permission;
  };

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
      if (userPermissions.length > 0) grouped[category] = userPermissions;
    });
    return grouped;
  };

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    const searchLower = searchTerm.toLowerCase();
    return users.filter(user =>
      user.username.toLowerCase().includes(searchLower) ||
      user.name.toLowerCase().includes(searchLower) ||
      user.role.toLowerCase().includes(searchLower)
    );
  }, [users, searchTerm]);

  const createUserMutation = useMutation({
    mutationFn: createAdminUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('تم إنشاء المستخدم بنجاح');
      setShowCreateModal(false);
      setCreateForm({
        username: '', name: '', password: '', role: 'user',
        permissions: ['users:read', 'users:write'],
      });
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'خطأ في إنشاء المستخدم')
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: EditUserData }) => updateAdminUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('تم تحديث المستخدم بنجاح');
      setShowEditModal(false);
      setSelectedUser(null);
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'خطأ في تحديث المستخدم')
  });

  const deleteUserMutation = useMutation({
    mutationFn: deleteAdminUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('تم حذف المستخدم بنجاح');
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'خطأ في حذف المستخدم')
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      toggleAdminUserStatus(userId, !isActive),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(`تم ${variables.isActive ? 'إيقاف' : 'تفعيل'} المستخدم بنجاح`);
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'خطأ في تغيير الحالة')
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWriteUsers()) return toast.error('ليس لديك صلاحية');
    createUserMutation.mutate(createForm);
  };

  const handleEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWriteUsers() || !selectedUser) return;
    const updateData = { ...editForm };
    if (!updateData.password) delete updateData.password;
    updateUserMutation.mutate({ id: selectedUser._id, data: updateData });
  };

  const handleDeleteUser = (userId: string) => {
    if (!canDeleteUsers()) return toast.error('ليس لديك صلاحية');
    if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) deleteUserMutation.mutate(userId);
  };

  const handleToggleUserStatus = (userId: string, isActive: boolean) => {
    if (!canWriteUsers()) return toast.error('ليس لديك صلاحية');
    toggleUserStatusMutation.mutate({ userId, isActive });
  };

  const openEditModal = (user: AdminUser) => {
    if (!canWriteUsers()) return toast.error('ليس لديك صلاحية');
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
    if (newExpanded.has(userId)) newExpanded.delete(userId);
    else newExpanded.add(userId);
    setExpandedPermissions(newExpanded);
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  if (!canReadUsers()) {
    return (
      <div className="p-8 glass-card bg-red-50/20 border-red-200 text-center">
        <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-black text-red-600">وصول محظور</h3>
        <p className="text-red-500 font-medium mt-2">ليس لديك صلاحية لمشاهدة مستخدمين النظام</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-8 p-4">
        <Skeleton width={300} height={40} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} height={200} variant="rectangular" className="rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-8">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300">
            إدارة مستخدمين النظام
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">
            إدارة حسابات المشرفين وصلاحيات الوصول للنظام
          </p>
        </div>
        <UsersWriteGuard>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/20 rounded-2xl flex items-center gap-3 font-bold"
          >
            <Plus className="h-5 w-5" />
            إضافة مستخدم جديد
          </Button>
        </UsersWriteGuard>
      </header>

      <div className="flex flex-col md:flex-row items-center justify-between gap-6 glass-card p-4 border border-white/20">
        <div className="relative group flex-1 w-full sm:max-w-md">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="بحث بالاسم أو المستخدم..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-12 pl-4 py-3 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all dark:text-white font-bold"
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button onClick={() => refetch()} variant="secondary" className="px-6 py-3 rounded-2xl flex items-center gap-2 font-black">
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {filteredUsers.map((user) => (
          <motion.div key={user._id} variants={itemVariants} className="glass-card overflow-hidden border border-white/20 shadow-xl group">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-800 p-6 text-white relative">
              <div className="relative flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/30">
                  <User className="h-7 w-7 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl font-black truncate leading-tight">{user.name}</h3>
                  <p className="text-blue-100/70 text-sm font-bold truncate">@{user.username}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className={`px-3 py-1 text-[10px] font-black uppercase rounded-lg border bg-white/10 ${user.role === 'super_admin' ? 'border-purple-400/50 text-purple-100' :
                  user.role === 'admin' ? 'border-red-400/50 text-red-100' : 'border-emerald-400/50 text-emerald-100'
                  }`}>
                  {user.role}
                </span>
                {!user.isActive && <span className="bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-lg">موقوف</span>}
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">الحالة</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <span className="text-xs font-black dark:text-white">{user.isActive ? 'نشط' : 'معطل'}</span>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">آخر حضور</p>
                  <p className="text-xs font-black dark:text-white truncate">{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('ar-IQ') : 'أبداً'}</p>
                </div>
              </div>

              <button
                onClick={() => togglePermissionsExpansion(user._id)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-between font-bold text-sm"
              >
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-500" />
                  <span>الصلاحيات ({user.permissions.length})</span>
                </div>
                {expandedPermissions.has(user._id) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              <AnimatePresence>
                {expandedPermissions.has(user._id) && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {user.permissions.map(p => (
                        <span key={p} className="text-[9px] font-bold px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md">
                          {translatePermission(p)}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-2 pt-2">
                <UsersWriteGuard>
                  <button onClick={() => openEditModal(user)} className="flex-1 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-black text-xs">تعديل</button>
                </UsersWriteGuard>
                <UsersWriteGuard>
                  <button onClick={() => handleToggleUserStatus(user._id, user.isActive)} className={`flex-1 h-10 rounded-xl font-black text-xs ${user.isActive ? 'text-red-600 bg-red-50 dark:bg-red-900/20' : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'}`}>
                    {user.isActive ? 'تعطيل' : 'تفعيل'}
                  </button>
                </UsersWriteGuard>
                <UsersDeleteGuard>
                  <button onClick={() => handleDeleteUser(user._id)} className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-red-500"><Trash2 className="h-4 w-4 mx-auto" /></button>
                </UsersDeleteGuard>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreateModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="relative w-full max-w-2xl glass-card overflow-hidden border border-white/20 bg-white dark:bg-slate-900">
              <div className="bg-blue-600 p-6 text-white text-xl font-black italic">إضافة مستخدم جديد</div>
              <form onSubmit={handleCreateUser} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-500">اسم المستخدم</label>
                    <input type="text" value={createForm.username} onChange={e => setCreateForm({ ...createForm, username: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-500">الاسم الكامل</label>
                    <input type="text" value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-500">كلمة المرور</label>
                    <input type="password" value={createForm.password} onChange={e => setCreateForm({ ...createForm, password: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-500">الدور</label>
                    <select value={createForm.role} onChange={e => setCreateForm({ ...createForm, role: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold">
                      {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-xs font-black text-slate-500">الصلاحيات</p>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(groupPermissionsByCategory(availablePermissions)).map(([cat, perms]) => (
                      <div key={cat} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <h5 className="text-[10px] font-black text-blue-600 mb-2">{cat}</h5>
                        <div className="space-y-2">
                          {perms.map(p => (
                            <label key={p} className="flex items-center gap-2 cursor-pointer group">
                              <input
                                type="checkbox"
                                checked={createForm.permissions.includes(p)}
                                onChange={e => {
                                  if (e.target.checked) setCreateForm(prev => ({ ...prev, permissions: [...prev.permissions, p] }));
                                  else setCreateForm(prev => ({ ...prev, permissions: prev.permissions.filter(x => x !== p) }));
                                }}
                                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-blue-600">{translatePermission(p)}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="secondary" onClick={() => setShowCreateModal(false)}>إلغاء</Button>
                  <Button type="submit" isLoading={createUserMutation.isPending}>إضافة المستخدم</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowEditModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="relative w-full max-w-2xl glass-card overflow-hidden border border-white/20 bg-white dark:bg-slate-900">
              <div className="bg-emerald-600 p-6 text-white text-xl font-black italic">تعديل المستخدم: {selectedUser.username}</div>
              <form onSubmit={handleEditUser} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-500">الاسم الكامل</label>
                    <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-500">كلمة المرور (اختياري)</label>
                    <input type="password" value={editForm.password} onChange={e => setEditForm({ ...editForm, password: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold" placeholder="اتركها فارغة للتخطي" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-500">الدور</label>
                  <select value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold">
                    {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="space-y-3">
                  <p className="text-xs font-black text-slate-500">الصلاحيات</p>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(groupPermissionsByCategory(availablePermissions)).map(([cat, perms]) => (
                      <div key={cat} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <h5 className="text-[10px] font-black text-emerald-600 mb-2">{cat}</h5>
                        <div className="space-y-2">
                          {perms.map(p => (
                            <label key={p} className="flex items-center gap-2 cursor-pointer group">
                              <input
                                type="checkbox"
                                checked={editForm.permissions?.includes(p)}
                                onChange={e => {
                                  if (e.target.checked) setEditForm(prev => ({ ...prev, permissions: [...(prev.permissions || []), p] }));
                                  else setEditForm(prev => ({ ...prev, permissions: prev.permissions?.filter(x => x !== p) }));
                                }}
                                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                              />
                              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-emerald-600">{translatePermission(p)}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="secondary" onClick={() => setShowEditModal(false)}>إلغاء</Button>
                  <Button type="submit" isLoading={updateUserMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white">حفظ التغييرات</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ManageUsers;
