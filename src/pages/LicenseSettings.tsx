import { useState } from 'react';
import Button from '../components/Button';

interface LicenseFeature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

const DEFAULT_FEATURES: LicenseFeature[] = [
  {
    id: 'feature1',
    name: 'الميزة 1',
    description: 'وصف الميزة 1',
    enabled: true,
  },
  {
    id: 'feature2',
    name: 'الميزة 2',
    description: 'وصف الميزة 2',
    enabled: true,
  },
  {
    id: 'feature3',
    name: 'الميزة 3',
    description: 'وصف الميزة 3',
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

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            إعدادات الترخيص
          </h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            تكوين ميزات الترخيص والإعدادات.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <form onSubmit={handleSave}>
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                ميزات الترخيص
              </h3>
              <div className="space-y-4">
                {features.map((feature) => (
                  <div
                    key={feature.id}
                    className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          type="checkbox"
                          checked={feature.enabled}
                          onChange={() => toggleFeature(feature.id)}
                          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700"
                        />
                      </div>
                      <div className="mr-3">
                        <label className="text-sm font-medium text-gray-900 dark:text-white">
                          {feature.name}
                        </label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 text-left sm:px-6 rounded-b-lg">
              <Button type="submit" isLoading={isSaving}>
                حفظ التغييرات
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 