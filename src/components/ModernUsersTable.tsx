import React, { useState } from 'react';
import { ChevronDown, ChevronRight, MapPin, Globe, Clock, Monitor, Calendar, Eye, Search, Filter, RefreshCw } from 'lucide-react';
import Button from './Button';

interface Device {
  _id: string;
  device_id: string;
  ip: string;
  location: string | any;
  location_data?: any;
  activated_at: string;
  user?: any;
}

interface GroupedDevice {
  device_id: string;
  latest_activation: Device;
  activation_history: Device[];
  total_activations: number;
}

interface ModernUsersTableProps {
  data: GroupedDevice[];
  onViewDetails: (device: Device) => void;
  onRefresh: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  loading?: boolean;
}

export default function ModernUsersTable({
  data,
  onViewDetails,
  onRefresh,
  searchTerm,
  onSearchChange,
  loading = false
}: ModernUsersTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'device_id' | 'latest_activation' | 'total_activations'>('latest_activation');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const toggleExpanded = (deviceId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(deviceId)) {
      newExpanded.delete(deviceId);
    } else {
      newExpanded.add(deviceId);
    }
    setExpandedRows(newExpanded);
  };

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case 'device_id':
        aValue = a.device_id;
        bValue = b.device_id;
        break;
      case 'latest_activation':
        aValue = new Date(a.latest_activation.activated_at);
        bValue = new Date(b.latest_activation.activated_at);
        break;
      case 'total_activations':
        aValue = a.total_activations;
        bValue = b.total_activations;
        break;
      default:
        return 0;
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const renderLocation = (device: Device) => {
    const locationData = device.location_data;
    
    if (locationData && locationData.success) {
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {locationData.city || 'غير محدد'}
            </span>
          </div>
          {locationData.country && (
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <Globe className="h-3 w-3" />
              {locationData.country}
            </div>
          )}
          {locationData.region && (
            <div className="text-xs text-gray-500 dark:text-gray-500">
              {locationData.region}
            </div>
          )}
        </div>
      );
    }

    if (typeof device.location === 'object' && device.location !== null) {
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {device.location.city || 'غير محدد'}
            </span>
          </div>
          {device.location.country && (
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <Globe className="h-3 w-3" />
              {device.location.country}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-gray-400" />
          <span>إحداثيات: {device.location as string}</span>
        </div>
      </div>
    );
  };

  const SortIcon = ({ field }: { field: typeof sortBy }) => {
    if (sortBy !== field) return null;
    return (
      <span className="ml-1 text-gray-400">
        {sortOrder === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Search and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="بحث بمعرف الجهاز أو IP..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={onRefresh}
            variant="secondary"
            size="sm"
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
        </div>
      </div>

      {/* Modern Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('device_id')}
                    className="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
                  >
                    معرف الجهاز
                    <SortIcon field="device_id" />
                  </button>
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  الموقع
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('latest_activation')}
                    className="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
                  >
                    آخر تفعيل
                    <SortIcon field="latest_activation" />
                  </button>
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('total_activations')}
                    className="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
                  >
                    عدد التفعيلات
                    <SortIcon field="total_activations" />
                  </button>
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {sortedData.map((group, index) => (
                <React.Fragment key={group.device_id}>
                  {/* Main Row */}
                  <tr className="group hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleExpanded(group.device_id)}
                          className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
                        >
                          {expandedRows.has(group.device_id) ? (
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-500" />
                          )}
                        </button>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                            <Monitor className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {group.device_id}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              IP: {group.latest_activation.ip}
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      {renderLocation(group.latest_activation)}
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {new Date(group.latest_activation.activated_at).toLocaleDateString('ar-IQ')}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(group.latest_activation.activated_at).toLocaleTimeString('ar-IQ')}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-white">
                            {group.total_activations}
                          </span>
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          تفعيل
                        </span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <Button
                        onClick={() => onViewDetails(group.latest_activation)}
                        size="sm"
                        variant="secondary"
                        className="flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200"
                      >
                        <Eye className="h-4 w-4" />
                        عرض التفاصيل
                      </Button>
                    </td>
                  </tr>
                  
                  {/* Expanded History */}
                  {expandedRows.has(group.device_id) && group.activation_history.length > 1 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50">
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                              تاريخ التفعيلات ({group.total_activations})
                            </h4>
                          </div>
                          
                          <div className="grid gap-3 max-h-96 overflow-y-auto">
                            {group.activation_history.map((activation, index) => {
                              const isLatest = index === 0;
                              return (
                                <div
                                  key={`${activation._id}-${index}`}
                                  className={`p-4 rounded-lg border transition-all duration-200 ${
                                    isLatest
                                      ? 'border-blue-200 bg-blue-50 dark:border-blue-600 dark:bg-blue-900/20'
                                      : 'border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                                  }`}
                                >
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">IP:</span>
                                        <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                          {activation.ip}
                                        </span>
                                        {isLatest && (
                                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                            حالي
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400">الموقع:</div>
                                      <div className="text-xs">
                                        {renderLocation(activation)}
                                      </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400">التاريخ:</div>
                                      <div className="text-xs text-gray-900 dark:text-white">
                                        {new Date(activation.activated_at).toLocaleDateString('ar-IQ')}
                                        <br />
                                        <span className="text-gray-500 dark:text-gray-400">
                                          {new Date(activation.activated_at).toLocaleTimeString('ar-IQ')}
                                        </span>
                                      </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400">المصدر:</div>
                                      <div className="text-xs">
                                        <div className="text-gray-900 dark:text-white">
                                          {activation.location_data?.source || 'غير محدد'}
                                        </div>
                                        <div className="text-gray-500 dark:text-gray-400">
                                          {activation.location_data?.success ? 'تم تحديد الموقع' : 'فشل في التحديد'}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        
        {sortedData.length === 0 && (
          <div className="text-center py-12">
            <div className="h-12 w-12 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <Search className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              لا توجد نتائج
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              جرب تغيير معايير البحث
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
