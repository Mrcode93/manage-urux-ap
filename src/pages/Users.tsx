import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, type Variants } from 'framer-motion';
import { usePermissions } from '../hooks/usePermissions';
import { getActivatedDevices, type GroupedDevice } from '../api/client';
import Button from '../components/Button';
import Skeleton from '../components/Skeleton';
import ModernUsersTable from '../components/ModernUsersTable';
import DeviceDetailsModal from '../components/DeviceDetailsModal';
import {
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Users as UsersIcon,
  Smartphone,
  MapPin,
  Globe,
  Search
} from 'lucide-react';

export default function Users() {
  const { canReadCustomers } = usePermissions();
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [licenseFilter, setLicenseFilter] = useState('all');
  const [appFilter, setAppFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch all devices using React Query (no caching for fresh data)
  const { data: allDevices = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['activated-devices'],
    queryFn: getActivatedDevices,
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Filter and paginate devices client-side
  const { totalUsers, totalPages, paginatedDevices } = useMemo(() => {
    // Filter devices based on all criteria
    const filtered = allDevices.filter(device => {
      // 1. Search Term Filter
      const searchLower = searchTerm.toLowerCase();
      const locationString = typeof device.location === 'string'
        ? device.location.toLowerCase()
        : `${device.location?.city || ''} ${device.location?.country || ''}`.toLowerCase();

      const matchesSearch = !searchTerm ||
        device.device_id.toLowerCase().includes(searchLower) ||
        device.ip.includes(searchTerm) ||
        locationString.includes(searchLower) ||
        device.location_data?.city?.toLowerCase().includes(searchLower) ||
        device.location_data?.country?.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      // 2. License Filter
      if (licenseFilter !== 'all') {
        if (device.license?.type !== licenseFilter) return false;
      }

      // 3. App Filter
      if (appFilter !== 'all') {
        if (device.app?.name !== appFilter) return false;
      }

      // 4. Country Filter
      if (countryFilter !== 'all') {
        const country = device.location_data?.country || (typeof device.location === 'object' ? device.location?.country : '');
        if (country !== countryFilter) return false;
      }

      // 5. Status Filter
      if (statusFilter !== 'all') {
        const expiresAt = device.license?.expires_at;
        const isExpired = expiresAt ? new Date(expiresAt) < new Date() : false;
        if (statusFilter === 'active' && isExpired) return false;
        if (statusFilter === 'expired' && !isExpired) return false;
      }

      return true;
    });

    // Calculate pagination
    const total = filtered.length;
    const totalPages = Math.ceil(total / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = filtered.slice(startIndex, endIndex);

    return {
      totalUsers: total,
      totalPages: totalPages || 1,
      paginatedDevices: paginated
    };
  }, [allDevices, searchTerm, currentPage, itemsPerPage, licenseFilter, appFilter, countryFilter, statusFilter]);

  // Extract unique options for filters
  const filterOptions = useMemo(() => {
    const apps = new Set<string>();
    const countries = new Set<string>();

    allDevices.forEach(d => {
      if (d.app?.name) apps.add(d.app.name);
      const country = d.location_data?.country || (typeof d.location === 'object' ? d.location?.country : '');
      if (country) countries.add(country);
    });

    return {
      apps: Array.from(apps).sort(),
      countries: Array.from(countries).sort(),
      licenseTypes: [
        { id: 'trial', label: 'تجريبي' },
        { id: 'trial-7-days', label: 'تجربة 7 أيام' },
        { id: 'lifetime', label: 'مدى الحياة' },
        { id: 'custom', label: 'مخصص' }
      ] as const
    };
  }, [allDevices]);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  } as const;

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    }
  } as const;

  // Use paginated devices for grouping
  const users = paginatedDevices;

  // Group devices by device_id
  const groupedDevices: GroupedDevice[] = users.reduce((acc, device) => {
    const existing = acc.find(group => group.device_id === device.device_id);

    if (existing) {
      existing.activation_history.push(device);
      existing.total_activations++;

      // Update latest activation if this one is newer
      if (new Date(device.activated_at) > new Date(existing.latest_activation.activated_at)) {
        existing.latest_activation = device;
      }
    } else {
      acc.push({
        device_id: device.device_id,
        latest_activation: device,
        activation_history: [device],
        total_activations: 1
      });
    }

    return acc;
  }, [] as GroupedDevice[]);

  // Sort activation history by date (newest first)
  groupedDevices.forEach(group => {
    group.activation_history.sort((a, b) =>
      new Date(b.activated_at).getTime() - new Date(a.activated_at).getTime()
    );
  });

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleForceRefresh = () => {
    refetch(); // Refetch data using React Query
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };



  // STRICT PERMISSION CHECK - Prevent unauthorized access
  if (!canReadCustomers()) {
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
                <p>ليس لديك صلاحية لقراءة بيانات العملاء. مطلوب صلاحية: <strong>customers:read</strong></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="space-y-8 p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="space-y-2">
            <Skeleton width={250} height={32} />
            <Skeleton width={300} height={20} />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Skeleton width={240} height={40} variant="rectangular" />
            <Skeleton width={120} height={40} variant="rectangular" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} height={110} variant="rectangular" />
          ))}
        </div>

        <div className="space-y-4">
          <Skeleton height={500} variant="rectangular" className="rounded-2xl" />
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
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300">
            إدارة مستخدمين النظام
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">
            مراقبة التفعيلات، الأجهزة المتصلة وتتبع المواقع الجغرافية بشكل حي ومباشر
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="relative group flex-1 sm:w-72">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="بحث بالجهاز، الـ IP أو الموقع..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pr-12 pl-4 py-3.5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all dark:text-white font-bold shadow-sm"
            />
          </div>
          <Button
            onClick={handleForceRefresh}
            variant="secondary"
            className="px-6 py-3.5 rounded-2xl flex items-center justify-center gap-2 font-black shadow-lg shadow-slate-100 dark:shadow-none border-slate-200 dark:border-slate-800"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            تحديث البيانات
          </Button>
        </div>
      </header>

      {/* Enhanced Filters Section */}
      <motion.div
        variants={itemVariants}
        className="glass-card p-6 border border-white/20 dark:border-white/10 bg-white/5 backdrop-blur-xl flex flex-wrap items-center gap-4"
      >
        <div className="flex items-center gap-2 mr-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Search className="w-4 h-4" />
          </div>
          <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">التصفية المتقدمة</span>
        </div>

        {/* License Filter */}
        <div className="flex flex-col gap-1.5 min-w-[140px]">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">نوع الرخصة</span>
          <select
            value={licenseFilter}
            onChange={(e) => setLicenseFilter(e.target.value)}
            className="bg-white/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">الكل</option>
            {filterOptions.licenseTypes.map(type => (
              <option key={type.id} value={type.id}>{type.label}</option>
            ))}
          </select>
        </div>

        {/* App Filter */}
        <div className="flex flex-col gap-1.5 min-w-[140px]">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">التطبيق</span>
          <select
            value={appFilter}
            onChange={(e) => setAppFilter(e.target.value)}
            className="bg-white/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">الكل</option>
            {filterOptions.apps.map(app => (
              <option key={app} value={app}>{app}</option>
            ))}
          </select>
        </div>

        {/* Country Filter */}
        <div className="flex flex-col gap-1.5 min-w-[140px]">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">الدولة</span>
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="bg-white/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">الكل</option>
            {filterOptions.countries.map(country => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex flex-col gap-1.5 min-w-[140px]">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">الحالة</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">الكل</option>
            <option value="active">نشط</option>
            <option value="expired">منتهي</option>
          </select>
        </div>

        {/* Reset Button */}
        <div className="flex flex-col gap-1.5 pt-5">
          <button
            onClick={() => {
              setLicenseFilter('all');
              setAppFilter('all');
              setCountryFilter('all');
              setStatusFilter('all');
              setSearchTerm('');
            }}
            className="px-4 py-2 text-xs font-black text-blue-500 hover:text-blue-600 bg-blue-500/5 hover:bg-blue-500/10 rounded-xl transition-all"
          >
            إعادة تعيين
          </button>
        </div>
      </motion.div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'أجهزة فريدة', value: groupedDevices.length, icon: Smartphone, color: 'blue', sub: 'إجمالي الأجهزة المكتشفة' },
          { label: 'إجمالي التفعيلات', value: users.length, icon: UsersIcon, color: 'purple', sub: 'كافة عمليات التفعيل' },
          { label: 'مواقع محددة', value: users.filter(d => d.location_data?.success).length, icon: MapPin, color: 'emerald', sub: 'تتبع جغرافي ناجح' },
          { label: 'عبر OSM', value: users.filter(d => d.location_data?.source === 'osm').length, icon: Globe, color: 'indigo', sub: 'استخدام خرائط OSM' },
          {
            label: 'الأجهزة المتصلة',
            value: allDevices.length,
            color: 'blue',
            icon: Smartphone,
            sub: 'نشطة حالياً بالنظام'
          }
        ].map((stat, i) => (
          <motion.div
            key={i}
            variants={itemVariants}
            className="glass-card p-5 border border-white/20 dark:border-white/10 flex flex-col items-center justify-center text-center group hover:-translate-y-1 transition-all duration-300"
          >
            <div className={`h-12 w-12 bg-${stat.color}-100 dark:bg-${stat.color}-900/30 rounded-xl flex items-center justify-center text-${stat.color}-600 dark:text-${stat.color}-400 mb-3 border border-${stat.color}-200/50 dark:border-${stat.color}-800/50 group-hover:scale-110 transition-transform`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-widest leading-none">{stat.label}</p>
            <p className="text-xl font-black text-slate-900 dark:text-white leading-none">
              {stat.value}
            </p>
            <p className="text-[10px] font-bold text-slate-400 mt-2">{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Main Table Container */}
      <motion.div variants={itemVariants} className="space-y-6">
        <div className="overflow-hidden">
          <ModernUsersTable
            data={groupedDevices}
            onViewDetails={(device) => {
              setSelectedDevice(device);
              setShowLicenseModal(true);
            }}
            loading={loading}
          />

          {/* Pagination Controls */}
          <div className="p-6 bg-slate-50/50 dark:bg-white/5 border-t border-slate-100 dark:border-white/5 backdrop-blur-md rounded-2xl mt-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-500 dark:text-slate-400">عرض صف:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-sm font-bold dark:text-white focus:ring-2 focus:ring-blue-500/20"
                  >
                    {[20, 50, 100].map(val => (
                      <option key={val} value={val}>{val}</option>
                    ))}
                  </select>
                </div>
                <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700 mx-2" />
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                  إجمالي <span className="text-blue-600 dark:text-blue-400 font-black">{totalUsers}</span> مستخدم
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold text-slate-500 dark:text-slate-400">صفحة</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">{currentPage}</span>
                  <span className="text-sm font-bold text-slate-500 dark:text-slate-400">من</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">{totalPages}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                    className="h-10 w-10 p-0 rounded-xl flex items-center justify-center disabled:opacity-30"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || loading}
                    className="h-10 w-10 p-0 rounded-xl flex items-center justify-center disabled:opacity-30"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Device Details Modal */}
      <DeviceDetailsModal
        device={selectedDevice}
        isOpen={showLicenseModal}
        onClose={() => {
          setShowLicenseModal(false);
          setSelectedDevice(null);
        }}
      />
    </motion.div>
  );
}