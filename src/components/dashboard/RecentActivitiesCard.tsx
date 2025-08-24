import { 
  DevicePhoneMobileIcon,
  MapPinIcon,
  CalendarIcon 
} from '@heroicons/react/24/outline';
import { getLocationDisplay, isUnknownLocation } from '../../utils/ipGeolocation';

interface RecentActivitiesCardProps {
  devices: any[];
  isLoading: boolean;
}

const parseLocationData = (locationField?: string) => {
  if (!locationField) return null;
  
  try {
    if (locationField.startsWith('{') && locationField.endsWith('}')) {
      return JSON.parse(locationField);
    }
    return { city: locationField };
  } catch (error) {
    return { city: locationField };
  }
};

// Helper function to get best location display
const getLocationDisplayForDevice = (device: any) => {
  const cityData = parseLocationData(device.location?.city);
  const countryData = parseLocationData(device.location?.country);
  
  const locationData = cityData || countryData || {};
  
  // Check if stored location is unknown
  const isStoredUnknown = isUnknownLocation({
    city: locationData.city || device.location?.city,
    country: locationData.country || device.location?.country
  });
  
  if (isStoredUnknown) {
    return 'غير محدد - جاري التحديث';
  }
  
  if (locationData.city && locationData.country) {
    return `${locationData.city}, ${locationData.country}`;
  } else if (locationData.country) {
    return locationData.country;
  } else if (locationData.city) {
    return locationData.city;
  }
  
  return device.location?.country || device.location?.city || 'غير محدد';
};

export default function RecentActivitiesCard({ devices, isLoading }: RecentActivitiesCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Get recent activations (last 7 days)
  const recentDevices = devices
    .filter(device => {
      const activationDate = new Date(device.activated_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return activationDate > weekAgo;
    })
    .sort((a, b) => new Date(b.activated_at).getTime() - new Date(a.activated_at).getTime())
    .slice(0, 5);

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            النشاطات الحديثة
          </h3>
          <CalendarIcon className="h-6 w-6 text-gray-400" />
        </div>

        <div className="space-y-4">
          {recentDevices.length === 0 ? (
            <div className="text-center py-8">
              <DevicePhoneMobileIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                لا توجد تفعيلات حديثة
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                خلال الأسبوع الماضي
              </p>
            </div>
          ) : (
            recentDevices.map((device, index) => (
              <div key={device._id} className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <DevicePhoneMobileIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="flex-1 min-w-0 space-x-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      تفعيل جهاز جديد
                    </p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      device.license.type === 'trial' 
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : device.license.type === 'full'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    }`}>
                      {device.license.type === 'trial' ? 'تجريبي' : 
                       device.license.type === 'full' ? 'كامل' : 
                       device.license.type === 'premium' ? 'مميز' :
                       device.license.type === 'enterprise' ? 'مؤسسي' :
                       device.license.type === 'custom' ? 'مخصص' : device.license.type}
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-mono">
                    معرف الجهاز: {device.device_id.substring(0, 16)}...
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                    <div className="flex items-center">
                      <MapPinIcon className="h-3 w-3 ml-1" />
                      {getLocationDisplayForDevice(device)}
                    </div>
                    <div>
                      {new Date(device.activated_at).toLocaleDateString('ar-IQ')} - {new Date(device.activated_at).toLocaleTimeString('ar-IQ', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mt-2">
                    {device.license.features?.slice(0, 2).map((feature: string, idx: number) => (
                      <span 
                        key={idx}
                        className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded text-xs"
                      >
                        {feature}
                      </span>
                    ))}
                    {device.license.features?.length > 2 && (
                      <span className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded text-xs">
                        +{device.license.features.length - 2} ميزة أخرى
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {recentDevices.length > 0 && (
          <div className="border-t dark:border-gray-700 pt-4 mt-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              عرض آخر {recentDevices.length} تفعيلات من أصل {devices.length} جهاز
            </p>
          </div>
        )}
      </div>
    </div>
  );
}