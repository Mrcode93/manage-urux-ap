import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { verifyLicense, bulkVerifyLicenses } from '../api/client';
import Button from '../components/Button';
import { toast } from 'react-hot-toast';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  DocumentTextIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface VerificationResult {
  device_id: string;
  is_valid: boolean;
  is_expired?: boolean;
  exists_in_db?: boolean;
  signature_valid?: boolean;
  error?: string;
  license?: any;
  verification_timestamp?: string;
}

export default function LicenseVerification() {
  const [singleLicense, setSingleLicense] = useState({
    license_data: '',
    signature: ''
  });
  const [bulkLicenses, setBulkLicenses] = useState('');
  const [singleResult, setSingleResult] = useState<VerificationResult | null>(null);
  const [bulkResults, setBulkResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');

  // Single license verification
  const singleVerifyMutation = useMutation({
    mutationFn: verifyLicense,
    onSuccess: (data) => {
      setSingleResult({
        device_id: data.license?.device_id || 'Unknown',
        is_valid: data.is_valid,
        is_expired: data.expired,
        license: data.license,
        verification_timestamp: data.verification_timestamp
      });
      toast.success('تم التحقق من الترخيص بنجاح');
    },
    onError: (error: any) => {
      setSingleResult({
        device_id: 'Unknown',
        is_valid: false,
        error: error.message
      });
      toast.error(error.message || 'فشل في التحقق من الترخيص');
    }
  });

  // Bulk license verification
  const bulkVerifyMutation = useMutation({
    mutationFn: bulkVerifyLicenses,
    onSuccess: (data) => {
      setBulkResults(data);
      toast.success(`تم التحقق من ${data.total_checked} ترخيص`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'فشل في التحقق من التراخيص');
    }
  });

  const handleSingleVerify = () => {
    if (!singleLicense.license_data.trim() || !singleLicense.signature.trim()) {
      toast.error('يرجى إدخال بيانات الترخيص والتوقيع');
      return;
    }

    try {
      const licenseData = JSON.parse(singleLicense.license_data);
      singleVerifyMutation.mutate({
        license_data: licenseData,
        signature: singleLicense.signature
      });
    } catch (error) {
      toast.error('بيانات الترخيص غير صالحة (JSON غير صحيح)');
    }
  };

  const handleBulkVerify = () => {
    if (!bulkLicenses.trim()) {
      toast.error('يرجى إدخال قائمة التراخيص');
      return;
    }

    try {
      const licenses = JSON.parse(bulkLicenses);
      if (!Array.isArray(licenses)) {
        throw new Error('البيانات يجب أن تكون مصفوفة');
      }
      bulkVerifyMutation.mutate(licenses);
    } catch (error) {
      toast.error('بيانات التراخيص غير صالحة (JSON غير صحيح)');
    }
  };

  const getStatusIcon = (result: VerificationResult) => {
    if (result.is_valid) {
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    } else if (result.is_expired) {
      return <ClockIcon className="h-5 w-5 text-yellow-500" />;
    } else {
      return <XCircleIcon className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusText = (result: VerificationResult) => {
    if (result.is_valid) return 'صالح';
    if (result.is_expired) return 'منتهي الصلاحية';
    if (result.error) return 'خطأ';
    return 'غير صالح';
  };

  const getStatusColor = (result: VerificationResult) => {
    if (result.is_valid) return 'text-green-700 bg-green-100 dark:bg-green-900 dark:text-green-200';
    if (result.is_expired) return 'text-yellow-700 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200';
    return 'text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">التحقق من التراخيص</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          تحقق من صحة وصلاحية التراخيص الرقمية
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('single')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'single'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            ترخيص واحد
          </button>
          <button
            onClick={() => setActiveTab('bulk')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'bulk'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            تراخيص متعددة
          </button>
        </nav>
      </div>

      {/* Single License Verification */}
      {activeTab === 'single' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              التحقق من ترخيص واحد
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  بيانات الترخيص (JSON)
                </label>
                <textarea
                  value={singleLicense.license_data}
                  onChange={(e) => setSingleLicense(prev => ({ ...prev, license_data: e.target.value }))}
                  rows={8}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono text-sm"
                  placeholder={`{
  "device_id": "device-123",
  "features": ["pos", "reports"],
  "type": "trial",
  "expires_at": "2024-12-31T23:59:59.999Z"
}`}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  يجب أن تكون البيانات بصيغة JSON صحيحة من ملف license.json
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  التوقيع الرقمي
                </label>
                <textarea
                  value={singleLicense.signature}
                  onChange={(e) => setSingleLicense(prev => ({ ...prev, signature: e.target.value }))}
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono text-sm"
                  placeholder="MEUCIQDxyz123... (Base64 encoded signature from license.json)"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  التوقيع الرقمي من حقل "signature" في ملف license.json
                </p>
              </div>

              <Button
                onClick={handleSingleVerify}
                isLoading={singleVerifyMutation.isPending}
                disabled={!singleLicense.license_data.trim() || !singleLicense.signature.trim()}
                className="w-full"
              >
                تحقق من الترخيص
              </Button>
            </div>
          </div>

          {/* Single Verification Result */}
          {singleResult && (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                نتيجة التحقق
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(singleResult)}
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        معرف الجهاز: {singleResult.device_id}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {singleResult.verification_timestamp && 
                          new Date(singleResult.verification_timestamp).toLocaleString('ar-IQ')
                        }
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(singleResult)}`}>
                    {getStatusText(singleResult)}
                  </span>
                </div>

                {singleResult.error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
                    <div className="flex">
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                      <div className="mr-3">
                        <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                          خطأ في التحقق
                        </h3>
                        <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                          {singleResult.error}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {singleResult.license && (
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      تفاصيل الترخيص
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">النوع:</span>
                        <span className="mr-2 text-gray-900 dark:text-white">{singleResult.license.type}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">تاريخ الانتهاء:</span>
                        <span className="mr-2 text-gray-900 dark:text-white">
                          {singleResult.license.expires_at 
                            ? new Date(singleResult.license.expires_at).toLocaleDateString('ar-IQ')
                            : 'غير محدد'
                          }
                        </span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="text-gray-500 dark:text-gray-400">الميزات:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {singleResult.license.features?.map((feature: string, index: number) => (
                          <span key={index} className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bulk License Verification */}
      {activeTab === 'bulk' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              التحقق من تراخيص متعددة
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  قائمة التراخيص (JSON Array)
                </label>
                <textarea
                  value={bulkLicenses}
                  onChange={(e) => setBulkLicenses(e.target.value)}
                  rows={12}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono text-sm"
                  placeholder='[{"license_data": {...}, "signature": "..."}, {"license_data": {...}, "signature": "..."}]'
                />
              </div>

              <Button
                onClick={handleBulkVerify}
                isLoading={bulkVerifyMutation.isPending}
                disabled={!bulkLicenses.trim()}
                className="w-full"
              >
                تحقق من جميع التراخيص
              </Button>
            </div>
          </div>

          {/* Bulk Verification Results */}
          {bulkResults && (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                نتائج التحقق المجمع
              </h3>
              
              <div className="space-y-4">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {bulkResults.total_checked}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">إجمالي المفحوص</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {bulkResults.valid_count}
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400">صالح</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">
                      {bulkResults.invalid_count}
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-400">غير صالح</p>
                  </div>
                </div>

                {/* Results List */}
                <div className="space-y-2">
                  {bulkResults.results.map((result: VerificationResult, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(result)}
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {result.device_id}
                          </p>
                          {result.error && (
                            <p className="text-xs text-red-600 dark:text-red-400">
                              {result.error}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(result)}`}>
                        {getStatusText(result)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}