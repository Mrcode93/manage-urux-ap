import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/Button';
import { Shield, Settings as SettingsIcon, CheckCircle2, XCircle } from 'lucide-react';

interface LicenseFeature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

const DEFAULT_FEATURES: LicenseFeature[] = [
  {
    id: 'feature1',
    name: 'تفعيل القيود التلقائي',
    description: 'إيقاف الترخيص تلقائياً عند اكتشاف نشاط مشبوه',
    enabled: true,
  },
  {
    id: 'feature2',
    name: 'نظام التحقق المزدوج',
    description: 'طلب التحقق من الجهاز في كل مرة يتم فيها التغيير',
    enabled: true,
  },
  {
    id: 'feature3',
    name: 'السجلات المتقدمة',
    description: 'تخزين سجلات مفصلة لكل عملية تحقق من الترخيص',
    enabled: false,
  },
];

export default function LicenseSettings() {
  const [features, setFeatures] = useState<LicenseFeature[]>(DEFAULT_FEATURES);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // Add your save logic here
    setTimeout(() => setIsSaving(false), 1000);
  };

  const toggleFeature = (featureId: string) => {
    setFeatures((prev) =>
      prev.map((feature) =>
        feature.id === featureId
          ? { ...feature, enabled: !feature.enabled }
          : feature
      )
    );
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8"
    >
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300">
            إعدادات الترخيص المتقدمة
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">
            تكوين ميزات الأمان والتحقق الخاصة بنظام التراخيص العالمي
          </p>
        </div>
      </header>

      <div className="max-w-4xl">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="glass-card overflow-hidden border border-white/20 shadow-2xl">
            <div className="px-6 py-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white leading-none">
                    ميزات الترخيص
                  </h3>
                  <p className="text-sm font-medium text-slate-500 mt-1">تحكم في سلوك نظام التراخيص والمميزات النشطة</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {features.map((feature) => (
                <div
                  key={feature.id}
                  className="flex items-center justify-between p-5 bg-white/50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-blue-500/30 transition-all duration-300 group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${feature.enabled ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-900/30'}`}>
                      {feature.enabled ? <CheckCircle2 className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
                    </div>
                    <div>
                      <h4 className="text-base font-black text-slate-900 dark:text-white">
                        {feature.name}
                      </h4>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        {feature.description}
                      </p>
                    </div>
                  </div>

                  <div
                    onClick={() => toggleFeature(feature.id)}
                    className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer items-center rounded-full transition-all duration-300 px-1 border border-transparent ${feature.enabled ? 'bg-blue-600 shadow-lg shadow-blue-500/20' : 'bg-slate-300 dark:bg-slate-700'}`}
                    dir="ltr"
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-all duration-300 ${feature.enabled ? 'translate-x-7' : 'translate-x-0'}`} />
                  </div>
                </div>
              ))}
            </div>

            <div className="px-6 py-6 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <Button
                type="submit"
                isLoading={isSaving}
                className="px-8 py-3 rounded-2xl font-black shadow-xl shadow-blue-500/20"
              >
                حفظ الإعدادات الحالية
              </Button>
            </div>
          </div>
        </form>
      </div>
    </motion.div>
  );
} 