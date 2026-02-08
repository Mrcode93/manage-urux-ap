import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    Settings2,
    Download,
    Zap,
    Smartphone,
    Users,
    ShieldCheck,
    Key,
    Cloud,
    Wallet,
    LogOut,
    ChevronRight,
    Sparkles,
    Command
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = () => {
    const { admin, logout } = useAuth();

    const navItems = [
        { to: '/', icon: LayoutDashboard, label: 'الرئيسية' },
        { to: '/features', icon: Settings2, label: 'إدارة الميزات' },
        { to: '/updates', icon: Download, label: 'التحديثات' },
        { to: '/plans', icon: Zap, label: 'الخطط' },
        { to: '/apps', icon: Smartphone, label: 'التطبيقات' },
        { to: '/users', icon: Users, label: 'العملاء' },
        { to: '/manage-users', icon: ShieldCheck, label: 'مستخدمي النظام' },
        { to: '/licenses', icon: Key, label: 'التراخيص' },
        { to: '/backups', icon: Cloud, label: 'النسخ الاحتياطية' },
        { to: '/accountant', icon: Wallet, label: 'المحاسبة' },
    ];

    return (
        <div className="flex flex-col h-full bg-white/70 dark:bg-[#0a0f18]/70 backdrop-blur-2xl border-l border-slate-200/50 dark:border-white/5 shadow-2xl z-40">
            {/* Header / Brand */}
            <div className="p-8 pb-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-4 group cursor-default"
                >
                    <div className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition-all duration-500"></div>
                        <div className="relative w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:rotate-6 transition-transform duration-500">
                            <Command className="h-6 w-6 text-white" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white flex items-center gap-1 italic">
                            URUX
                            <span className="text-blue-600 dark:text-blue-400">.</span>
                        </h2>
                        <div className="flex items-center gap-1.5 opacity-60">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                            <p className="text-[10px] uppercase tracking-widest font-black dark:text-slate-400">Engine V2</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Section Divider */}
            <div className="px-8 py-4">
                <div className="h-px bg-slate-200/50 dark:bg-white/5"></div>
            </div>

            {/* Navigation */}
            <div className="flex-1 px-4 overflow-y-auto custom-scrollbar space-y-8 pt-2">
                <div>
                    <p className="px-4 text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 dark:text-slate-500 mb-4 flex items-center gap-2">
                        <Sparkles className="h-3 w-3" />
                        القائمة الرئيسية
                    </p>
                    <nav className="space-y-1">
                        {navItems.map((item, index) => (
                            <motion.div
                                key={item.to}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.03, type: 'spring', stiffness: 300, damping: 30 }}
                            >
                                <NavLink
                                    to={item.to}
                                    className="block no-underline"
                                >
                                    {({ isActive }) => (
                                        <div className={`
                                            flex items-center justify-between group px-4 py-3 rounded-2xl transition-all duration-300
                                            ${isActive
                                                ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/25'
                                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-blue-600 dark:hover:text-blue-400'
                                            }
                                        `}>
                                            <div className="flex items-center gap-3.5">
                                                <div className={`
                                                    p-2 rounded-xl transition-colors
                                                    ${isActive ? 'bg-white/20' : 'bg-slate-100 dark:bg-white/5 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20'}
                                                `}>
                                                    <item.icon className="h-4.5 w-4.5" />
                                                </div>
                                                <span className="font-bold text-sm tracking-tight">{item.label}</span>
                                            </div>
                                            <ChevronRight className={`h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-40 group-hover:translate-x-0 transition-all duration-300`} />
                                        </div>
                                    )}
                                </NavLink>
                            </motion.div>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Footer / User Profile */}
            <div className="p-4 pt-0">
                <div className="rounded-3xl bg-slate-100/50 dark:bg-white/5 p-4 border border-slate-200/30 dark:border-white/5">
                    {admin ? (
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-500/20">
                                    {admin.name?.charAt(0) || admin.username?.charAt(0)}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-black text-slate-900 dark:text-white truncate italic">{admin.name}</p>
                                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{admin.role}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => logout()}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white dark:bg-slate-800 text-red-500 dark:text-red-400 text-xs font-black border border-slate-200 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shadow-sm"
                            >
                                <LogOut className="h-3.5 w-3.5" />
                                تسجيل الخروج
                            </button>
                        </div>
                    ) : (
                        <div className="text-center py-2">
                            <p className="text-xs font-bold text-slate-400 italic">نظام إدارة المحتوى</p>
                        </div>
                    )}
                </div>

                <div className="mt-4 flex justify-between items-center px-4">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-50">© 2026 URUX ENGINE</p>
                    <div className="flex gap-1">
                        <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                        <div className="w-1 h-1 rounded-full bg-blue-500 opacity-50"></div>
                        <div className="w-1 h-1 rounded-full bg-blue-500 opacity-25"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
