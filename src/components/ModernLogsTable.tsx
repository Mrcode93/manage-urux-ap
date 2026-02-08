import {
    Clock,
    User,
    Globe,
    Eye,
    AlertTriangle,
    CheckCircle,
    Info,
    Monitor
} from 'lucide-react';
import { motion } from 'framer-motion';
import { type AdminActivity } from '../api/client';

interface ModernLogsTableProps {
    data: AdminActivity[];
    isLoading?: boolean;
    onViewDetails: (activity: AdminActivity) => void;
}

export default function ModernLogsTable({ data, isLoading, onViewDetails }: ModernLogsTableProps) {
    const translateAction = (action: string): string => {
        // Basic translation logic (simplified version of what was in Logs.tsx)
        const actionTranslations: Record<string, string> = {
            'LOGIN_SUCCESS': 'تسجيل دخول ناجح',
            'LOGIN_FAILED': 'فشل تسجيل دخول',
            'LOGOUT': 'تسجيل خروج',
            'USER_CREATED': 'إنشاء مستخدم',
            'USER_UPDATED': 'تحديث مستخدم',
            'USER_DELETED': 'حذف مستخدم',
            'LICENSE_CREATED': 'إنشاء ترخيص',
            'LICENSE_UPDATED': 'تحديث ترخيص',
            'ACTIVATION_CODE_CREATED': 'إنشاء رمز تفعيل',
            'UPDATE_CREATED': 'تحديث جديد',
            'BACKUP_CREATED': 'نسخة احتياطية',
            'SETTINGS_UPDATED': 'تحديث الإعدادات',
            'LOGS_CLEARED': 'مسح السجلات'
        };

        if (action.endsWith('_CREATED')) return `إضافة ${action.split('_')[0].toLowerCase()}`;
        if (action.endsWith('_UPDATED')) return `تعديل ${action.split('_')[0].toLowerCase()}`;
        if (action.endsWith('_DELETED')) return `حذف ${action.split('_')[0].toLowerCase()}`;
        if (action.endsWith('_VIEWED')) return `عرض ${action.split('_')[0].toLowerCase()}`;

        return actionTranslations[action] || action;
    };

    const getActionTheme = (action: string) => {
        if (action.includes('CREATE') || action.includes('SUCCESS')) return { color: 'emerald', icon: CheckCircle };
        if (action.includes('DELETE') || action.includes('FAILED')) return { color: 'red', icon: AlertTriangle };
        if (action.includes('UPDATE')) return { color: 'blue', icon: Info };
        if (action.includes('VIEW')) return { color: 'purple', icon: Eye };
        return { color: 'slate', icon: Clock };
    };

    const parseUA = (ua?: string) => {
        if (!ua) return { browser: 'Unknown', os: 'Unknown' };
        const lower = ua.toLowerCase();
        let browser = 'Other';
        if (lower.includes('chrome')) browser = 'Chrome';
        else if (lower.includes('firefox')) browser = 'Firefox';
        else if (lower.includes('safari')) browser = 'Safari';

        let os = 'Other';
        if (lower.includes('windows')) os = 'Windows';
        else if (lower.includes('mac')) os = 'macOS';
        else if (lower.includes('linux')) os = 'Linux';
        else if (lower.includes('android')) os = 'Android';
        else if (lower.includes('ios')) os = 'iOS';

        return { browser, os };
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-20 bg-white/5 dark:bg-slate-900/50 animate-pulse rounded-2xl border border-white/10" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Table Header - Simplified for cards */}
            <div className="grid grid-cols-12 px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] opacity-60">
                <div className="col-span-4 lg:col-span-3">المسؤول</div>
                <div className="col-span-4 lg:col-span-3 text-center lg:text-right">الإجراء</div>
                <div className="hidden lg:block col-span-3">الشبكة والجهاز</div>
                <div className="col-span-4 lg:col-span-2 text-left">التوقيت</div>
                <div className="hidden lg:block col-span-1"></div>
            </div>

            {data.map((log, idx) => {
                const theme = getActionTheme(log.action);
                const Icon = theme.icon;
                const ua = parseUA(log.userAgent);

                return (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        onClick={() => onViewDetails(log)}
                        className="group grid grid-cols-12 items-center px-6 py-4 bg-white/50 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200/50 dark:border-white/5 rounded-[1.25rem] hover:bg-white dark:hover:bg-slate-800/60 hover:shadow-xl hover:shadow-blue-500/5 transition-all cursor-pointer"
                    >
                        {/* Admin Info */}
                        <div className="col-span-4 lg:col-span-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center border border-slate-200 dark:border-white/10 shadow-sm">
                                    <User className="w-5 h-5 text-slate-500" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-black text-slate-900 dark:text-white truncate">{log.adminName}</span>
                                    <span className="text-[10px] font-bold text-slate-500 truncate">@{log.adminUsername}</span>
                                </div>
                            </div>
                        </div>

                        {/* Action Badge */}
                        <div className="col-span-4 lg:col-span-3">
                            <div className="flex flex-col items-center lg:items-start gap-1">
                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-${theme.color}-500/10 border-${theme.color}-500/20`}>
                                    <Icon className={`w-3.5 h-3.5 text-${theme.color}-500`} />
                                    <span className={`text-[10px] font-black text-${theme.color}-500 uppercase tracking-wider`}>
                                        {translateAction(log.action)}
                                    </span>
                                </div>
                                <span className="hidden lg:block text-[10px] font-medium text-slate-400 dark:text-slate-500 truncate max-w-[200px] px-1">
                                    {log.description}
                                </span>
                            </div>
                        </div>

                        {/* Network Info */}
                        <div className="hidden lg:flex col-span-3 items-center gap-4">
                            <div className="flex items-center gap-2 text-slate-400">
                                <Globe className="w-4 h-4 opacity-50" />
                                <span className="text-xs font-mono font-bold tracking-tight">{log.ipAddress || '0.0.0.0'}</span>
                            </div>
                            <div className="h-4 w-[1px] bg-slate-200 dark:bg-white/5" />
                            <div className="flex items-center gap-2 text-slate-400">
                                <Monitor className="w-4 h-4 opacity-50" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">{ua.os} • {ua.browser}</span>
                            </div>
                        </div>

                        {/* Timestamp */}
                        <div className="col-span-4 lg:col-span-2 text-left">
                            <div className="flex flex-col items-end">
                                <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                                    {new Date(log.timestamp).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400">
                                    {new Date(log.timestamp).toLocaleDateString('ar-IQ')}
                                </span>
                            </div>
                        </div>

                        {/* Arrow/Eye */}
                        <div className="hidden lg:flex col-span-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                                <Eye className="w-4 h-4" />
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
