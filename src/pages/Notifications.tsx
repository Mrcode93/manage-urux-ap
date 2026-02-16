import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, type Variants } from 'framer-motion';
import { getApps, sendNotification, type App } from '../api/client';
import Button from '../components/Button';
import { toast } from 'react-hot-toast';
import { Send, Tag, Calendar, Megaphone, Shield, Lightbulb } from 'lucide-react';

export default function Notifications() {
    const [formData, setFormData] = useState({
        title: '',
        body: '',
        appId: '',
        data: ''
    });

    const [activeCategory, setActiveCategory] = useState('all');

    const CATEGORIES = [
        { id: 'all', name: 'الكل', icon: Tag },
        { id: 'occasions', name: 'مناسبات', icon: Calendar },
        { id: 'announcements', name: 'إعلانات', icon: Megaphone },
        { id: 'marketing', name: 'تسويق', icon: Tag },
        { id: 'alerts', name: 'تنبيهات', icon: Shield },
        { id: 'tips', name: 'نصائح', icon: Lightbulb },
    ];

    const NOTIFICATION_TEMPLATES = [
        // Occasions
        { category: 'occasions', title: 'رمضان كريم', body: 'مبارك عليكم الشهر، نسأل الله أن يعيننا وإياكم على صيامه وقيامه.', icon: '🌙' },
        { category: 'occasions', title: 'عيد فطر سعيد', body: 'تقبل الله طاعتكم، وكل عام وأنتم بخير بمناسبة عيد الفطر المبارك.', icon: '🎉' },
        { category: 'occasions', title: 'عيد أضحى مبارك', body: 'أضحى مبارك، أعاده الله عليكم باليمن والبركات.', icon: '🐑' },
        { category: 'occasions', title: 'السنة الهجرية الجديدة', body: 'عام هجري سعيد! نسأل الله أن يجعله عام خير وبركة.', icon: '🕌' },
        { category: 'occasions', title: 'اليوم الوطني', body: 'دام عزك يا وطن! كل عام والوطن بخير.', icon: '' }, // You might want to adjust flag based on user base
        { category: 'occasions', title: 'يوم الجمعة', body: 'جمعة مباركة، لا تنس قراءة سورة الكهف.', icon: '📿' },

        // Announcements & Updates
        { category: 'announcements', title: 'تحديث جديد', body: 'تحديث جديد متوفر للتطبيق! قم بالتحديث الآن للاستمتاع بالمميزات الجديدة وتحسينات الأداء.', icon: '🚀' },
        { category: 'announcements', title: 'صيانة مجدولة', body: 'سنقوم بإجراء صيانة دورية للسيرفرات اليوم من الساعة 2 صباحاً وحتى 4 صباحاً.', icon: '🛠️' },
        { category: 'announcements', title: 'ميزة جديدة', body: 'أضفنا ميزة جديدة! الآن يمكنك تتبع ديونك ومستحقاتك بكل سهولة.', icon: '✨' },
        { category: 'announcements', title: 'تغيير في الشروط', body: 'قمنا بتحديث شروط الاستخدام وسياسة الخصوصية. يرجى الاطلاع عليها.', icon: '📜' },
        { category: 'announcements', title: 'استبيان رأي', body: 'رأيك يهمنا! شاركنا تجربتك في استبيان قصير وساهم في تطوير التطبيق.', icon: '📝' },

        // Marketing
        { category: 'marketing', title: 'خصم خاص', body: 'خصم 50% على الاشتراك السنوي المميز! العرض ساري لفترة محدودة.', icon: '💸' },
        { category: 'marketing', title: 'عرض نهاية الأسبوع', body: 'استفد من عروض نهاية الأسبوع الحصرية داخل التطبيق.', icon: '🛍️' },
        { category: 'marketing', title: 'اشتراك مجاني', body: 'ادعُ صديقاً للتطبيق واحصل على شهر اشتراك مجاني لك وله!', icon: '🎁' },
        { category: 'marketing', title: 'باقة التوفير', body: 'وفر أكثر مع باقة التوفير العائلية الجديدة. اشترك الآن.', icon: '👨‍👩‍👧‍👦' },

        // Alerts & Security
        { category: 'alerts', title: 'تنبيه أمني', body: 'تم تسجيل دخول جديد إلى حسابك من جهاز غير معروف. يرجى التحقق فوراً.', icon: '🔒' },
        { category: 'alerts', title: 'نسخ احتياطي', body: 'تذكير هام: قم بعمل نسخة احتياطية لبياناتك الآن لضمان عدم فقدانها.', icon: '☁️' },
        { category: 'alerts', title: 'تجاوز الميزانية', body: 'تنبيه: لقد تجاوزت الحد المسموح به لميزانية "الطعام" لهذا الشهر.', icon: '⚠️' },
        { category: 'alerts', title: 'فواتير مستحقة', body: 'تذكير: لديك فواتير مستحقة السداد قريباً. يرجى المراجعة.', icon: '🧾' },
        { category: 'alerts', title: 'انتهاء الاشتراك', body: 'سينتهي اشتراكك الحالي خلال 3 أيام. جدد الآن لتجنب انقطاع الخدمة.', icon: '⏳' },

        // Tips
        { category: 'tips', title: 'نصيحة مالية', body: 'القاعدة الذهبية: ادخر ما لا يقل عن 20% من دخلك الشهري للمستقبل.', icon: '💡' },
        { category: 'tips', title: 'تتبع المصاريف', body: 'تسجيل المصاريف الصغيرة يومياً يساعدك على فهم أين يذهب مالك.', icon: '📊' },
        { category: 'tips', title: 'صندوق الطوارئ', body: 'ابدأ ببناء صندوق للطوارئ يغطي مصاريف 3-6 أشهر.', icon: '💰' },
        { category: 'tips', title: 'الاستثمار', body: 'الاستثمار هو المفتاح لزيادة الثروة على المدى الطويل. ابدأ صغيراً.', icon: '🌱' },
        { category: 'tips', title: 'مراجعة دورية', body: 'خصص وقتاً أسبوعياً لمراجعة وضعك المالي وتعديل خطتك.', icon: '🔍' },
        { category: 'tips', title: 'تجنب الديون الاستهلاكية', body: 'لا تقترض لشراء ما يستهلك. الديون الجيدة للاستثمار فقط.', icon: '🚫' },
        { category: 'tips', title: 'وضع ميزانية', body: 'حدد مسبقاً أين يذهب كل ريال. الميزانية تحررك ولا تقيدك.', icon: '📋' },
        { category: 'tips', title: 'التوفير التلقائي', body: 'اجعل التوفير يحدث تلقائياً عند صرف الراتب قبل أي إنفاق.', icon: '⚙️' },
        { category: 'tips', title: 'تأجيل المتعة', body: 'انتظر 24 ساعة قبل أي شراء غير مخطط. ستتجنب الكثير من النفقات.', icon: '⏸️' },
        { category: 'tips', title: 'تنويع الدخل', body: 'لا تعتمد على مصدر دخل واحد. ابحث عن دخل إضافي أو استثمار جانبي.', icon: '🔄' },
        { category: 'tips', title: 'التعليم المالي', body: 'استثمر في تعليمك المالي. كتاب أو دورة واحدة قد تغير مستقبلك.', icon: '📚' },
        { category: 'tips', title: 'تقليل الاشتراكات', body: 'راجع اشتراكاتك الشهرية. ألغِ ما لا تستخدمه بانتظام.', icon: '✂️' },
        { category: 'tips', title: 'الأهداف المالية', body: 'ضع أهدافاً واضحة وقابلة للقياس: قصيرة ومتوسطة وطويلة المدى.', icon: '🎯' },
        { category: 'tips', title: 'الشراء بوعي', body: 'اسأل نفسك: هل أحتاج هذا أم أريده؟ الفرق يوفر لك الكثير.', icon: '🤔' },
        { category: 'tips', title: 'الاحتفال بالتوفير', body: 'احتفل بكل هدف توفير تحققه. التحفيز يساعد على الاستمرار.', icon: '🎉' },
        { category: 'tips', title: 'قاعدة 50/30/20', body: '50% للاحتياجات، 30% للرغبات، 20% للتوفير والاستثمار. قاعدة بسيطة وفعالة.', icon: '📐' },
        { category: 'tips', title: 'شراء الجودة', body: 'الأغلى أحياناً أوفر. الجودة تدوم وتقلل الاستبدال المتكرر.', icon: '⭐' },
        { category: 'tips', title: 'قائمة التسوق', body: 'اذهب للسوق بقائمة ولا تشترِ خارجها. يقلل الشراء الاندفاعي.', icon: '🛒' },
        { category: 'tips', title: 'الفائدة المركبة', body: 'ابدأ الادخار والاستثمار مبكراً. الفائدة المركبة تصنع المعجزات مع الزمن.', icon: '📈' },
        { category: 'tips', title: 'تأمين مستقبلك', body: 'التأمين الصحي والحياة يحميانك من صدمات مالية كبيرة. لا تهملهما.', icon: '🛡️' },
        { category: 'tips', title: 'سداد الديون بذكاء', body: 'ركز على سداد الأعلى فائدة أولاً مع الاستمرار في الحد الأدنى للباقي.', icon: '📉' },
        { category: 'tips', title: 'لا تتخذ قرارات مالية وأنت غاضب', body: 'الغضب والاندفاع يدفعان لخيارات ندم. انتظر وهدئ ثم قرر.', icon: '🧘' },
        { category: 'tips', title: 'مقارنة الأسعار', body: 'قبل أي شراء كبير قارن العروض والماركات. دقائق توفّر مئات الريالات.', icon: '🔎' },
        { category: 'tips', title: 'تجنب نمط الحياة المتصاعد', body: 'عند زيادة دخلك لا ترفع إنفاقك بنفس السرعة. وفر الفرق.', icon: '🪜' },
        { category: 'tips', title: 'الهدايا الذكية', body: 'هدية ذات معنى لا تعني إنفاقاً كبيراً. الفكرة أهم من السعر.', icon: '🎁' },
        { category: 'tips', title: 'الطعام في البيت', body: 'طبخك في البيت يوفر كثيراً ويضمن جودة وصحة أفضل.', icon: '🍳' },
        { category: 'tips', title: 'استخدام الكوبونات والعروض', body: 'استفد من العروض والكوبونات عند الشراء. لا عيب في التوفير.', icon: '🏷️' },
        { category: 'tips', title: 'فصل الحسابات', body: 'حساب للإنفاق اليومي وآخر للتوفير. الفصل يقلل الاستخدام العشوائي.', icon: '🏦' },
        { category: 'tips', title: 'التخطيط للتقاعد', body: 'كلما بدأت مبكراً في خطة التقاعد كان الرصيد أكبر عند التقاعد.', icon: '🌅' },
        { category: 'tips', title: 'تعليم الأطفال المال', body: 'علّم أطفالك الادخار والإنفاق الواعي منذ الصغر. عادة مدى الحياة.', icon: '👶' },
        { category: 'tips', title: 'عدم المتابعة مع الجيران', body: 'لا تنفق لمجرد اللحاق بغيرك. أهدافك ووضعك مختلفان.', icon: '🚶' },
        { category: 'tips', title: 'مراجعة الفواتير', body: 'راجع فواتيرك شهرياً. الأخطاء والاشتراكات المخفية تكلفك دون أن تدري.', icon: '📄' },
        { category: 'tips', title: 'الطوارئ أولاً', body: 'لا تستثمر أموالاً قد تحتاجها قريباً. السيولة للطوارئ ثم الاستثمار.', icon: '🆘' },
        { category: 'tips', title: 'الصدقة والإنفاق في الخير', body: 'الصدقة لا تنقص المال. البركة في المال تبدأ من إنفاق جزء فيه الخير.', icon: '🤲' },
        { category: 'tips', title: 'توثيق كل شيء', body: 'سجّل دخلك ومصروفاتك وعقودك. الوثائق تنقذك عند النزاع أو المراجعة.', icon: '📁' },
    ];

    const filteredTemplates = activeCategory === 'all'
        ? NOTIFICATION_TEMPLATES
        : NOTIFICATION_TEMPLATES.filter(t => t.category === activeCategory);

    const handleTemplateClick = (template: typeof NOTIFICATION_TEMPLATES[0]) => {
        setFormData({ ...formData, title: template.title, body: template.body });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const { data: apps = [] } = useQuery<App[]>({
        queryKey: ['apps'],
        queryFn: () => getApps({ active: true })
    });

    const sendMutation = useMutation({
        mutationFn: sendNotification,
        onSuccess: (data) => {
            toast.success(`تم إرسال الإشعار بنجاح إلى ${data.sent} جهاز`);
            setFormData({ title: '', body: '', appId: '', data: '' });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'فشل في إرسال الإشعار');
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        let parsedData = {};
        if (formData.data) {
            try {
                parsedData = JSON.parse(formData.data);
            } catch (err) {
                toast.error('بيانات JSON غير صالحة');
                return;
            }
        }

        sendMutation.mutate({
            title: formData.title,
            body: formData.body,
            appId: formData.appId || undefined,
            data: parsedData
        });
    };

    const containerVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8 pb-12"
        >
            <header>
                <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300">
                    إرسال الإشعارات
                </h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-lg mt-2">
                    إرسال تنبيهات للمستخدمين عبر التطبيقات
                </p>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="xl:col-span-1">
                    <div className="glass-card p-6 border border-white/20 sticky top-24">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                            <Send className="w-5 h-5 text-blue-600" />
                            بيانات الإشعار
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    التطبيق المستهدف
                                </label>
                                <select
                                    value={formData.appId}
                                    onChange={(e) => setFormData({ ...formData, appId: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
                                >
                                    <option value="">جميع التطبيقات</option>
                                    {apps.map((app) => (
                                        <option key={app._id} value={app._id}>
                                            {app.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    عنوان الإشعار <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
                                    placeholder="مثال: تحديث جديد متوفر"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    نص الإشعار <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    required
                                    rows={4}
                                    value={formData.body}
                                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all dark:text-white resize-none"
                                    placeholder="اكتب نص الرسالة هنا..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    بيانات إضافية (JSON)
                                </label>
                                <textarea
                                    rows={2}
                                    value={formData.data}
                                    onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all dark:text-white font-mono text-xs"
                                    placeholder='{"key": "value"}'
                                />
                            </div>

                            <Button
                                type="submit"
                                variant="primary"
                                isLoading={sendMutation.isPending}
                                className="w-full py-3.5 text-base font-bold shadow-lg shadow-blue-500/20 rounded-xl flex items-center justify-center gap-2 mt-2"
                            >
                                <Send className="w-5 h-5" />
                                إرسال الإشعار
                            </Button>
                        </form>
                    </div>
                </div>

                {/* Templates Section */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white px-2">
                            قوالب جاهزة
                        </h2>
                    </div>

                    {/* Category Tabs */}
                    <div className="flex flex-wrap gap-2 pb-2">
                        {CATEGORIES.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => setActiveCategory(category.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${activeCategory === category.id
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                                    }`}
                            >
                                <category.icon className="w-4 h-4" />
                                {category.name}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredTemplates.map((template, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.2, delay: index * 0.05 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleTemplateClick(template)}
                                className="glass-card p-4 border border-white/10 cursor-pointer hover:border-blue-500/50 transition-all group bg-white/50 dark:bg-slate-800/50 hover:shadow-lg hover:shadow-blue-500/5"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="text-3xl bg-white dark:bg-slate-700 w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
                                        {template.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                                                {template.title}
                                            </h3>
                                            {template.category === 'occasions' && <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold">مناسبات</span>}
                                            {template.category === 'announcements' && <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">إعلان</span>}
                                            {template.category === 'marketing' && <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold">تسويق</span>}
                                            {template.category === 'alerts' && <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">تنبيه</span>}
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                            {template.body}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
