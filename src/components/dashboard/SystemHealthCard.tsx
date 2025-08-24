import React from 'react';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  ClockIcon 
} from '@heroicons/react/24/outline';

interface SystemHealthCardProps {
  health?: {
    status: string;
    timestamp: string;
    version: string;
  };
  isLoading: boolean;
}

export default function SystemHealthCard({ health, isLoading }: SystemHealthCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  const isHealthy = health?.status === 'OK';
  const statusIcon = isHealthy ? CheckCircleIcon : ExclamationTriangleIcon;
  const statusColor = isHealthy 
    ? 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200'
    : 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            حالة النظام
          </h3>
          <div className={`p-2 rounded-full ${statusColor}`}>
            {React.createElement(statusIcon, { className: "h-5 w-5" })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">الحالة</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              isHealthy 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}>
              {isHealthy ? 'متصل' : 'غير متصل'}
            </span>
          </div>

          {health?.version && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">الإصدار</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {health.version}
              </span>
            </div>
          )}

          {health?.timestamp && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">آخر فحص</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {new Date(health.timestamp).toLocaleString('ar-IQ')}
              </span>
            </div>
          )}

          <div className="border-t dark:border-gray-700 pt-4">
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
              <ClockIcon className="h-4 w-4 ml-1" />
              يتم التحديث كل 30 ثانية
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}