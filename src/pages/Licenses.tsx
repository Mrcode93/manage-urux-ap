import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllLicenses, revokeLicense, extendLicense, fixMissingLicenses, type License } from '../api/client';
import Button from '../components/Button';
import Loader from '../components/Loader';
import Table, { type Column } from '../components/Table';
import { toast } from 'react-hot-toast';

export default function Licenses() {
  const [filters, setFilters] = useState({
    active: '',
    type: '',
    device_id: ''
  });
  const [extendModal, setExtendModal] = useState<{ license: License | null; days: number }>({
    license: null,
    days: 30
  });

  const queryClient = useQueryClient();

  const { data: licenses = [], isLoading } = useQuery<License[]>({
    queryKey: ['licenses', filters],
    queryFn: () => getAllLicenses(filters)
  });

  if (isLoading) {
    return <Loader message="جاري تحميل تراخيص النظام..." />;
  }

  const revokeMutation = useMutation({
    mutationFn: ({ deviceId, reason }: { deviceId: string; reason: string }) =>
      revokeLicense(deviceId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['licenses'] });
      queryClient.invalidateQueries({ queryKey: ['licenseStats'] });
      toast.success('تم إلغاء الترخيص بنجاح');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'فشل في إلغاء الترخيص');
    }
  });

  const extendMutation = useMutation({
    mutationFn: ({ deviceId, days }: { deviceId: string; days: number }) =>
      extendLicense(deviceId, days),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['licenses'] });
      queryClient.invalidateQueries({ queryKey: ['licenseStats'] });
      toast.success('تم تمديد الترخيص بنجاح');
      setExtendModal({ license: null, days: 30 });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'فشل في تمديد الترخيص');
    }
  });

  const fixMissingMutation = useMutation({
    mutationFn: fixMissingLicenses,
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['licenses'] });
      queryClient.invalidateQueries({ queryKey: ['licenseStats'] });
      toast.success(`تم إصلاح التراخيص المفقودة: ${data.message || ''}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'فشل في إصلاح التراخيص المفقودة');
    }
  });

  const handleRevoke = (license: License) => {
    const reason = prompt('سبب إلغاء الترخيص:');
    if (reason) {
      revokeMutation.mutate({ deviceId: license.device_id, reason });
    }
  };

  const handleExtend = () => {
    if (extendModal.license) {
      extendMutation.mutate({
        deviceId: extendModal.license.device_id,
        days: extendModal.days
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'revoked':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'نشط';
      case 'expired':
        return 'منتهي';
      case 'revoked':
        return 'ملغي';
      default:
        return 'غير محدد';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'trial':
        return 'تجريبي';
      case 'full':
        return 'كامل';
      case 'custom':
        return 'مخصص';
      default:
        return type;
    }
  };

  const columns: Column<License>[] = [
    {
      header: 'معرف الجهاز',
      accessorKey: 'device_id',
      cell: ({ row }) => (
        <div className="font-mono text-sm">
          {row.original.device_id}
        </div>
      )
    },
    {
      header: 'نوع الترخيص',
      accessorKey: 'type',
      cell: ({ row }) => (
        <span className={`px-2 py-1 rounded-full text-xs ${row.original.type === 'trial' ? 'bg-blue-100 text-blue-800' :
          row.original.type === 'full' ? 'bg-green-100 text-green-800' :
            'bg-purple-100 text-purple-800'
          }`}>
          {getTypeText(row.original.type)}
        </span>
      )
    },
    {
      header: 'الميزات',
      accessorKey: 'features',
      cell: ({ row }) => (
        <div className="text-xs text-gray-600 dark:text-gray-400">
          {row.original.features.join(', ')}
        </div>
      )
    },
    {
      header: 'تاريخ الإصدار',
      accessorKey: 'issued_at',
      cell: ({ row }) => (
        <div className="text-sm">
          {new Date(row.original.issued_at).toLocaleDateString('ar-SA')}
        </div>
      )
    },
    {
      header: 'تاريخ الانتهاء',
      accessorKey: 'expires_at',
      cell: ({ row }) => {
        const expiresAt = row.original.expires_at;
        if (!expiresAt) {
          return <span className="text-green-600">دائم</span>;
        }
        const daysUntilExpiry = row.original.days_until_expiry || 0;
        return (
          <div className="text-sm">
            <div>{new Date(expiresAt).toLocaleDateString('ar-SA')}</div>
            {daysUntilExpiry > 0 ? (
              <div className="text-xs text-gray-500">
                متبقي {daysUntilExpiry} يوم
              </div>
            ) : (
              <div className="text-xs text-red-500">
                منتهي منذ {Math.abs(daysUntilExpiry)} يوم
              </div>
            )}
          </div>
        );
      }
    },
    {
      header: 'الحالة',
      accessorKey: 'status',
      cell: ({ row }) => (
        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(row.original.status || 'unknown')}`}>
          {getStatusText(row.original.status || 'unknown')}
        </span>
      )
    },
    {
      header: 'رمز التفعيل',
      accessorKey: 'activation_code',
      cell: ({ row }) => (
        <div className="font-mono text-xs text-gray-600 dark:text-gray-400">
          {row.original.activation_code || '-'}
        </div>
      )
    },
    {
      header: 'الإجراءات',
      accessorKey: '_id',
      cell: ({ row }) => (
        <div className="flex gap-2">
          {row.original.status === 'active' && (
            <>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setExtendModal({ license: row.original, days: 30 })}
              >
                تمديد
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => handleRevoke(row.original)}
              >
                إلغاء
              </Button>
            </>
          )}
          {row.original.status === 'revoked' && (
            <div className="text-xs text-gray-500">
              {row.original.revoked_reason}
            </div>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">إدارة التراخيص</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          عرض وإدارة جميع تراخيص النظام
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">الفلاتر</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              الحالة
            </label>
            <select
              value={filters.active}
              onChange={(e) => setFilters(prev => ({ ...prev, active: e.target.value }))}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">جميع الحالات</option>
              <option value="true">نشط</option>
              <option value="false">غير نشط</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              نوع الترخيص
            </label>
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">جميع الأنواع</option>
              <option value="trial">تجريبي</option>
              <option value="full">كامل</option>
              <option value="custom">مخصص</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              معرف الجهاز
            </label>
            <input
              type="text"
              value={filters.device_id}
              onChange={(e) => setFilters(prev => ({ ...prev, device_id: e.target.value }))}
              placeholder="البحث في معرف الجهاز..."
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Licenses Table */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              التراخيص ({licenses.length})
            </h2>
            <Button
              variant="secondary"
              onClick={() => fixMissingMutation.mutate()}
              isLoading={fixMissingMutation.isPending}
            >
              إصلاح التراخيص المفقودة
            </Button>
          </div>

          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          ) : (
            <Table
              data={licenses}
              columns={columns}
              emptyMessage="لا توجد تراخيص"
            />
          )}
        </div>
      </div>

      {/* Extend License Modal */}
      {extendModal.license && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                تمديد الترخيص
              </h3>
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  الجهاز: {extendModal.license.device_id}
                </p>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  عدد الأيام
                </label>
                <input
                  type="number"
                  min="1"
                  max="3650"
                  value={extendModal.days}
                  onChange={(e) => setExtendModal(prev => ({ ...prev, days: parseInt(e.target.value) || 30 }))}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleExtend}
                  isLoading={extendMutation.isPending}
                >
                  تمديد
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setExtendModal({ license: null, days: 30 })}
                >
                  إلغاء
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 