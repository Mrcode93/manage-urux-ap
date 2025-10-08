import React from 'react';
import { X, MapPin, Globe, Clock, Monitor, Calendar, Wifi, Shield, FileText, Download, Timer, AlertTriangle } from 'lucide-react';
import Button from './Button';

interface Device {
  _id: string;
  device_id: string;
  ip: string;
  location: string | any;
  location_data?: any;
  activated_at: string;
  user?: any;
  license?: {
    device_id: string;
    features: string[];
    type: string;
    expires_at?: string;
    issued_at: string;
    signature: string;
    is_active: boolean;
  };
}

interface DeviceDetailsModalProps {
  device: Device | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function DeviceDetailsModal({ device, isOpen, onClose }: DeviceDetailsModalProps) {
  if (!isOpen || !device) return null;

  const renderLocation = () => {
    const locationData = device.location_data;
    
    if (locationData && locationData.success) {
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-500" />
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              {locationData.city || 'غير محدد'}
            </span>
          </div>
          {locationData.country && (
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-green-500" />
              <span className="text-gray-700 dark:text-gray-300">
                {locationData.country}
              </span>
            </div>
          )}
          {locationData.region && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {locationData.region}
            </div>
          )}
          {locationData.formatted_address && (
            <div className="text-sm text-gray-500 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 p-2 rounded">
              {locationData.formatted_address}
            </div>
          )}
          <div className="text-xs text-gray-400 dark:text-gray-500 font-mono">
            {locationData.coordinates?.lat?.toFixed(6) || '0'}, {locationData.coordinates?.lng?.toFixed(6) || '0'}
          </div>
        </div>
      );
    }

    if (typeof device.location === 'object' && device.location !== null) {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-500" />
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              {device.location.city || 'غير محدد'}
            </span>
          </div>
          {device.location.country && (
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-green-500" />
              <span className="text-gray-700 dark:text-gray-300">
                {device.location.country}
              </span>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          <span>إحداثيات: {device.location as string}</span>
        </div>
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('ar-IQ'),
      time: date.toLocaleTimeString('ar-IQ'),
      full: date.toLocaleString('ar-IQ')
    };
  };

  const renderLicenseType = () => {
    const licenseType = device.license?.type;
    
    if (!licenseType) {
      return (
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-500 dark:text-gray-400">غير محدد</span>
        </div>
      );
    }

    const isTrial7Days = licenseType === 'trial-7-days';
    const isTrial = licenseType === 'trial';
    const isLifetime = licenseType === 'lifetime';
    const isCustom = licenseType === 'custom' || licenseType === 'custom-lifetime';

    let badgeClass = '';
    let icon = Shield;
    let text = licenseType;

    if (isTrial7Days) {
      badgeClass = 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-200 dark:border-orange-700';
      icon = Timer;
      text = 'تجربة 7 أيام';
    } else if (isTrial) {
      badgeClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200 dark:border-yellow-700';
      icon = Timer;
      text = 'تجربة';
    } else if (isLifetime) {
      badgeClass = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-700';
      icon = Shield;
      text = 'مدى الحياة';
    } else if (isCustom) {
      badgeClass = 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-700';
      icon = Shield;
      text = 'مخصص';
    } else {
      badgeClass = 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 border-gray-200 dark:border-gray-700';
      icon = Shield;
      text = licenseType;
    }

    const IconComponent = icon;

    return (
      <div className="flex items-center gap-2">
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${badgeClass}`}>
          <IconComponent className="h-4 w-4" />
          <span>{text}</span>
        </div>
        {isTrial7Days && (
          <div className="flex items-center gap-1 text-sm text-orange-600 dark:text-orange-400 font-medium">
            <AlertTriangle className="h-4 w-4" />
            <span>تجربة محدودة</span>
          </div>
        )}
      </div>
    );
  };

  const activationDate = formatDate(device.activated_at);
  const licenseIssuedDate = device.license ? formatDate(device.license.issued_at) : null;
  const licenseExpiryDate = device.license?.expires_at ? formatDate(device.license.expires_at) : null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-900 rounded-lg text-right overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <Monitor className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    تفاصيل الجهاز
                  </h3>
                  <p className="text-blue-100 text-sm">
                    معلومات مفصلة عن الجهاز والتفعيل
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-blue-100 transition-colors duration-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-6">
            {/* Device Information */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                معلومات الجهاز
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">معرف الجهاز:</span>
                  </div>
                  <div className="text-sm font-mono bg-gray-50 dark:bg-gray-800 p-2 rounded text-gray-900 dark:text-white break-all">
                    {device.device_id}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Wifi className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">عنوان IP:</span>
                  </div>
                  <div className="text-sm font-mono bg-gray-50 dark:bg-gray-800 p-2 rounded text-gray-900 dark:text-white">
                    {device.ip}
                  </div>
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                معلومات الموقع
              </h4>
              {renderLocation()}
            </div>

            {/* Activation Information */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                معلومات التفعيل
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">تاريخ التفعيل:</span>
                  </div>
                  <div className="text-sm text-gray-900 dark:text-white">
                    {activationDate.date}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {activationDate.time}
                  </div>
                </div>

                {device.license && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">نوع الرخصة:</span>
                    </div>
                    <div>
                      {renderLicenseType()}
                    </div>
                  </div>
                )}
              </div>

              {device.license && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">تاريخ الإصدار:</span>
                    </div>
                    <div className="text-sm text-gray-900 dark:text-white">
                      {licenseIssuedDate?.date}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">تاريخ الانتهاء:</span>
                    </div>
                    <div className="text-sm text-gray-900 dark:text-white">
                      {licenseExpiryDate ? licenseExpiryDate.date : 'غير محدد (دائمة)'}
                    </div>
                  </div>
                </div>
              )}

              {device.license?.features && device.license.features.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    الميزات المفعلة:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {device.license.features.map((feature, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Trial 7 Days Warning */}
              {device.license?.type === 'trial-7-days' && (
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-orange-800 dark:text-orange-200">
                        تجربة محدودة - 7 أيام
                      </h4>
                      <div className="mt-2 text-sm text-orange-700 dark:text-orange-300">
                        <p>هذا المستخدم يستخدم تجربة مجانية محدودة لمدة 7 أيام.</p>
                        {device.license.expires_at && (
                          <p className="mt-1">
                            تنتهي التجربة في: <strong>{licenseExpiryDate?.date}</strong>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 flex justify-end gap-3">
            <Button
              onClick={onClose}
              variant="secondary"
              size="sm"
            >
              إغلاق
            </Button>
            {device.license && (
              <Button
                onClick={() => {
                  // TODO: Implement license download functionality
                  console.log('Download license for device:', device.device_id);
                }}
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                تحميل الرخصة
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
