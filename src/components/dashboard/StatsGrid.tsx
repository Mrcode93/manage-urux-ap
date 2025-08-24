import { 
  DevicePhoneMobileIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  SparklesIcon 
} from '@heroicons/react/24/outline';

interface StatsGridProps {
  stats: {
    totalDevices: number;
    activeDevices: number;
    expiringSoon: number;
    recentActivations: number;
  };
  licenseStats?: any;
}

export default function StatsGrid({ stats, licenseStats }: StatsGridProps) {
  const statCards = [
    {
      name: 'إجمالي الأجهزة',
      value: stats.totalDevices,
      icon: DevicePhoneMobileIcon,
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200',
    },
    {
      name: 'الأجهزة النشطة',
      value: stats.activeDevices,
      icon: CheckCircleIcon,
      color: 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200',
    },
    {
      name: 'تنتهي قريباً',
      value: stats.expiringSoon,
      icon: ClockIcon,
      color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200',
    },
    {
      name: 'التفعيلات الحديثة',
      value: stats.recentActivations,
      icon: SparklesIcon,
      color: 'text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-200',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.name}
            className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`p-3 rounded-md ${stat.color}`}>
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                </div>
                <div className="mr-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      {stat.name}
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      {stat.value.toLocaleString('ar-IQ')}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}