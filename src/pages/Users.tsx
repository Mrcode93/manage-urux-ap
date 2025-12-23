import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePermissions } from '../hooks/usePermissions';
import { getActivatedDevices } from '../api/client';
import Button from '../components/Button';
import ModernUsersTable from '../components/ModernUsersTable';
import DeviceDetailsModal from '../components/DeviceDetailsModal';
import { RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

interface Device {
  _id: string;
  device_id: string;
  ip: string;
  location: string | { country?: string; city?: string; timezone?: string }; // Can be string or old object format
  location_data: {
    success: boolean;
    coordinates: {
      lat: number;
      lng: number;
    };
    formatted_address: string;
    address_components: {
      neighbourhood?: string;
      city?: string;
      subdistrict?: string;
      district?: string;
      state?: string;
      country?: string;
      country_code?: string;
      postcode?: string;
    };
    source: string;
    city?: string;
    country?: string;
    region?: string;
  } | null;
  activated_at: string;
  activation_code?: string;
  name?: string | null;
  phone?: string | null;
  app?: {
    _id: string;
    name: string;
    icon?: string;
  } | null;
  user?: any;
  license: {
    device_id: string;
    features: string[];
    type: string;
    expires_at?: string;
    issued_at: string;
    signature: string;
    is_active: boolean;
  };
}

interface GroupedDevice {
  device_id: string;
  latest_activation: Device;
  activation_history: Device[];
  total_activations: number;
}

export default function Users() {
  const { canReadCustomers } = usePermissions();
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

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
  const { filteredDevices, totalUsers, totalPages, paginatedDevices } = useMemo(() => {
    // Filter devices based on search term
    const filtered = allDevices.filter(device => {
      if (!searchTerm) return true;
      
      const searchLower = searchTerm.toLowerCase();
      const locationString = typeof device.location === 'string' 
        ? device.location.toLowerCase() 
        : `${device.location?.city || ''} ${device.location?.country || ''}`.toLowerCase();
      
      return device.device_id.toLowerCase().includes(searchLower) ||
        device.ip.includes(searchTerm) ||
        locationString.includes(searchLower) ||
        device.location_data?.city?.toLowerCase().includes(searchLower) ||
        device.location_data?.country?.toLowerCase().includes(searchLower);
    });
    
    // Calculate pagination
    const total = filtered.length;
    const totalPages = Math.ceil(total / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = filtered.slice(startIndex, endIndex);
    
    return {
      filteredDevices: filtered,
      totalUsers: total,
      totalPages: totalPages || 1,
      paginatedDevices: paginated
    };
  }, [allDevices, searchTerm, currentPage, itemsPerPage]);

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

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">إدارة المستخدمين</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            قائمة بجميع الأجهزة المفعلة ومواقعها
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="بحث بمعرف الجهاز، IP، أو الموقع..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
            />
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <Button
            onClick={handleForceRefresh}
            variant="secondary"
            size="sm"
            className="whitespace-nowrap"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            تحديث البيانات
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                  </svg>
                </div>
              </div>
              <div className="mr-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    أجهزة فريدة
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {groupedDevices.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                  <svg className="h-5 w-5 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="mr-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    إجمالي التفعيلات
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {users.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="mr-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    مواقع محددة
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {users.filter(d => d.location_data?.success).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                  <svg className="h-5 w-5 text-indigo-600 dark:text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="mr-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    من OpenStreetMap
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {users.filter(d => d.location_data?.source === 'osm').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Table */}
      <ModernUsersTable
        data={groupedDevices}
        onViewDetails={(device) => {
          setSelectedDevice(device);
          setShowLicenseModal(true);
        }}
        onRefresh={handleForceRefresh}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        loading={loading}
      />

      {/* Pagination Controls */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Items per page selector */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
              عرض:
            </label>
            <select
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
              className="block px-3 py-2 border border-gray-300 rounded-md text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
              من {totalUsers} جهاز
            </span>
          </div>

          {/* Pagination info and buttons */}
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              صفحة {currentPage} من {totalPages}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1 || loading}
                className="flex items-center gap-1"
              >
                <ChevronRight className="h-4 w-4" />
                الأولى
              </Button>
              
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                className="flex items-center gap-1"
              >
                <ChevronRight className="h-4 w-4" />
                السابقة
              </Button>
              
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || loading}
                className="flex items-center gap-1"
              >
                التالية
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages || loading}
                className="flex items-center gap-1"
              >
                الأخيرة
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Device Details Modal */}
      <DeviceDetailsModal
        device={selectedDevice}
        isOpen={showLicenseModal}
        onClose={() => {
          setShowLicenseModal(false);
          setSelectedDevice(null);
        }}
      />
    </div>
  );
}