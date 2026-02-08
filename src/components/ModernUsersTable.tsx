import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  MapPin,
  Clock,
  Eye,
  Search,
  RefreshCw,
  Shield,
  Timer,
  Smartphone,
  User,
  Phone,
  Layers,
  Fingerprint,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button';
import { type Device, type GroupedDevice } from '../api/client';

interface ModernUsersTableProps {
  data: GroupedDevice[];
  onViewDetails: (device: Device) => void;
  loading?: boolean;
}

export default function ModernUsersTable({
  data,
  onViewDetails,
  loading = false
}: ModernUsersTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortBy] = useState<'device_id' | 'latest_activation' | 'total_activations'>('latest_activation');
  const [sortOrder] = useState<'asc' | 'desc'>('desc');
  const [licenseTypeFilter, setLicenseTypeFilter] = useState<string>('all');

  const toggleExpanded = (deviceId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(deviceId)) {
      newExpanded.delete(deviceId);
    } else {
      newExpanded.add(deviceId);
    }
    setExpandedRows(newExpanded);
  };


  const filteredData = data.filter(group => {
    if (licenseTypeFilter === 'all') return true;
    const licenseType = group.latest_activation.license?.type;
    return licenseType === licenseTypeFilter;
  });

  const sortedData = [...filteredData].sort((a, b) => {
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
    if (sortOrder === 'asc') return aValue > bValue ? 1 : -1;
    return aValue < bValue ? 1 : -1;
  });

  const calculateRemainingDays = (expiresAt?: string) => {
    if (!expiresAt) return null;
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'منتهية';
    if (diffDays === 0) return 'ينتهي اليوم';
    return `${diffDays} يوم`;
  };

  const renderLicenseBadge = (type: string) => {
    const configs: Record<string, { color: string, label: string, icon: any }> = {
      'trial-7-days': { color: 'orange', label: 'تجربة 7 أيام', icon: Timer },
      'trial': { color: 'yellow', label: 'تجربة', icon: Timer },
      'lifetime': { color: 'emerald', label: 'مدى الحياة', icon: Shield },
      'custom': { color: 'blue', label: 'مخصص', icon: Shield },
      'custom-lifetime': { color: 'indigo', label: 'مخصص أبدي', icon: Shield },
    };

    const config = configs[type] || { color: 'slate', label: type, icon: Shield };
    const Icon = config.icon;

    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-${config.color}-50 dark:bg-${config.color}-500/10 border-${config.color}-200/50 dark:border-${config.color}-500/20`}>
        <Icon className={`w-3.5 h-3.5 text-${config.color}-600 dark:text-${config.color}-400`} />
        <span className={`text-[10px] font-black uppercase tracking-wider text-${config.color}-700 dark:text-${config.color}-300`}>
          {config.label}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Table Header / Toolbar Integration */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between px-6 py-4 bg-slate-900/5 dark:bg-white/5 border-b border-slate-200 dark:border-white/5">
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-slate-400">
            <Layers className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">قائمة الأجهزة النشطة</span>
          </div>
          <div className="h-4 w-[1px] bg-slate-200 dark:bg-white/10 hidden sm:block" />
          <div className="flex items-center gap-3">
            <select
              value={licenseTypeFilter}
              onChange={(e) => setLicenseTypeFilter(e.target.value)}
              className="bg-transparent text-xs font-black text-slate-600 dark:text-slate-300 outline-none cursor-pointer hover:text-blue-500 transition-colors"
            >
              <option value="all">كل الرخص</option>
              <option value="trial-7-days">تجربة 7 أيام</option>
              <option value="lifetime">مدى الحياة</option>
              <option value="custom">مخصص</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {loading && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <RefreshCw className="w-4 h-4 text-blue-500" />
            </motion.div>
          )}
          <span className="text-[10px] font-black text-slate-400 uppercase">
            تم العثور على {sortedData.length} جهاز
          </span>
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full border-separate border-spacing-y-2 px-6">
          <thead>
            <tr className="text-slate-400">
              <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest whitespace-nowrap">معرف الجهاز</th>
              <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest whitespace-nowrap">الاسم والاتصال</th>
              <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest whitespace-nowrap">التطبيق</th>
              <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest whitespace-nowrap">نوع الرخصة</th>
              <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest whitespace-nowrap">الحالة</th>
              <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest whitespace-nowrap text-center">التفعيلات</th>
              <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest whitespace-nowrap">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((group, idx) => {
              const isExpanded = expandedRows.has(group.device_id);
              const device = group.latest_activation;
              const remaining = calculateRemainingDays(device.license?.expires_at);
              const isExpired = remaining === 'منتهية';

              return (
                <React.Fragment key={group.device_id}>
                  <motion.tr
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className={`group glass-card border-none hover:bg-slate-100/50 dark:hover:bg-white/[0.03] transition-all cursor-pointer ${isExpanded ? 'bg-slate-100/50 dark:bg-white/[0.03]' : ''}`}
                    onClick={() => toggleExpanded(group.device_id)}
                  >
                    {/* Device ID */}
                    <td className="px-4 py-4 rounded-r-2xl overflow-hidden relative">
                      {isExpanded && <div className="absolute top-0 right-0 w-1 h-full bg-blue-500" />}
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-xl border ${isExpanded ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-white/5 text-slate-500'}`}>
                          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2">
                            <Fingerprint className="w-3 h-3 text-blue-500" />
                            <span className="text-sm font-black text-slate-900 dark:text-white truncate max-w-[180px]">
                              {group.device_id.split('-')[0]}...{group.device_id.slice(-6)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 opacity-60">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">IP: {device.ip}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Name & Contact */}
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <User className="w-3 h-3 text-slate-400" />
                          <span className="text-sm font-black text-slate-900 dark:text-white uppercase truncate max-w-[120px]">
                            {device.name || 'مستخدم غير معروف'}
                          </span>
                        </div>
                        {device.phone && (
                          <div className="flex items-center gap-2 opacity-60">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400" dir="ltr">
                              {device.phone}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* App */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 p-[1px]">
                          <div className="w-full h-full bg-[#0a0f18] rounded-[11px] flex items-center justify-center overflow-hidden">
                            {device.app?.icon ? (
                              <img src={device.app.icon} className="w-full h-full object-cover" />
                            ) : (
                              <Smartphone className="w-5 h-5 text-white/50" />
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-900 dark:text-white">
                            {device.app?.name || 'تطبيق عام'}
                          </span>
                          <span className="text-[10px] font-bold text-blue-500 italic">V-ENGINE</span>
                        </div>
                      </div>
                    </td>

                    {/* License Type */}
                    <td className="px-4 py-4">
                      {renderLicenseBadge(device.license?.type || 'unknown')}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <div className={`flex items-center gap-1.5 ${isExpired ? 'text-red-500' : 'text-emerald-500'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${isExpired ? 'bg-red-500' : 'bg-emerald-500'} shadow-[0_0_8px] ${isExpired ? 'shadow-red-500' : 'shadow-emerald-500'}`} />
                          <span className="text-[10px] font-black uppercase tracking-tight">
                            {isExpired ? 'منتهي الصلاحية' : 'نشط وحي'}
                          </span>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 mt-0.5">
                          ينتهي خلال: {remaining || 'غير محدد'}
                        </span>
                      </div>
                    </td>

                    {/* Total Activations */}
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center">
                        <div className="h-8 px-4 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 flex items-center gap-2 group-hover:border-blue-500/50 transition-colors">
                          <Zap className="w-3 h-3 text-yellow-500" />
                          <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                            {group.total_activations}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4 rounded-l-2xl">
                      <div className="flex items-center justify-end">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewDetails(device);
                          }}
                          variant="secondary"
                          className="h-9 px-4 rounded-xl text-[10px] font-black bg-blue-600/10 hover:bg-blue-600 text-blue-600 hover:text-white border-none transition-all shadow-none"
                        >
                          <Eye className="w-3.5 h-3.5 ml-2" />
                          كشف كامل
                        </Button>
                      </div>
                    </td>
                  </motion.tr>

                  {/* Expanded History Section */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.tr
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <td colSpan={7} className="px-8 pb-4 pt-0">
                          <div className="glass-card bg-slate-100/80 dark:bg-slate-900/40 p-6 rounded-2xl border border-blue-500/20 shadow-2xl space-y-4">
                            <div className="flex items-center justify-between border-b border-white/10 pb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center">
                                  <Clock className="w-4 h-4 text-blue-500" />
                                </div>
                                <h4 className="text-sm font-black dark:text-white">سجل التفعيلات المتزامن لهذا الجهاز</h4>
                              </div>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                إجمالي المسجل: {group.total_activations} عملية
                              </span>
                            </div>

                            <div className="grid gap-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                              {group.activation_history.map((activation, aIdx) => (
                                <div
                                  key={activation._id || aIdx}
                                  className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all group/hist"
                                >
                                  <div className="flex items-center gap-6">
                                    <div className="flex flex-col">
                                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">توقيت التفعيل</span>
                                      <div className="text-xs font-bold dark:text-white mt-1">
                                        {new Date(activation.activated_at).toLocaleDateString('ar-IQ')} - {new Date(activation.activated_at).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}
                                      </div>
                                    </div>
                                    <div className="h-6 w-[1px] bg-white/10" />
                                    <div className="flex flex-col">
                                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">عنوان الشبكة</span>
                                      <span className="text-xs font-mono text-emerald-500 mt-1">{activation.ip}</span>
                                    </div>
                                    <div className="h-6 w-[1px] bg-white/10" />
                                    <div className="flex flex-col">
                                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">الموقع</span>
                                      <div className="flex items-center gap-2 mt-1">
                                        <MapPin className="w-3 h-3 text-blue-500" />
                                        <span className="text-xs font-bold dark:text-slate-300">
                                          {activation.location_data?.city || 'غير محدد'}, {activation.location_data?.country || 'N/A'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-4">
                                    {renderLicenseBadge(activation.license?.type || 'unknown')}
                                    <button
                                      onClick={(e) => { e.stopPropagation(); onViewDetails(activation); }}
                                      className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-blue-600 transition-colors group-hover/hist:bg-white/10"
                                    >
                                      <Eye className="w-4 h-4 text-white" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {sortedData.length === 0 && (
        <div className="py-20 flex flex-col items-center justify-center glass-card border-dashed">
          <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-6">
            <Search className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">لا توجد أجهزة مطابقة</h3>
          <p className="text-slate-500 dark:text-slate-500 font-bold">جرب كتابة تفاصيل مختلفة في حقل البحث أو قم بتغيير الفلتر</p>
        </div>
      )}
    </div>
  );
}
