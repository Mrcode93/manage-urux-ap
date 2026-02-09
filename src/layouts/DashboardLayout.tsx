import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { useStore } from '../store/useStore';
import {
  LayoutDashboard,
  Settings2,
  Download,
  Smartphone,
  Users,
  ShieldCheck,
  Key,
  Cloud,
  Wallet,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  LogOut,
  Sparkles,
  Command,
  Bell,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navigation = [
  { name: 'الرئيسية', href: '/', icon: LayoutDashboard, permission: 'dashboard:read' },
  { name: 'المستخدمين', href: '/users', icon: Users, permission: 'customers:read' },
  { name: 'ادارة النظام', href: '/manage-users', icon: ShieldCheck, permission: 'users:read' },
  { name: 'رموز التفعيل', href: '/activation-codes', icon: Key, permission: 'activation_codes:read' },
  { name: 'الميزات', href: '/features', icon: Settings2, permission: 'features:read' },
  { name: 'التطبيقات', href: '/apps', icon: Smartphone, permission: 'apps:read' },
  { name: 'التحديثات', href: '/updates', icon: Download, permission: 'updates:read' },
  { name: 'النسخ الاحتياطية', href: '/backups', icon: Cloud, permission: 'backups:read' },
  { name: 'المحاسبة', href: '/accountant', icon: Wallet, permission: 'customers:read' },
  { name: 'الإشعارات', href: '/notifications', icon: Bell, permission: 'apps:read' },
  { name: 'سجلات النظام', href: '/logs', icon: Bell, permission: 'logs:read' },
  { name: 'الإعدادات', href: '/settings', icon: Settings, permission: 'settings:read' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const { admin, logout } = useAuth();
  const { hasPermission } = usePermissions();
  const { fontFamily } = useStore();

  useEffect(() => {
    document.body.classList.remove('font-outfit', 'font-cairo', 'font-tajawal');
    document.body.classList.add(`font-${fontFamily}`);
  }, [fontFamily]);

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

  const handleLogout = () => {
    logout();
  };

  const filteredNavigation = useMemo(() =>
    navigation.filter(
      item => !item.permission || hasPermission(item.permission.split(':')[0], item.permission.split(':')[1])
    ), [hasPermission]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0f18] transition-colors duration-500 overflow-x-hidden">
      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 lg:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-80 bg-white/90 dark:bg-[#0a0f18]/90 backdrop-blur-2xl z-50 flex flex-col border-l border-white/20 shadow-2xl lg:hidden"
            >
              <div className="p-8 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Command className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xl font-black italic dark:text-white">URUX</span>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 dark:text-white">
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="flex-1 px-4 py-4 overflow-y-auto space-y-1">
                {filteredNavigation.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold transition-all ${location.pathname === item.href
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
                      }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                ))}
              </div>
              <div className="p-6 border-t border-slate-200 dark:border-white/5">
                <div className="flex items-center gap-3 p-4 bg-slate-100 dark:bg-white/5 rounded-2xl mb-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white font-black">{admin?.name?.charAt(0)}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black dark:text-white truncate">{admin?.name}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">{admin?.role}</p>
                  </div>
                </div>
                <button onClick={handleLogout} className="w-full h-12 flex items-center justify-center gap-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-black rounded-2xl">
                  <LogOut className="h-4 w-4" />
                  تسجيل الخروج
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex fixed inset-y-0 right-0 z-40 transition-all duration-500 bg-white/70 dark:bg-[#0a0f18]/70 backdrop-blur-2xl border-l border-slate-200/50 dark:border-white/5 shadow-2xl flex-col ${sidebarCollapsed ? 'w-[88px]' : 'w-72'
          }`}
      >
        <div className={`p-8 pb-4 flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!sidebarCollapsed && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Command className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black italic dark:text-white leading-none">URUX</h2>
                <div className="flex items-center gap-1.5 opacity-60">
                  <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                  <span className="text-[8px] font-black uppercase tracking-wider dark:text-slate-400">Engine V2</span>
                </div>
              </div>
            </motion.div>
          )}
          {sidebarCollapsed && (
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Command className="h-5 w-5 text-white" />
            </div>
          )}
        </div>

        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -left-3 top-20 w-6 h-6 bg-white dark:bg-[#1a2233] border border-slate-200 dark:border-white/10 rounded-full flex items-center justify-center shadow-md dark:text-white hover:scale-110 transition-transform"
        >
          {sidebarCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>

        <nav className="flex-1 px-4 py-8 overflow-y-auto custom-scrollbar space-y-1">
          {!sidebarCollapsed && <p className="px-4 text-[10px] uppercase font-black tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-4 flex items-center gap-2"><Sparkles className="h-3 w-3" /> القائمة</p>}
          {filteredNavigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center rounded-2xl transition-all duration-300 group ${sidebarCollapsed ? 'p-3 justify-center mb-2' : 'px-4 py-3 mb-1.5'
                  } ${isActive
                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/25'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
                  }`}
              >
                <item.icon className={`h-5 w-5 ${!sidebarCollapsed && 'ml-3'}`} />
                {!sidebarCollapsed && <span className="text-sm font-bold tracking-tight">{item.name}</span>}
                {!sidebarCollapsed && isActive && <motion.div layoutId="nav-glow" className="mr-auto w-1 h-4 bg-white/50 rounded-full" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 pt-0">
          <div className={`p-4 rounded-3xl bg-slate-100/50 dark:bg-white/5 border border-slate-200/30 dark:border-white/5 ${sidebarCollapsed ? 'flex justify-center' : ''}`}>
            {!sidebarCollapsed ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-black text-white shadow-lg">{admin?.name?.charAt(0)}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black dark:text-white truncate">{admin?.name}</p>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">{admin?.role}</p>
                  </div>
                </div>
                <button onClick={handleLogout} className="w-full h-10 flex items-center justify-center gap-2 bg-white dark:bg-slate-800 text-red-600 text-xs font-black rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                  <LogOut className="h-3.5 w-3.5" />
                  تسجيل الخروج
                </button>
              </div>
            ) : (
              <button title="تسجيل الخروج" onClick={handleLogout} className="w-10 h-10 flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all">
                <LogOut className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`transition-all duration-500 ${sidebarCollapsed ? 'lg:pr-[88px]' : 'lg:pr-72'}`}>
        {/* Top Header Placeholder / Mobile Toggle */}
        <header className="h-20 flex items-center justify-between px-6 lg:hidden sticky top-0 bg-slate-50/80 dark:bg-[#0a0f18]/80 backdrop-blur-md z-30 border-b border-slate-200/50 dark:border-white/5">
          <button onClick={() => setSidebarOpen(true)} className="p-2.5 bg-white dark:bg-slate-800 shadow-xl rounded-2xl text-slate-600 dark:text-white border border-slate-100 dark:border-white/5">
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-2">
            <Command className="h-5 w-5 text-blue-600" />
            <span className="text-lg font-black italic dark:text-white">URUX</span>
          </div>
        </header>

        <main className="p-4 sm:p-8 lg:p-12 animate-entrance">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}