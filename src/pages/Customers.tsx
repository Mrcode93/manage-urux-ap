import React, { useState, useEffect } from 'react';
import Table from '../components/Table';
import Button from '../components/Button';
import { getAllUsers, type User } from '../api/client';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Edit,
  MapPin,
  Globe,
  RefreshCw,
  Clock,
  Wifi
} from 'lucide-react';

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentLocation, setCurrentLocation] = useState<{
    country: string;
    city: string;
    region: string;
    ip: string;
    timezone: string;
    isp: string;
    coordinates: string;
  } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [customerLocations, setCustomerLocations] = useState<{[key: string]: {
    country: string;
    city: string;
    region: string;
    timezone: string;
    isp: string;
    ip: string;
    loading: boolean;
  }>({});

  useEffect(() => {
    fetchCustomers();
    getCurrentLocation();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllUsers();
      setCustomers(data);
    } catch (err: any) {
      console.error('Error fetching customers:', err);
      setError(err.message || 'فشل في جلب بيانات العملاء');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      // Get current IP and location using multiple services for accuracy
      let locationData = null;
      let currentIP = null;
      
      // First try: ipapi.co (most comprehensive)
      try {
        const response1 = await fetch('https://ipapi.co/json/');
        if (response1.ok) {
          locationData = await response1.json();
          currentIP = locationData.ip;
        }
      } catch (error) {
        
      }
      
      // Second try: ip-api.com if first failed
      if (!locationData || locationData.error) {
        try {
          const response2 = await fetch('http://ip-api.com/json/');
          if (response2.ok) {
            const data2 = await response2.json();
            if (data2.status === 'success') {
              locationData = {
                ip: data2.query,
                country: data2.country,
                city: data2.city,
                region: data2.regionName,
                timezone: data2.timezone,
                isp: data2.isp,
                lat: data2.lat,
                lon: data2.lon
              };
              currentIP = data2.query;
            }
          }
        } catch (error) {
          
        }
      }
      
      // Third try: ipinfo.io
      if (!locationData || locationData.error) {
        try {
          const response3 = await fetch('https://ipinfo.io/json');
          if (response3.ok) {
            const data3 = await response3.json();
            currentIP = data3.ip;
            locationData = {
              ip: data3.ip,
              country: data3.country,
              city: data3.city,
              region: data3.region,
              timezone: data3.timezone,
              org: data3.org
            };
          }
        } catch (error) {
          
        }
      }
      
      
      
      setCurrentLocation({
        country: locationData?.country || locationData?.country || 'غير محدد',
        city: locationData?.city || 'غير محدد',
        region: locationData?.region || '',
        ip: currentIP || locationData?.ip || 'غير محدد',
        timezone: locationData?.timezone || 'غير محدد',
        isp: locationData?.isp || locationData?.org || '',
        coordinates: locationData?.lat && locationData?.lon ? 
          `${locationData.lat}, ${locationData.lon}` : ''
      });
    } catch (error) {
      console.error('Error fetching current location:', error);
      setCurrentLocation({
        country: 'غير محدد',
        city: 'غير محدد',
        region: '',
        ip: 'غير محدد',
        timezone: 'غير محدد',
        isp: '',
        coordinates: ''
      });
    } finally {
      setLocationLoading(false);
    }
  };

  const getCustomerLocation = async (customerId: string, ip?: string) => {
    if (!ip) return;
    
    setCustomerLocations(prev => ({
      ...prev,
      [customerId]: { ...prev[customerId], loading: true }
    }));

    try {
      // Try multiple IP geolocation services for better accuracy
      let locationData = null;
      
      // First try: ipapi.co (most accurate)
      try {
        const response1 = await fetch(`https://ipapi.co/${ip}/json/`);
        if (response1.ok) {
          locationData = await response1.json();
        }
      } catch (error) {
        
      }
      
      // Second try: ip-api.com (free backup)
      if (!locationData || locationData.error) {
        try {
          const response2 = await fetch(`http://ip-api.com/json/${ip}`);
          if (response2.ok) {
            const data2 = await response2.json();
            if (data2.status === 'success') {
              locationData = {
                country_name: data2.country,
                city: data2.city,
                region: data2.regionName,
                timezone: data2.timezone,
                isp: data2.isp
              };
            }
          }
        } catch (error) {
          
        }
      }
      
      // Third try: ipinfo.io (requires token but has free tier)
      if (!locationData || locationData.error) {
        try {
          const response3 = await fetch(`https://ipinfo.io/${ip}/json`);
          if (response3.ok) {
            const data3 = await response3.json();
            const [city, region] = (data3.city || '').split(',');
            locationData = {
              country_name: data3.country,
              city: city?.trim() || data3.city,
              region: region?.trim() || data3.region,
              timezone: data3.timezone
            };
          }
        } catch (error) {
          
        }
      }
      
      setCustomerLocations(prev => ({
        ...prev,
        [customerId]: {
          country: locationData?.country_name || locationData?.country || 'غير محدد',
          city: locationData?.city || 'غير محدد',
          region: locationData?.region || '',
          timezone: locationData?.timezone || 'غير محدد',
          isp: locationData?.isp || '',
          ip: ip,
          loading: false
        }
      }));
    } catch (error) {
      console.error('Error fetching customer location:', error);
      setCustomerLocations(prev => ({
        ...prev,
        [customerId]: {
          country: 'غير محدد',
          city: 'غير محدد',
          region: '',
          timezone: 'غير محدد',
          isp: '',
          ip: ip,
          loading: false
        }
      }));
    }
  };

  const columns = [
    {
      header: 'اسم المستخدم',
      accessorKey: 'username',
      cell: ({ row }: { row: { original: User } }) => {
        const customer = row.original;
        return (
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-sm">
              <div className="font-medium text-gray-900 dark:text-white">{customer.username || 'غير محدد'}</div>
              <div className="text-gray-500 dark:text-gray-400 font-mono text-xs">{customer._id}</div>
            </div>
          </div>
        );
      }
    },
    {
      header: 'معرف الجهاز',
      accessorKey: 'device_id',
      cell: ({ row }: { row: { original: User } }) => {
        const customer = row.original;
        return (
          <div className="space-y-1">
            <div className="font-mono text-sm text-gray-900 dark:text-white">
              {customer.device_id ? (
                customer.device_id.length > 20 ? 
                  `${customer.device_id.substring(0, 20)}...` : 
                  customer.device_id
              ) : 'غير متوفر'}
            </div>
            {customer.device_id && (
              <button
                onClick={() => navigator.clipboard.writeText(customer.device_id)}
                className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
              >
                نسخ
              </button>
            )}
          </div>
        );
      }
    },
    {
      header: 'تاريخ الإنشاء',
      accessorKey: 'created_at',
      cell: ({ row }: { row: { original: User } }) => {
        const customer = row.original;
        return (
          <div className="text-sm text-gray-900 dark:text-white">
            {customer.created_at ? 
              new Date(customer.created_at).toLocaleDateString('ar-EG') : 
              'غير متوفر'
            }
          </div>
        );
      }
    },
    {
      header: 'الموقع الحالي',
      accessorKey: 'currentLocation',
      cell: ({ row }: { row: { original: User } }) => {
        return (
          <div className="space-y-2">
            {currentLocation ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-gray-900 dark:text-white text-sm">{currentLocation.country}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {currentLocation.city}{currentLocation.region ? `, ${currentLocation.region}` : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Wifi className="h-4 w-4 text-purple-600" />
                  <span className="font-mono text-xs text-gray-500 dark:text-gray-400">{currentLocation.ip}</span>
                </div>
                {currentLocation.timezone && currentLocation.timezone !== 'غير محدد' && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-600" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">{currentLocation.timezone}</span>
                  </div>
                )}
                {currentLocation.isp && (
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    ISP: {currentLocation.isp}
                  </div>
                )}
              </div>
            ) : locationLoading ? (
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-sm text-gray-600 dark:text-gray-400">جاري التحديد...</span>
              </div>
            ) : (
              <button
                onClick={getCurrentLocation}
                className="bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
              >
                <MapPin className="h-4 w-4" />
                تحديد الموقع الحالي
              </button>
            )}
          </div>
        );
      }
    },
    {
      header: 'الموقع',
      accessorKey: 'location',
      cell: ({ row }: { row: { original: User } }) => {
        const customer = row.original;
        const location = customerLocations[customer._id];
        
        return (
          <div className="space-y-2">
            {location ? (
              location.loading ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">جاري التحديد...</span>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-gray-900 dark:text-white">{location.country}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {location.city}{location.region ? `, ${location.region}` : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wifi className="h-4 w-4 text-purple-600" />
                    <span className="font-mono text-xs text-gray-500 dark:text-gray-400">{location.ip}</span>
                  </div>
                  {location.timezone && location.timezone !== 'غير محدد' && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-600" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">{location.timezone}</span>
                    </div>
                  )}
                  {location.isp && (
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      ISP: {location.isp}
                    </div>
                  )}
                </div>
              )
            ) : (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    // Use a sample IP for testing since device_id might not be a valid IP
                    const ipToUse = customer.device_id && customer.device_id.includes('.') 
                      ? customer.device_id 
                      : '8.8.8.8'; // Use Google DNS as fallback for testing
                    getCustomerLocation(customer._id, ipToUse);
                  }}
                  className="bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
                >
                  <MapPin className="h-4 w-4" />
                  تحديد الموقع
                </button>
                {customer.device_id && (
                  <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                    {customer.device_id.includes('.') ? 'IP: ' : 'Device: '}{customer.device_id}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      }
    },
    {
      header: 'الإجراءات',
      accessorKey: 'actions',
      cell: ({ row }: { row: { original: User } }) => {
        const customer = row.original;
        return (
          <div className="flex gap-2">
            <Button variant="primary" size="sm" className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              تعديل
            </Button>
            <Button variant="danger" size="sm" className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              حذف
            </Button>
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header with Current Location */}
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">العملاء</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            إدارة جميع عملاء النظام ومعلوماتهم
          </p>
        </div>
        
        {/* Current Location Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700 min-w-72">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              الموقع الحالي
            </h3>
            <button
              onClick={getCurrentLocation}
              disabled={locationLoading}
              className="bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 p-2 rounded-lg transition-colors disabled:opacity-50"
              title="تحديث الموقع"
            >
              <RefreshCw className={`h-4 w-4 ${locationLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          {locationLoading ? (
            <div className="text-center py-4">
              <RefreshCw className="h-6 w-6 text-blue-600 animate-spin mx-auto mb-2" />
              <div className="text-sm text-gray-600 dark:text-gray-400">جاري تحديد الموقع...</div>
            </div>
          ) : currentLocation ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-green-600" />
                <span className="text-sm text-gray-600 dark:text-gray-400">الدولة:</span>
                <span className="font-medium text-gray-900 dark:text-white">{currentLocation.country}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-gray-600 dark:text-gray-400">المدينة:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {currentLocation.city}{currentLocation.region ? `, ${currentLocation.region}` : ''}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4 text-purple-600" />
                <span className="text-sm text-gray-600 dark:text-gray-400">عنوان IP الحالي:</span>
                <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">{currentLocation.ip}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <span className="text-sm text-gray-600 dark:text-gray-400">المنطقة الزمنية:</span>
                <span className="font-medium text-gray-900 dark:text-white">{currentLocation.timezone}</span>
              </div>
              {currentLocation.isp && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-indigo-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">مزود الخدمة:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{currentLocation.isp}</span>
                </div>
              )}
              {currentLocation.coordinates && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">الإحداثيات:</span>
                  <span className="font-mono text-xs text-gray-500 dark:text-gray-400">{currentLocation.coordinates}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-red-600 dark:text-red-400">
              فشل في تحديد الموقع
            </div>
          )}
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="البحث عن العملاء..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <Button variant="secondary" className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          تصفية
        </Button>
        <Button variant="secondary" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          تصدير
        </Button>
        <Button variant="primary" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          إضافة عميل
        </Button>
      </div>

      {/* Customers Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <Table
          data={customers}
          columns={columns}
          loading={loading}
          error={error}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
      </div>
    </div>
  );
};

export default Customers;