import { useState } from 'react';
import {
  X,
  Globe,
  Monitor,
  Wifi,
  Shield,
  FileText,
  Download,
  Timer,
  AlertTriangle,
  Fingerprint,
  Activity,
  Cpu,
  Navigation,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import Button from './Button';
import ConfirmDialog from './ConfirmDialog';
import { type Device, resetDeviceTrial } from '../api/client';

interface DeviceDetailsModalProps {
  device: Device | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function DeviceDetailsModal({ device, isOpen, onClose }: DeviceDetailsModalProps) {
  if (!device) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('ar-IQ'),
      time: date.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }),
      full: date.toLocaleString('ar-IQ')
    };
  };

  const renderBadge = (type: string) => {
    const configs: Record<string, { color: string, label: string, icon: any }> = {
      'trial-7-days': { color: 'orange', label: 'تجربة 7 أيام', icon: Timer },
      'lifetime': { color: 'emerald', label: 'مدى الحياة', icon: Shield },
      'custom': { color: 'blue', label: 'مخصص', icon: Activity },
    };
    const config = configs[type] || { color: 'slate', label: type, icon: Shield };
    const Icon = config.icon;

    return (
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl border bg-${config.color}-500/10 border-${config.color}-500/20 shadow-lg shadow-${config.color}-500/5`}>
        <Icon className={`w-4 h-4 text-${config.color}-500`} />
        <span className={`text-xs font-black uppercase tracking-wider text-${config.color}-400`}>
          {config.label}
        </span>
      </div>
    );
  };

  const InfoCard = ({ icon: Icon, label, value, sub, color = "blue" }: any) => (
    <div className="glass-card p-4 border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all group overflow-hidden relative">
      <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-500/5 blur-3xl -mr-12 -mt-12 group-hover:bg-${color}-500/10 transition-colors`} />
      <div className="flex gap-4 relative">
        <div className={`w-10 h-10 rounded-xl bg-${color}-500/10 flex items-center justify-center border border-${color}-500/20`}>
          <Icon className={`w-5 h-5 text-${color}-500`} />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">{label}</span>
          <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{value}</span>
          {sub && <span className="text-[10px] font-bold text-slate-400 mt-0.5">{sub}</span>}
        </div>
      </div>
    </div>
  );

  const [isResetting, setIsResetting] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  // Trigger confirmation dialog
  const handleResetTrial = () => {
    setShowConfirmReset(true);
  };

  // Execute reset after confirmation
  const confirmResetTrial = async () => {
    if (!device) return;

    setShowConfirmReset(false);
    setIsResetting(true);

    try {
      await resetDeviceTrial(device.device_id, device.app?._id);
      toast.success('تم إعادة تعيين الفترة التجريبية بنجاح');
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل إعادة تعيين التجربة');
      console.error(error);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
          {/* Enhanced Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-4xl bg-[#0a0f18]/90 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 shadow-[0_32px_128px_-16px_rgba(0,0,0,0.5)] overflow-hidden relative"
          >
            {/* Header Section */}
            <div className="relative h-48 sm:h-56 bg-gradient-to-br from-blue-600 to-indigo-900 overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f18] to-transparent" />

              <div className="absolute top-8 right-8 left-8 flex items-start justify-between">
                <div className="flex gap-6">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center p-1 overflow-hidden shadow-2xl">
                    {device.app?.icon ? (
                      <img src={device.app.icon} className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      <Monitor className="w-10 h-10 text-white/50" />
                    )}
                  </div>
                  <div className="flex flex-col pt-2">
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl sm:text-3xl font-black text-white">{device.name || 'مستخدم مجهول'}</h2>
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-2 text-blue-200">
                        <Fingerprint className="w-3.5 h-3.5 opacity-60" />
                        <span className="text-xs font-black uppercase tracking-widest">{device.device_id.split('-')[0]}...</span>
                      </div>
                      <div className="h-3 w-[1px] bg-white/10" />
                      <div className="flex items-center gap-2 text-indigo-200">
                        <Wifi className="w-3.5 h-3.5 opacity-60" />
                        <span className="text-xs font-black uppercase tracking-widest">{device.ip}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-red-500 text-white flex items-center justify-center transition-all backdrop-blur-md border border-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="px-8 pb-8 -mt-12 relative h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Right Column - Status & License */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="glass-card p-6 border-white/5 bg-white/[0.03]">
                    <div className="flex items-center gap-3 mb-6">
                      <Shield className="w-5 h-5 text-blue-500" />
                      <h3 className="text-sm font-black text-white uppercase tracking-widest">تصريح التشغيل</h3>
                    </div>
                    <div className="space-y-6">
                      <div className="flex flex-col items-center justify-center py-4 bg-slate-950/50 rounded-3xl border border-white/5">
                        <span className="text-[10px] font-black text-slate-500 uppercase mb-3">نوع الرخصة الحالية</span>
                        {renderBadge(device.license?.type || 'unknown')}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-slate-500 mb-1">تاريخ الإصدار</span>
                          <span className="text-xs font-bold text-white leading-none">
                            {device.license ? formatDate(device.license.issued_at).date : 'N/A'}
                          </span>
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="text-[9px] font-black text-slate-500 mb-1">انتهاء الصلاحية</span>
                          <span className={`text-xs font-bold leading-none ${device.license?.expires_at ? 'text-blue-400' : 'text-emerald-400'}`}>
                            {device.license?.expires_at ? formatDate(device.license.expires_at).date : 'دائمة'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="glass-card p-6 border-white/5 bg-white/[0.03]">
                    <div className="flex items-center gap-3 mb-6">
                      <Navigation className="w-5 h-5 text-emerald-500" />
                      <h3 className="text-sm font-black text-white uppercase tracking-widest">الموقع المكتشف</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                          <Globe className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-white">{device.location_data?.country || 'غير متوفر'}</span>
                          <span className="text-[10px] font-bold text-slate-500 mt-0.5">{device.location_data?.city || 'مدينة غير معروفة'}</span>
                        </div>
                      </div>
                      <div className="p-3 bg-slate-950/50 rounded-2xl text-[10px] font-bold text-slate-400 border border-white/5">
                        {device.location_data?.formatted_address || 'لا تتوفر تفاصيل العنوان الدقيق لهذا الجهاز حالياً'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Content Column */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoCard
                      icon={Activity}
                      label="معدل استخدام الحزمة"
                      value="34.2 GB / Month"
                      sub="متصل منذ: 42 دقيقة"
                      color="blue"
                    />
                    <InfoCard
                      icon={Cpu}
                      label="بنية نظام التشغيل"
                      value="Windows 11 x64"
                      sub="آخر تفعيل عبر: Desktop App"
                      color="purple"
                    />
                  </div>

                  <div className="glass-card p-6 border-white/5 bg-white/[0.03]">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <Activity className="w-5 h-5 text-indigo-500" />
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">تاريخ النشاط الأخير</h3>
                      </div>
                      <div className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-black text-indigo-400">
                        LIVE METRICS
                      </div>
                    </div>

                    <div className="space-y-4">
                      {[
                        { event: 'نجاح التفعيل', time: device.activated_at, status: 'success', icon: Activity },
                        { event: 'طلب ترخيص جديد', time: device.activated_at, status: 'info', icon: FileText },
                        { event: 'فحص التحديثات', time: device.activated_at, status: 'info', icon: RefreshCw },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 group hover:bg-white/[0.05] transition-all">
                          <div className="flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${item.status === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-blue-500/10 border-blue-500/20 text-blue-500'}`}>
                              <item.icon className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-white uppercase">{item.event}</span>
                              <span className="text-[10px] font-bold text-slate-500 mt-0.5">{formatDate(item.time).full || formatDate(item.time).date}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ExternalLink className="w-3 h-3 text-slate-500" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Features Section */}
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest w-full mb-2 px-1">الميزات المدعومة لهذا الجهاز</span>
                    {(device.license?.features || ['نظام التشفير V2', 'تعدد الحسابات', 'تصدير البيانات']).map((feature, idx) => (
                      <div key={idx} className="px-4 py-2 rounded-xl bg-blue-500/5 border border-blue-500/10 text-[10px] font-bold text-blue-400">
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Premium Footer */}
            <div className="p-8 bg-slate-900/50 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6 backdrop-blur-3xl">
              <div className="flex items-center gap-4 group cursor-help">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">تنبيهات النظام</span>
                  <span className="text-xs font-bold text-slate-400">لا توجد مخالفات مسجلة على هذا المعرف</span>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button
                  onClick={onClose}
                  variant="secondary"
                  className="flex-1 sm:flex-none h-12 px-8 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-black text-xs border-none"
                >
                  إغلاق التفاصيل
                </Button>

                {/* Reset Trial Button */}
                {(device.license?.type === 'trial' || device.license?.type === 'trial-7-days') && (
                  <Button
                    onClick={handleResetTrial}
                    disabled={isResetting}
                    className="flex-1 sm:flex-none h-12 px-8 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs shadow-xl shadow-orange-500/20 disabled:opacity-50"
                  >
                    {isResetting ? (
                      <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 ml-2" />
                    )}
                    {isResetting ? 'جاري إعادة التعيين...' : 'إعادة تعيين التجربة'}
                  </Button>
                )}

                <Button
                  onClick={() => console.log('Download license')}
                  className="flex-1 sm:flex-none h-12 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-xl shadow-blue-500/20"
                >
                  <Download className="w-4 h-4 ml-2" />
                  تحميل شهادة الرخصة
                </Button>
              </div>
            </div>

          </motion.div>

          {/* Confirmation Dialog - Moved outside to escape transform context */}
          <ConfirmDialog
            isOpen={showConfirmReset}
            title="تأكيد إعادة تعيين الفترة التجريبية"
            message="هل أنت متأكد من رغبتك في إعادة تعيين الفترة التجريبية لهذا الجهاز؟ سيتم حذف سجل التجربة والرخصة الحالية، مما يسمح للجهاز بتفعيل فترة تجريبية جديدة."
            confirmText="نعم، إعادة تعيين"
            cancelText="إلغاء"
            variant="danger"
            onConfirm={confirmResetTrial}
            onCancel={() => setShowConfirmReset(false)}
            zIndex={200}
          />
        </div>
      )}
    </AnimatePresence>
  );
}
