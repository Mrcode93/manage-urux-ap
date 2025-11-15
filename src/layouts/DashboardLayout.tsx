import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { useStore } from '../store/useStore';
import blackLogo from '../assets/images/black.png';
import whiteLogo from '../assets/images/white.png';
import {
  HomeIcon,
  UsersIcon,
  TicketIcon,
  CpuChipIcon,
  Bars3Icon,
  XMarkIcon,
  SparklesIcon,
  ArrowDownTrayIcon,
  Cog6ToothIcon,
  ServerIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserIcon,
  UserGroupIcon,
  ArrowRightOnRectangleIcon,
  KeyIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  ServerStackIcon,
  BellIcon,
  CalculatorIcon,
  DevicePhoneMobileIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import Tooltip from '../components/Tooltip';
import { 
  UsersReadGuard, 
  LicensesReadGuard, 
  ActivationCodesReadGuard, 
  BackupsReadGuard, 
  SettingsReadGuard,
  AnalyticsReadGuard 
} from '../components/PermissionGuard';

const navigation = [
  { name: 'الرئيسية', href: '/', icon: HomeIcon, permission: 'dashboard:read' },
  { name: 'المستخدمين', href: '/users', icon: UsersIcon, permission: 'customers:read' },
  { name: 'ادارة النظام', href: '/manage-users', icon: ServerStackIcon, permission: 'users:read' },
 { name: 'رموز التفعيل', href: '/activation-codes', icon: TicketIcon, permission: 'activation_codes:read' },
  { name: 'الميزات', href: '/features', icon: CpuChipIcon, permission: 'features:read' },
  // { name: 'الخطط', href: '/plans', icon: DocumentTextIcon, permission: 'plans:read' },
  { name: 'التطبيقات', href: '/apps', icon: DevicePhoneMobileIcon, permission: 'apps:read' },
  { name: 'التحديثات', href: '/updates', icon: SparklesIcon, permission: 'updates:read' },
 { name: 'النسخ الاحتياطية', href: '/backups', icon: ArrowDownTrayIcon, permission: 'backups:read' },
  { name: 'احتياطي المستخدمين', href: '/cloud-backups', icon: ServerIcon, permission: 'cloud_backups:read' },
  { name: 'المحاسبة', href: '/accountant', icon: CalculatorIcon, permission: 'customers:read' },
  { name: 'سجلات النظام', href: '/logs', icon: BellIcon, permission: 'logs:read' },
  { name: 'الإعدادات', href: '/settings', icon: Cog6ToothIcon, permission: 'settings:read' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const { admin, logout } = useAuth();
  const { hasPermission } = usePermissions();
  const { darkMode } = useStore();

  // Keyboard shortcut to toggle sidebar collapse (Ctrl/Cmd + B)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault();
        setSidebarCollapsed(!sidebarCollapsed);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sidebarCollapsed]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      // Check if click is outside the user menu area
      if (userMenuOpen && !target.closest('.user-menu-container')) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [userMenuOpen]);

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 right-0 flex w-64 flex-col bg-white dark:bg-gray-800">
          <div className="flex h-16 items-center justify-between px-4">
            <img 
              src={darkMode ? whiteLogo : blackLogo} 
              alt="ادارة اوركاش" 
              className="h-8 w-auto"
            />
            <button
              type="button"
              className="text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation
              .filter(item => !item.permission || hasPermission(item.permission.split(':')[0], item.permission.split(':')[1]))
              .map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-primary-100 text-primary-900 dark:bg-primary-900 dark:text-primary-100'
                      : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <item.icon
                    className={`ml-3 h-6 w-6 flex-shrink-0 ${
                      isActive
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-300'
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          
          {/* Mobile User Menu */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <UserIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="mr-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{admin?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{admin?.role}</p>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <Link
                to="/profile"
                className="block px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700 rounded-md"
              >
                الملف الشخصي
              </Link>
              <button
                onClick={handleLogout}
                className="block w-full text-right px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-md"
              >
                تسجيل الخروج
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'
      }`}>
        <div className="flex min-h-0 flex-1 flex-col bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
          <div className="flex h-16 items-center justify-between px-4">
            {!sidebarCollapsed && (
              <img 
                src={darkMode ? whiteLogo : blackLogo} 
                alt="ادارة اوركاش" 
                className="h-8 w-auto"
              />
            )}
            <button
              type="button"
              className={`text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 transition-colors ${
                sidebarCollapsed ? 'mx-auto' : ''
              }`}
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title={`${sidebarCollapsed ? 'توسيع' : 'طي'} الشريط الجانبي (Ctrl+B)`}
            >
              {sidebarCollapsed ? (
                <ChevronRightIcon className="h-5 w-5" />
              ) : (
                <ChevronLeftIcon className="h-5 w-5" />
              )}
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation
              .filter(item => !item.permission || hasPermission(item.permission.split(':')[0], item.permission.split(':')[1]))
              .map((item) => {
              const isActive = location.pathname === item.href;
              const linkContent = (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-100 text-primary-900 dark:bg-primary-900 dark:text-primary-100'
                      : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <item.icon
                    className={`h-6 w-6 flex-shrink-0 ${
                      sidebarCollapsed ? 'mx-auto' : 'ml-3'
                    } ${
                      isActive
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-300'
                    }`}
                  />
                  {!sidebarCollapsed && (
                    <span className="truncate">{item.name}</span>
                  )}
                </Link>
              );

              return sidebarCollapsed ? (
                <Tooltip key={item.name} content={item.name} position="right">
                  {linkContent}
                </Tooltip>
              ) : (
                linkContent
              );
            })}
          </nav>
          
          {/* Desktop User Menu */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="relative user-menu-container">
              {(() => {
                const userButton = (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setUserMenuOpen(!userMenuOpen);
                    }}
                    className="flex items-center w-full text-right rounded-md p-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                    {!sidebarCollapsed && (
                      <div className="mr-3 flex-1">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{admin?.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{admin?.role}</p>
                      </div>
                    )}
                  </button>
                );

                return sidebarCollapsed ? (
                  <Tooltip content={`${admin?.name} (${admin?.role})`} position="right">
                    {userButton}
                  </Tooltip>
                ) : (
                  userButton
                );
              })()}
              
              {userMenuOpen && (
                <div 
                  className={`absolute bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10 ${
                    sidebarCollapsed 
                      ? 'bottom-full left-0 mb-2 w-48' 
                      : 'bottom-full left-0 mb-2 w-full'
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="py-1">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      الملف الشخصي
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-right px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      تسجيل الخروج
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={`transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'lg:pr-16' : 'lg:pr-64'
      }`}>
        {/* Mobile menu button - only visible on mobile */}
        <div className="lg:hidden fixed top-4 right-4 z-20">
          <button
            type="button"
            className="p-2 rounded-md bg-white dark:bg-gray-800 shadow-lg text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
        </div>
        
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}