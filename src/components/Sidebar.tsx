import {
    WrenchScrewdriverIcon,
    ArrowDownTrayIcon,
    CloudArrowUpIcon,
    SparklesIcon,
    ServerIcon,
    CalculatorIcon,
    DevicePhoneMobileIcon
} from '@heroicons/react/24/outline';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {

    return (
        <div className="flex flex-col h-full bg-gradient-to-b from-white to-gray-50 border-r border-gray-200 shadow-sm">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                        <CloudArrowUpIcon className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-3">
                        <h2 className="text-lg font-bold text-gray-900">Backup System</h2>
                        <p className="text-xs text-gray-500">Database Management</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 p-4">
                <nav className="space-y-2">
                    <NavLink
                        to="/features"
                        className={({ isActive }) =>
                            `flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                                isActive
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                                    : 'text-gray-700 hover:bg-white hover:text-gray-900 hover:shadow-md'
                            }`
                        }
                    >
                        <WrenchScrewdriverIcon className="h-5 w-5 mr-3" />
                        إدارة الميزات
                    </NavLink>

                    <NavLink
                        to="/updates"
                        className={({ isActive }) =>
                            `flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                                isActive
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                                    : 'text-gray-700 hover:bg-white hover:text-gray-900 hover:shadow-md'
                            }`
                        }
                    >
                        <ArrowDownTrayIcon className="h-5 w-5 mr-3" />
                        التحديثات
                    </NavLink>

                    <NavLink
                        to="/plans"
                        className={({ isActive }) =>
                            `flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                                isActive
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                                    : 'text-gray-700 hover:bg-white hover:text-gray-900 hover:shadow-md'
                            }`
                        }
                    >
                        <SparklesIcon className="h-5 w-5 mr-3" />
                        الخطط
                    </NavLink>

                    <NavLink
                        to="/apps"
                        className={({ isActive }) =>
                            `flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                                isActive
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                                    : 'text-gray-700 hover:bg-white hover:text-gray-900 hover:shadow-md'
                            }`
                        }
                    >
                        <DevicePhoneMobileIcon className="h-5 w-5 mr-3" />
                        التطبيقات
                    </NavLink>

                    <NavLink
                        to="/backups"
                        className={({ isActive }) =>
                            `flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                                isActive
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                                    : 'text-gray-700 hover:bg-white hover:text-gray-900 hover:shadow-md'
                            }`
                        }
                    >
                        <CloudArrowUpIcon className="h-5 w-5 mr-3" />
                        النسخ الاحتياطية
                    </NavLink>

                    <NavLink
                        to="/cloud-backups"
                        className={({ isActive }) =>
                            `flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                                isActive
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                                    : 'text-gray-700 hover:bg-white hover:text-gray-900 hover:shadow-md'
                            }`
                        }
                    >
                        <ServerIcon className="h-5 w-5 mr-3" />
                        Cloud Backups
                    </NavLink>

                    <NavLink
                        to="/accountant"
                        className={({ isActive }) =>
                            `flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                                isActive
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                                    : 'text-gray-700 hover:bg-white hover:text-gray-900 hover:shadow-md'
                            }`
                        }
                    >
                        <CalculatorIcon className="h-5 w-5 mr-3" />
                        المحاسبة
                    </NavLink>
                </nav>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200">
                <div className="text-center">
                    <p className="text-xs text-gray-500">Backup System v1.0</p>
                    <p className="text-xs text-gray-400 mt-1">Secure & Reliable</p>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;