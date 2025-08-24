import { TicketIcon, TagIcon } from '@heroicons/react/24/outline';

interface CodeStatsCardProps {
  codeStats?: {
    total: number;
    used: number;
    available: number;
    expired: number;
    by_type: Record<string, number>;
  };
}

export default function CodeStatsCard({ codeStats }: CodeStatsCardProps) {
  if (!codeStats) {
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
            إحصائيات رموز التفعيل
          </h3>
          <TicketIcon className="h-6 w-6 text-gray-400" />
        </div>
        
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">إجمالي الرموز</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {codeStats.total.toLocaleString('ar-IQ')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">المتاحة</p>
              <p className="text-2xl font-semibold text-blue-600">
                {codeStats.available.toLocaleString('ar-IQ')}
              </p>
            </div>
          </div>

          {/* Code Types */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              حسب النوع
            </h4>
            <div className="space-y-2">
              {Object.entries(codeStats.by_type).map(([type, count]) => (
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

          {/* Usage Statistics */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400">مستخدمة</p>
              <p className="text-lg font-semibold text-green-700 dark:text-green-300">
                {codeStats.used.toLocaleString('ar-IQ')}
              </p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">منتهية الصلاحية</p>
              <p className="text-lg font-semibold text-red-700 dark:text-red-300">
                {codeStats.expired.toLocaleString('ar-IQ')}
              </p>
            </div>
          </div>

          {/* Usage Rate */}
          <div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">معدل الاستخدام</span>
              <span className="text-gray-900 dark:text-white">
                {Math.round((codeStats.used / codeStats.total) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${(codeStats.used / codeStats.total) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}