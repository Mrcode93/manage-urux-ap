import { DocumentTextIcon, ChartBarIcon } from '@heroicons/react/24/outline';

interface LicenseStatsCardProps {
  licenseStats?: {
    total: number;
    active: number;
    expired: number;
    recent_activations: number;
    by_type: Record<string, number>;
  };
}

export default function LicenseStatsCard({ licenseStats }: LicenseStatsCardProps) {
  if (!licenseStats) {
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

  const typeLabels = {
    trial: 'تجريبي',
    full: 'كامل',
    partial: 'جزئي',
    features: 'ميزات محددة',
    custom: 'مخصص',
    'first-activation': 'التفعيل الأول'
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            إحصائيات التراخيص
          </h3>
          <DocumentTextIcon className="h-6 w-6 text-gray-400" />
        </div>
        
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">إجمالي التراخيص</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {licenseStats.total.toLocaleString('ar-IQ')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">النشطة</p>
              <p className="text-2xl font-semibold text-green-600">
                {licenseStats.active.toLocaleString('ar-IQ')}
              </p>
            </div>
          </div>

          {/* License Types */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              حسب النوع
            </h4>
            <div className="space-y-2">
              {Object.entries(licenseStats.by_type).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {typeLabels[type as keyof typeof typeLabels] || type}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {(count as number).toLocaleString('ar-IQ')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Progress Bars */}
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">نسبة النشطة</span>
                <span className="text-gray-900 dark:text-white">
                  {Math.round((licenseStats.active / licenseStats.total) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${(licenseStats.active / licenseStats.total) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}