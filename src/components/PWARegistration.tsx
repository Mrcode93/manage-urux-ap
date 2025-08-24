import { useEffect, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';
import { toast } from 'react-hot-toast';
import { 
  ArrowDownTrayIcon, 
  ArrowPathIcon, 
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DevicePhoneMobileIcon,
  ShareIcon
} from '@heroicons/react/24/outline';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface UpdateSW {
  needRefresh: boolean;
  offlineReady: boolean;
  update: () => void;
}

export default function PWARegistration() {
  const [updateSW, setUpdateSW] = useState<UpdateSW | null>(null);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check device type and installation status
    const checkDeviceAndInstallation = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
                              (window.navigator as any).standalone === true;
      
      setIsIOS(isIOSDevice);
      setIsStandalone(isStandaloneMode);
      
      console.log('Device check:', { isIOS: isIOSDevice, isStandalone: isStandaloneMode });
      
      return { isIOS: isIOSDevice, isStandalone: isStandaloneMode };
    };

    // Register service worker
    const updateSW = registerSW({
      onNeedRefresh() {
        setUpdateSW(updateSW);
        setShowUpdatePrompt(true);
        toast.success('يتوفر تحديث جديد للتطبيق', {
          icon: '🔄',
          duration: 5000,
        });
      },
      onOfflineReady() {
        toast.success('التطبيق جاهز للعمل بدون إنترنت', {
          icon: '✅',
          duration: 3000,
        });
      },
      onRegistered(swRegistration: any) {
        console.log('Service Worker registered:', swRegistration);
      },
      onRegisterError(error: any) {
        console.error('Service Worker registration error:', error);
      },
    });

    // Handle install prompt (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('beforeinstallprompt event fired');
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      
      // Show install prompt for Android devices
      const { isIOS: ios } = checkDeviceAndInstallation();
      if (!ios) {
        setShowInstallPrompt(true);
        console.log('Install prompt deferred and UI shown for Android');
      }
    };

    // Handle app installed
    const handleAppInstalled = () => {
      console.log('App installed event fired');
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      setIsInstalling(false);
      toast.success('تم تثبيت التطبيق بنجاح!', {
        icon: '🎉',
        duration: 3000,
      });
    };

    // Initial check
    const { isStandalone } = checkDeviceAndInstallation();
    if (isStandalone) {
      console.log('App is already installed (standalone mode)');
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    } else {
      // For iOS, show install prompt after a delay
      const { isIOS: ios } = checkDeviceAndInstallation();
      if (ios) {
        setTimeout(() => {
          setShowInstallPrompt(true);
          console.log('Showing iOS install prompt');
        }, 3000); // Show after 3 seconds
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleUpdate = () => {
    if (updateSW) {
      updateSW.update();
      setShowUpdatePrompt(false);
      toast.success('جاري تحديث التطبيق...', {
        icon: '🔄',
        duration: 2000,
      });
    }
  };

  const handleInstall = async () => {
    if (isIOS) {
      // For iOS, show detailed instructions
      showIOSInstallInstructions();
      return;
    }

    if (!deferredPrompt) {
      console.error('No deferred prompt available');
      toast.error('لا يمكن تثبيت التطبيق في الوقت الحالي');
      return;
    }

    setIsInstalling(true);
    console.log('Attempting to show install prompt...');

    try {
      // Show the install prompt
      await deferredPrompt.prompt();
      console.log('Install prompt shown successfully');

      // Wait for user choice
      const { outcome } = await deferredPrompt.userChoice;
      console.log('User choice:', outcome);

      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        toast.success('جاري تثبيت التطبيق...', {
          icon: '📱',
          duration: 2000,
        });
        // The appinstalled event will handle the rest
      } else {
        console.log('User dismissed the install prompt');
        toast.success('تم إلغاء التثبيت', {
          icon: 'ℹ️',
          duration: 2000,
        });
        setShowInstallPrompt(false);
        setDeferredPrompt(null);
      }
    } catch (error) {
      console.error('Error showing install prompt:', error);
      toast.error('حدث خطأ أثناء التثبيت');
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    } finally {
      setIsInstalling(false);
    }
  };

  const showIOSInstallInstructions = () => {
    const instructions = `
📱 تثبيت التطبيق على iPhone/iPad:

1️⃣ اضغط على زر المشاركة (Share) في المتصفح
   • في Safari: اضغط على مربع مع سهم 📤
   • في Chrome: اضغط على ثلاث نقاط ⋯ ثم "مشاركة"

2️⃣ اختر "إضافة إلى الشاشة الرئيسية" 
   • Add to Home Screen

3️⃣ اضغط "إضافة" (Add)

✅ سيظهر التطبيق على الشاشة الرئيسية
    `;
    
    alert(instructions);
    setShowInstallPrompt(false);
  };

  const dismissUpdate = () => {
    setShowUpdatePrompt(false);
  };

  const dismissInstall = () => {
    setShowInstallPrompt(false);
    setDeferredPrompt(null);
  };

  if (!showUpdatePrompt && !showInstallPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 space-y-3 max-w-md mx-auto">
      {/* Backdrop for better contrast */}
      <div className="absolute inset-0 bg-black/20 dark:bg-black/40 rounded-lg backdrop-blur-sm"></div>
      
      {/* Update Prompt */}
      {showUpdatePrompt && (
        <div className="bg-white dark:bg-gray-800 border-2 border-blue-500 dark:border-blue-400 rounded-lg p-4 shadow-xl relative overflow-hidden">
          {/* Animated border effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 opacity-20 animate-pulse"></div>
          
          <div className="flex items-start relative z-10">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <ArrowPathIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mr-3 flex-1">
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                تحديث متوفر
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                يتوفر إصدار جديد من التطبيق. انقر على "تحديث" لتطبيق التحديثات.
              </p>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <button
                onClick={handleUpdate}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                تحديث
              </button>
              <button
                onClick={dismissUpdate}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Install Prompt */}
      {showInstallPrompt && (
        <div className="bg-white dark:bg-gray-800 border-2 border-green-500 dark:border-green-400 rounded-lg p-4 shadow-xl relative overflow-hidden">
          {/* Animated border effect matching the icon gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-700 to-green-500 opacity-20 animate-pulse"></div>
          
          <div className="flex items-start relative z-10">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 rounded-full flex items-center justify-center">
                {isIOS ? (
                  <DevicePhoneMobileIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                ) : (
                  <ArrowDownTrayIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                )}
              </div>
            </div>
            <div className="mr-3 flex-1">
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                {isIOS ? 'تثبيت على iPhone/iPad' : 'تثبيت التطبيق'}
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {isIOS 
                  ? 'يمكنك تثبيت هذا التطبيق على الشاشة الرئيسية للوصول السريع.'
                  : 'يمكنك تثبيت هذا التطبيق على جهازك للوصول السريع.'
                }
              </p>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <button
                onClick={handleInstall}
                disabled={isInstalling}
                className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isInstalling ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    جاري...
                  </>
                ) : isIOS ? (
                  <>
                    <ShareIcon className="h-4 w-4" />
                    تثبيت
                  </>
                ) : (
                  'تثبيت'
                )}
              </button>
              <button
                onClick={dismissInstall}
                disabled={isInstalling}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
