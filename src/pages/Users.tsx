import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { 
  fetchUsers, 
  removeUser, 
  updateLocationCache, 
  setSearchTerm as setReduxSearchTerm, 
  setCurrentPage, 
  clearError 
} from '../store/slices/usersSlice';
import { usePermissions } from '../hooks/usePermissions';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getActivatedDevices, getLicense, revokeLicense, extendLicense } from '../api/client';
import Table, { type Column } from '../components/Table';
import Button from '../components/Button';
import ModernUsersTable from '../components/ModernUsersTable';
import DeviceDetailsModal from '../components/DeviceDetailsModal';
import { toast } from 'react-hot-toast';
import { Globe, MapPin, Wifi, Clock, RefreshCw } from 'lucide-react';

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
  const dispatch = useAppDispatch();
  const { canReadCustomers } = usePermissions();
  const { 
    users, 
    loading, 
    error, 
    totalUsers, 
    currentPage, 
    totalPages, 
    searchTerm, 
    locationCache 
  } = useAppSelector(state => state.users);

  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [extendDays, setExtendDays] = useState(30);

  const queryClient = useQueryClient();

  // Use Redux for users data instead of React Query
  useEffect(() => {
    dispatch(fetchUsers({ page: currentPage, search: searchTerm }));
  }, [dispatch, currentPage, searchTerm]);

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
    dispatch(setReduxSearchTerm(value));
    dispatch(setCurrentPage(1)); // Reset to first page when searching
  };

  const handlePageChange = (page: number) => {
    dispatch(setCurrentPage(page));
  };

  const handleForceRefresh = () => {
    // Force refresh by dispatching fetchUsers again
    dispatch(fetchUsers({ page: currentPage, search: searchTerm }));
  };

  const toggleRowExpansion = (deviceId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(deviceId)) {
      newExpanded.delete(deviceId);
    } else {
      newExpanded.add(deviceId);
    }
    setExpandedRows(newExpanded);
  };

  const columns: Column<GroupedDevice>[] = [
    {
      header: 'معرف الجهاز',
      accessorKey: 'device_id',
      cell: ({ row }) => {
        const group = row.original;
        const hasMultipleActivations = group.total_activations > 1;
        
        return (
          <div className="flex items-center gap-2">
            {hasMultipleActivations && (
              <button
                onClick={() => toggleRowExpansion(group.device_id)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg 
                  className={`w-4 h-4 transition-transform ${
                    expandedRows.has(group.device_id) ? 'rotate-90' : ''
                  }`} 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            )}
            <div>
              <span className="font-mono text-sm text-gray-600 dark:text-gray-300">
                {group.device_id}
              </span>
              {hasMultipleActivations && (
                <div className="text-xs text-blue-600 dark:text-blue-400">
                  {group.total_activations} تفعيلات
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      header: 'عنوان IP',
      accessorKey: 'latest_activation',
      cell: ({ row }) => (
        <span className="font-mono text-sm text-gray-600 dark:text-gray-300">
          {row.original.latest_activation.ip}
        </span>
      ),
    },
    {
      header: 'الموقع',
      accessorKey: 'location',
      cell: ({ row }) => {
        const device = row.original.latest_activation;
        const locationData = device.location_data;
        
        // Debug logging
        console.log('Device location data:', {
          device_id: device.device_id,
          location: device.location,
          location_data: locationData,
          has_location_data: !!locationData,
          location_data_success: locationData?.success
        });
        
        // Handle new location format with location_data (highest priority)
        if (locationData && locationData.success) {
          const data = locationData; // TypeScript now knows this is not null
          return (
            <div className="space-y-2">
              {/* Main location info */}
              <div className="space-y-1">
                {data.city && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {data.city}
                    </span>
                  </div>
                )}
                
                {data.country && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {data.country}
                    </span>
                  </div>
                )}
                
                {data.region && (
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {data.region}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Full address */}
              {data.formatted_address && (
                <div className="text-xs text-gray-500 dark:text-gray-400 break-words">
                  {data.formatted_address}
                </div>
              )}
              
              {/* Coordinates */}
              <div className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                {data.coordinates?.lat?.toFixed(6) || '0'}, {data.coordinates?.lng?.toFixed(6) || '0'}
              </div>
              
              {/* Source indicator */}
              <div className="text-xs text-gray-400 dark:text-gray-500">
                المصدر: {data.source === 'osm' ? 'OpenStreetMap' : data.source}
              </div>
            </div>
          );
        }
        
        // Handle old location format (object)
        if (typeof device.location === 'object' && device.location !== null) {
          const oldLocation = device.location as { country?: string; city?: string; timezone?: string };
          return (
            <div className="space-y-2">
              <div className="space-y-1">
                {oldLocation.city && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {oldLocation.city}
                    </span>
                  </div>
                )}
                
                {oldLocation.country && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {oldLocation.country}
                    </span>
                  </div>
                )}
                
                {oldLocation.timezone && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-purple-600" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {oldLocation.timezone}
                    </span>
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500">
                المصدر: البيانات القديمة
              </div>
            </div>
          );
        }
        
        // Handle coordinates only (no detailed data)
        return (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <div>إحداثيات: {device.location as string}</div>
            <div className="text-xs text-red-500">لا توجد بيانات موقع مفصلة</div>
          </div>
        );
        
        return (
          <div className="space-y-2">
            {/* Main location info */}
            <div className="space-y-1">
              {locationData.city && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {locationData.city}
                  </span>
                </div>
              )}
              
              {locationData.country && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {locationData.country}
                  </span>
                </div>
              )}
              
              {locationData.region && (
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {locationData.region}
                  </span>
                </div>
              )}
            </div>
            
            {/* Full address */}
            {locationData.formatted_address && (
              <div className="text-xs text-gray-500 dark:text-gray-400 break-words">
                {locationData.formatted_address}
              </div>
            )}
            
            {/* Coordinates */}
            <div className="text-xs text-gray-400 dark:text-gray-500 font-mono">
              {locationData.coordinates.lat.toFixed(6)}, {locationData.coordinates.lng.toFixed(6)}
            </div>
            
            {/* Source indicator */}
            <div className="text-xs text-gray-400 dark:text-gray-500">
              المصدر: {locationData.source === 'osm' ? 'OpenStreetMap' : locationData.source}
            </div>
          </div>
        );
      }
    },
    {
      header: 'آخر تفعيل',
      accessorKey: 'latest_activation',
      cell: ({ row }) => (
        <span className="text-gray-700 dark:text-gray-200">
          {new Date(row.original.latest_activation.activated_at).toLocaleDateString('ar-IQ')}
        </span>
      ),
    },
    {
      header: 'الإجراءات',
      accessorKey: 'device_id',
      cell: ({ row }) => {
        const device = row.original.latest_activation;
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setSelectedDevice(device);
                setShowLicenseModal(true);
              }}
            >
              عرض التفاصيل
            </Button>
          </div>
        );
      },
    },
  ];



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