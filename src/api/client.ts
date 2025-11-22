import axios, { AxiosError } from 'axios';

// npmConfiguration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://urcash.up.railway.app';
// const API_BASE_URL = 'http://localhost:3002';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for logging
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_data');
      window.location.href = '/#/login';
    }
    return Promise.reject(error);
  }
);

// Types
export interface Feature {
  _id: string;
  name: string;
  description: string;
  category: 'basic' | 'advanced' | 'premium' | 'enterprise';
  version?: string;
  dependencies?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  app?: {
    _id: string;
    name: string;
    icon: string;
  };
}

export interface UpdateFeatureData {
  name?: string;
  description?: string;
  category?: 'basic' | 'advanced' | 'premium' | 'enterprise';
  version?: string;
  dependencies?: string[];
  is_active?: boolean;
  app_id?: string;
}

export interface Plan {
  _id: string;
  name: string;
  description: string;
  features: string[];
  duration_days?: number;
  price: number;
  currency: string;
  plan_type: 'trial' | 'basic' | 'premium' | 'enterprise';
  max_devices: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ActivationCode {
  _id: string;
  code: string;
  features: string[];
  type: string;
  expires_at?: string;
  max_uses: number;
  current_uses: number;
  used: boolean;
  created_by: string;
  created_at: string;
  app?: {
    _id: string;
    name: string;
    icon: string;
  };
}

export interface License {
  device_id: string;
  features: string[];
  type: string;
  expires_at?: string;
  issued_at: string;
  signature: string;
  is_active: boolean;
}

export interface Device {
  _id: string;
  device_id: string;
  ip: string;
  location: string | { country?: string; city?: string; timezone?: string };
  location_data: {
    success: boolean;
    coordinates: {
      lat: number;
      lng: number;
    };
    formatted_address: string;
    address_components: {
      neighbourhood?: string;
      city?: string;
      subdistrict?: string;
      district?: string;
      state?: string;
      country?: string;
      country_code?: string;
      postcode?: string;
    };
    source: string;
    city?: string;
    country?: string;
    region?: string;
  } | null;
  activated_at: string;
  user?: any;
  license: License;
}

export interface Backup {
  id?: string;
  filename: string;
  size: number;
  createdAt: Date;
  modifiedAt: Date;
  path?: string;
  location?: string;
  s3Key?: string;
  s3Url?: string;
  storageType?: 'local' | 's3';
  database?: string;
  backupType?: 'full' | 'incremental' | 'differential';
  version?: string;
  backupName?: string;
  description?: string;
  collections?: Array<{
    name: string;
    path: string;
  }>;
  metadata?: any;
}

export interface BackupStats {
  totalBackups: number;
  totalSize: number;
  totalSizeFormatted: string;
  oldestBackup: Date | null;
  newestBackup: Date | null;
  averageSize: number;
  averageSizeFormatted: string;
  backupLocation: string;
}

export interface BackupLocation {
  name: string;
  path: string;
  type: 'default' | 'system' | 'custom';
}

export interface UserBackup {
  _id: string;
  user: {
    _id: string;
    username: string;
    password?: string;
    passwordDisplay?: string;
    isPasswordHashed?: boolean;
    device_id?: string;
    created_at?: string;
  };
  device_id: string;
  filename: string;
  originalName: string;
  size: number;
  backupName: string;
  description: string;
  fileType: string;
  uploadedAt: string;
  createdAt: string;
  fileExists: boolean;
  fileStats?: {
    size: number;
    created: string;
    modified: string;
  };
  validation?: {
    isValid: boolean;
    type: string;
  };
  downloadUrl?: string;
  // S3 Integration fields
  s3Key?: string;
  s3Url?: string;
  storageType?: 'local' | 's3';
  path?: string;
}

// License Management API
export const firstActivation = async (params: {
  device_id: string;
  location?: string;
  ip_address?: string;
}) => {
  try {
    const response = await api.post('/first-activation', params);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const activateDevice = async (params: {
  device_id: string;
  activation_code?: string;
  location?: string;
  ip_address?: string;
}) => {
  try {
    const response = await api.post('/activate', params);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getLicense = async (deviceId: string): Promise<License> => {
  try {
    const response = await api.get(`/license/${deviceId}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const validateLicense = async (params: {
  license_data: any;
  signature: string;
}) => {
  try {
    const response = await api.post('/api/license/validate', params);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const revokeLicense = async (deviceId: string, reason: string) => {
  try {
    const response = await api.post(`/api/license/${deviceId}/revoke`, { reason });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const extendLicense = async (deviceId: string, days: number) => {
  try {
    const response = await api.post(`/api/license/${deviceId}/extend`, { days });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Activation Codes API
export const generateActivationCode = async (params: {
  type: 'lifetime' | 'custom' | 'custom-lifetime' | 'first-activation';
  features?: string[];
  expires_in_days?: number;
  app_id?: string;
}) => {
  try {
    const response = await api.post('/api/generate-code', params);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getActivationCodes = async (): Promise<ActivationCode[]> => {
  try {
    const response = await api.get('/api/activation-codes');
    // Ensure we always return an array
    const data = response.data;
    if (Array.isArray(data)) {
      return data;
    }
    // If data has a nested array property, try to extract it
    if (data && Array.isArray(data.data)) {
      return data.data;
    }
    if (data && Array.isArray(data.codes)) {
      return data.codes;
    }
    // If no array found, return empty array
    console.warn('getActivationCodes: Expected array but got:', data);
    return [];
  } catch (error) {
    console.error('Error fetching activation codes:', error);
    // Return empty array on error to prevent filter errors
    return [];
  }
};

export const validateActivationCode = async (code: string) => {
  try {
    const response = await api.post('/api/validate-code', { code });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const deleteActivationCode = async (id: string) => {
  try {
    const response = await api.delete(`/api/activation-codes/${id}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Features Management API
export const createFeature = async (data: {
  name: string;
  description: string;
  category?: string;
  version?: string;
  dependencies?: string[];
  app_id?: string;
}): Promise<Feature> => {
  try {
    const response = await api.post('/api/features', data);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getFeatures = async (params?: {
  active?: boolean;
  category?: string;
  app_id?: string;
}): Promise<Feature[]> => {
  try {
    const response = await api.get('/api/features', { params });
    const data = response.data.data || response.data;
    // Ensure we always return an array
    if (Array.isArray(data)) {
      return data;
    }
    // If data has a nested array property, try to extract it
    if (data && Array.isArray(data.features)) {
      return data.features;
    }
    // If no array found, return empty array
    console.warn('getFeatures: Expected array but got:', data);
    return [];
  } catch (error) {
    console.error('Error fetching features:', error);
    // Return empty array on error to prevent reduce/filter errors
    return [];
  }
};

export const updateFeature = async (id: string, data: UpdateFeatureData): Promise<Feature> => {
  try {
    const response = await api.put(`/api/features/${id}`, data);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const deleteFeature = async (id: string): Promise<void> => {
  try {
    await api.delete(`/api/features/${id}`);
  } catch (error) {
    throw handleApiError(error);
  }
};

// Plans Management API
export const createPlan = async (data: {
  name: string;
  description: string;
  features: string[];
  duration_days?: number;
  price: number;
  currency?: string;
  plan_type: string;
  max_devices?: number;
}): Promise<Plan> => {
  try {
    const response = await api.post('/api/plans', data);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getPlans = async (params?: {
  active?: boolean;
  type?: string;
  min_price?: number;
  max_price?: number;
}): Promise<Plan[]> => {
  try {
    const response = await api.get('/api/plans', { params });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const updatePlan = async (id: string, data: Partial<Plan>): Promise<Plan> => {
  try {
    const response = await api.put(`/api/plans/${id}`, data);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const deletePlan = async (id: string): Promise<void> => {
  try {
    await api.delete(`/api/plans/${id}`);
  } catch (error) {
    throw handleApiError(error);
  }
};

// Updates API - S3 Update System
export interface Update {
  _id: string;
  platform: string;
  version: string;
  app?: {
    _id: string;
    name: string;
    description?: string;
    icon?: string;
  } | null;
  fileName: string;
  fileSize: number;
  url: string;
  s3Key?: string;
  uploadMethod: string;
  description?: string;
  releaseNotes?: string;
  changelog?: string;
  isActive?: boolean;
  downloadCount?: number;
  checksum?: string;
  metadataUrl?: string;
  createdAt: string;
  updatedAt: string;
  lastModified?: string;
}

export interface UpdateUploadData {
  platform: string;
  version: string;
  appId?: string | null;
  description?: string;
  releaseNotes?: string;
  changelog?: string;
  deleteOld?: boolean;
}

export interface BatchUpdateOperation {
  platform: string;
  version: string;
}

export interface TauriUpdateJson {
  latestVersion: string;
  changelog: string;
  windows: string | null;
  mac: string | null;
  linux?: string | null;
  minRequired: string;
}

// Get updates (supports filtering by platform, appId, and isActive)
export const getUpdates = async (params?: {
  platform?: string;
  appId?: string;
  isActive?: boolean;
}): Promise<Update[]> => {
  try {
    const response = await api.get('/api/s3-updates/list', { params });
    return response.data.updates || [];
  } catch (error) {
    throw handleApiError(error);
  }
};

// Upload update to S3
export const uploadUpdate = async (formData: FormData) => {
  try {
    const response = await api.post('/api/s3-updates/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 1800000, // 30 minutes timeout for very large files
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload progress: ${percentCompleted}%`);
        }
      },
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Get update statistics
export const getUpdateStats = async (appId?: string) => {
  try {
    const response = await api.get('/api/s3-updates/stats', {
      params: appId ? { appId } : {}
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Delete update
export const deleteUpdate = async (platform: string, version: string) => {
  try {
    const response = await api.delete(`/api/s3-updates/${platform}/${version}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Download update
export const downloadUpdate = async (platform: string, version: string): Promise<Blob> => {
  try {
    console.log(`📥 Starting download for ${platform} v${version}`);

    const response = await api.get(`/api/s3-updates/download/${platform}/${version}`, {
      responseType: 'blob',
      timeout: 600000, // 10 minutes timeout for large files
      onDownloadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Download progress: ${percentCompleted}%`);
        }
      }
    });

    console.log(`✅ Download completed, response size: ${response.data?.size || 'unknown'}`);

    // Verify the response is actually a blob
    if (!(response.data instanceof Blob)) {
      console.error('❌ Invalid response format:', typeof response.data);
      throw new Error('Invalid response format - expected file data');
    }

    // Verify blob has content
    if (response.data.size === 0) {
      throw new Error('Downloaded file is empty');
    }

    console.log(`✅ Blob verified: ${response.data.size} bytes`);
    return response.data;

  } catch (error: unknown) {
    console.error('❌ Download failed:', error);

    // If the API download fails, try direct S3 download as fallback
    if (error && typeof error === 'object' && 'response' in error && 'message' in error) {
      const axiosError = error as any;
      if (axiosError.response?.status === 200 && axiosError.message?.includes('ERR_FAILED')) {
        console.log('🔄 Trying direct S3 download as fallback...');
        try {
          // Get the update to find the S3 URL
          const updates = await getUpdates();
          const update = updates.find(u => u.platform === platform && u.version === version);

          if (update && update.url) {
            console.log('🔄 Trying direct S3 download from:', update.url);

            // Create a temporary link element to trigger download
            const link = document.createElement('a');
            link.href = update.url;
            link.download = update.fileName || `${platform}-v${version}`;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';

            // Append to body, click, and remove
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            console.log('✅ Direct S3 download initiated via browser');

            // Return a minimal blob to indicate success
            return new Blob(['Direct download initiated'], { type: 'text/plain' });
          }
          throw new Error('No S3 URL available for direct download');
        } catch (directError: unknown) {
          console.error('❌ Direct S3 download also failed:', directError);
          const directErrorMessage = directError instanceof Error ? directError.message : 'Unknown error';
          const axiosErrorMessage = axiosError.message || 'Unknown error';
          throw new Error(`Download failed: ${axiosErrorMessage}. Direct S3 download also failed: ${directErrorMessage}`);
        }
      }
    }

    throw handleApiError(error);
  }
};

// Get latest update for a platform
export const getLatestUpdate = async (platform: string, currentVersion?: string, appId?: string) => {
  try {
    const response = await api.get(`/api/s3-updates/latest/${platform}`, {
      params: { version: currentVersion, appId }
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Sync updates from S3
export const syncUpdates = async (platform?: string, appId?: string) => {
  try {
    const response = await api.post('/api/s3-updates/sync', null, {
      params: { platform, appId }
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Get upload progress from server
export const getUploadProgress = async (platform: string, version: string) => {
  try {
    const response = await api.get('/api/s3-updates/progress', {
      params: { platform, version }
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Batch delete updates
export const batchDeleteUpdates = async (updates: BatchUpdateOperation[]) => {
  try {
    const response = await api.post('/api/s3-updates/batch/delete', { updates });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Batch activate updates
export const batchActivateUpdates = async (updates: BatchUpdateOperation[]) => {
  try {
    const response = await api.post('/api/s3-updates/batch/activate', { updates });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Batch deactivate updates
export const batchDeactivateUpdates = async (updates: BatchUpdateOperation[]) => {
  try {
    const response = await api.post('/api/s3-updates/batch/deactivate', { updates });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Get Tauri update JSON
export const getTauriUpdateJson = async (appSlug: string, minRequired?: string): Promise<TauriUpdateJson> => {
  try {
    const response = await api.get(`/api/s3-updates/check/${appSlug}/update.json`, {
      params: minRequired ? { minRequired } : {}
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Update metadata
export const updateMetadata = async (platform: string, version: string, metadata: {
  description?: string;
  releaseNotes?: string;
  changelog?: string;
}) => {
  try {
    const response = await api.put(`/api/s3-updates/metadata/${platform}/${version}`, metadata);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// S3 upload with progress tracking
export const uploadUpdateToS3 = async (file: File, platform: string, version: string, onProgress?: (progress: number) => void) => {
  try {
    const formData = new FormData();
    formData.append('platform', platform);
    formData.append('version', version);
    formData.append('updateFile', file);

    const response = await api.post('/api/updates/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 600000, // 10 minutes timeout for large files
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress?.(percentCompleted);
          console.log(`S3 Upload progress: ${percentCompleted}%`);
        }
      },
    });

    return response.data;

  } catch (error) {
    // Provide better error messages
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorCode = (error as any)?.code;
    const errorResponse = (error as any)?.response;

    if (errorCode === 'ECONNABORTED' || errorMessage.includes('timeout')) {
      throw new Error('انتهت مهلة التحميل. يرجى المحاولة مرة أخرى مع اتصال أفضل.');
    } else if (errorResponse?.status === 413) {
      throw new Error('الملف كبير جداً. الحد الأقصى هو 2GB.');
    } else if (errorResponse?.data?.error) {
      throw new Error(errorResponse.data.error);
    } else {
      throw new Error(errorMessage || 'فشل في رفع الملف إلى S3');
    }
  }
};

export const getUpdateMetadata = async (platform: string, version: string) => {
  try {
    const response = await api.get(`/api/updates/metadata/${platform}/${version}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const updateUpdateMetadata = async (platform: string, version: string, metadata: any) => {
  try {
    const response = await api.put(`/api/updates/metadata/${platform}/${version}`, metadata);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// System Management API
export const getActivatedDevices = async (): Promise<Device[]> => {
  try {
    // Add cache-busting parameter to ensure fresh data
    const timestamp = Date.now();
    const response = await api.get(`/api/devices?t=${timestamp}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getSystemHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getLicenseStats = async () => {
  try {
    const response = await api.get('/api/license/stats');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getCodeStats = async () => {
  try {
    const response = await api.get('/api/generate-code/stats');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// License Verification API
export const verifyLicense = async (params: {
  license_data: any;
  signature: string;
}) => {
  try {
    const response = await api.post('/verify-license', params);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const bulkVerifyLicenses = async (licenses: Array<{
  license_data: any;
  signature: string;
}>) => {
  try {
    const response = await api.post('/bulk-verify-licenses', { licenses });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Backup Management API
export const createBackup = async (backupPath?: string): Promise<Backup> => {
  try {
    const response = await api.post('/api/backup', { backupPath }, {
      timeout: 120000 // 2 minutes timeout for backup creation
    });
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getBackups = async (backupPath?: string): Promise<Backup[]> => {
  try {
    const response = await api.get('/api/backup', { params: { path: backupPath } });
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getBackupStats = async (backupPath?: string): Promise<BackupStats> => {
  try {
    const response = await api.get('/api/backup/stats', { params: { path: backupPath } });
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getBackupLocations = async (): Promise<BackupLocation[]> => {
  try {
    const response = await api.get('/api/backup/locations');
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const downloadBackup = async (filename: string, backupPath?: string): Promise<Blob> => {
  try {
    const response = await api.get(`/api/backup/${filename}/download`, {
      responseType: 'blob',
      params: { path: backupPath }
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const deleteBackup = async (filename: string, backupPath?: string): Promise<void> => {
  try {
    await api.delete(`/api/backup/${filename}`, { params: { path: backupPath } });
  } catch (error) {
    throw handleApiError(error);
  }
};

export const restoreBackup = async (filename: string, backupPath?: string): Promise<void> => {
  try {
    await api.post(`/api/backup/${filename}/restore`, {}, { params: { path: backupPath } });
  } catch (error) {
    throw handleApiError(error);
  }
};

// User Backup Management API
export const getAllUserBackups = async (): Promise<UserBackup[]> => {
  try {
    const response = await api.get('/api/user-backup/all');
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const downloadUserBackup = async (backupId: string): Promise<Blob> => {
  try {
    const response = await api.get(`/api/user-backup/download/${backupId}`, {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const deleteUserBackup = async (backupId: string): Promise<void> => {
  try {
    await api.delete(`/api/user-backup/${backupId}`);
  } catch (error) {
    throw handleApiError(error);
  }
};

export const resetUserPassword = async (userId: string): Promise<{ newPassword: string }> => {
  try {
    const response = await api.post(`/users/${userId}/reset-password`);
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Helper function for auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('admin_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

// Authentication API
export interface AdminUser {
  _id: string;
  username: string;
  name: string;
  role: string;
  permissions: string[];
  lastLogin?: string;
  createdAt: string;
  isActive: boolean;
}

export interface AdminActivity {
  id: string;
  adminId: string;
  adminUsername: string;
  adminName: string;
  adminRole: string;
  action: string;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: {
    method?: string;
    path?: string;
    statusCode?: number;
    responseTime?: string;
    userAgent?: string;
    referer?: string;
    contentLength?: string;
    requestBody?: any;
    queryParams?: any;
    pathParams?: any;
  };
  timestamp: string;
}

export interface ActivityStats {
  totalActivities: number;
  totalAdmins: number;
  actionStats: Record<string, number>;
  hourlyStats: Record<string, number>;
  dailyStats: Record<string, number>;
  adminStats: Array<{
    id: string;
    username: string;
    name: string;
    role: string;
    totalActivities: number;
    actions: Record<string, number>;
  }>;
}

export interface LogsResponse {
  activities: AdminActivity[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    admin: AdminUser;
    token: string;
  };
}

export interface ProfileUpdateData {
  username?: string;
  name?: string;
  currentPassword?: string;
  newPassword?: string;
}

export const adminLogin = async (username: string, password: string): Promise<LoginResponse> => {
  try {
    const response = await api.post('/api/admin/login', { username, password });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getAdminProfile = async (): Promise<AdminUser> => {
  try {
    const response = await api.get('/api/admin/profile');
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const updateAdminProfile = async (data: ProfileUpdateData): Promise<AdminUser> => {
  try {
    const response = await api.put('/api/admin/profile', data);
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const adminLogout = async (): Promise<void> => {
  try {
    await api.post('/api/admin/logout');
  } catch (error) {
    // Don't throw error for logout, just log it
    console.warn('Logout error:', error);
  }
};

// Refresh token API
export const refreshAdminToken = async (): Promise<{ token: string }> => {
  try {
    const response = await api.post('/api/admin/refresh-token');
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Admin User Management API
export interface CreateUserData {
  username: string;
  name: string;
  password: string;
  role: string;
  permissions: string[];
}

export interface UpdateUserData {
  name?: string;
  role?: string;
  permissions?: string[];
  password?: string;
}

export const getAllAdminUsers = async (): Promise<AdminUser[]> => {
  try {
    const response = await api.get('/api/admin/users');
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getAdminUserById = async (id: string): Promise<AdminUser> => {
  try {
    const response = await api.get(`/api/admin/users/${id}`);
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const createAdminUser = async (data: CreateUserData): Promise<AdminUser> => {
  try {
    const response = await api.post('/api/admin/users', data);
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const updateAdminUser = async (id: string, data: UpdateUserData): Promise<AdminUser> => {
  try {
    const response = await api.put(`/api/admin/users/${id}`, data);
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const deleteAdminUser = async (id: string): Promise<void> => {
  try {
    await api.delete(`/api/admin/users/${id}`);
  } catch (error) {
    throw handleApiError(error);
  }
};

export const toggleAdminUserStatus = async (id: string, isActive: boolean): Promise<AdminUser> => {
  try {
    const response = await api.put(`/api/admin/users/${id}/toggle-status`, { isActive });
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// User Information API
export interface User {
  _id: string;
  username: string;
  password?: string;
  passwordDisplay?: string;
  isPasswordHashed?: boolean;
  device_id?: string;
  created_at?: string;
  updated_at?: string;
}

export const getAllUsers = async (): Promise<User[]> => {
  try {
    const response = await api.get('/api/users');
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getUserById = async (userId: string): Promise<User> => {

  try {
    const response = await api.get(`/api/users/${userId}`);

    return response.data.data;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw handleApiError(error);
  }
};

// Get user data with device_id by user ID using fetch
export const getUserWithDeviceById = async (userId: string): Promise<{
  _id: string;
  username: string;
  password: string;
  device_id: string;
  created_at: string;
}> => {

  const response = await fetch(`${API_BASE_URL}/api/users/${userId}/with-device`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    console.error('Failed to fetch user with device:', response.status, response.statusText);
    throw new Error('فشل في جلب بيانات المستخدم والجهاز');
  }

  const userData = await response.json();

  return userData.data || userData;
};

export const getDeviceIdByUserId = async (userId: string): Promise<{ user_id: string; username: string; device_id: string }> => {
  try {
    const response = await api.get(`/api/users/${userId}/device-id`);
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Error handling helper
const handleApiError = (error: unknown) => {
  if (error instanceof AxiosError) {
    // Handle network errors (connection refused, timeout, etc.)
    if (!error.response) {
      if (error.code === 'ECONNREFUSED' || error.message.includes('ERR_CONNECTION_REFUSED')) {
        throw new Error('لا يمكن الاتصال بالخادم. يرجى التحقق من اتصال الشبكة');
      }
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        throw new Error('انتهت مهلة الاتصال. يرجى المحاولة مرة أخرى');
      }
      throw new Error('خطأ في الشبكة. يرجى التحقق من اتصال الإنترنت');
    }

    const errorData = error.response?.data;
    if (errorData?.details) {
      // Handle both array and string cases
      let errorMessage: string;
      if (Array.isArray(errorData.details)) {
        errorMessage = errorData.details.map((d: any) => d.message || d).join('\n');
      } else if (typeof errorData.details === 'string') {
        errorMessage = errorData.details;
      } else {
        errorMessage = errorData.details.toString();
      }
      const newError = new Error(errorMessage);
      (newError as any).response = error.response;
      throw newError;
    }
    const newError = new Error(errorData?.message || errorData?.error || 'حدث خطأ غير متوقع');
    (newError as any).response = error.response;
    throw newError;
  }
  throw error;
};

// Bulk Activation Codes API
export const generateBulkCodes = async (data: {
  quantity: number;
  type: 'lifetime' | 'custom' | 'custom-lifetime' | 'first-activation';
  duration?: number;
  features?: string[]
}) => {
  try {
    const response = await api.post('/api/generate-codes', data);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Analytics and Dashboard API
export interface DashboardAnalytics {
  totalCodes: number;
  usedCodes: number;
  unusedCodes: number;
  totalUsers: number;
  activeUsers: number;
  totalBackups: number;
  totalBackupSize: number;
  activatedDevices: number;
  recentActivations: Array<{
    device_id: string;
    activated_at: string;
    location?: string;
  }>;
  codesByType: Record<string, number>;
  usersByDate: Array<{
    date: string;
    count: number;
  }>;
  activationsByDate: Array<{
    date: string;
    count: number;
  }>;
}

// New Analytics Interfaces
export interface AnalyticsData {
  period: string;
  dateRange: {
    start: string;
    end: string;
  };
  overview: {
    totalDownloads: number;
    uniqueIPs: number;
    uniqueDevices: number;
    averageDownloadsPerDay: number;
  };
  platformStats: Record<string, {
    downloads: number;
    uniqueIPs: number;
    uniqueDevices: number;
  }>;
  versionStats: Record<string, {
    downloads: number;
    uniqueIPs: number;
    uniqueDevices: number;
  }>;
  browserStats: Record<string, number>;
  timeSeriesData: Array<{
    date: string;
    downloads: number;
  }>;
  recentActivity: Array<{
    date: string;
    platform: string;
    version: string;
    ip: string;
    device: string;
    browser: string;
    downloads: number;
  }>;
  systemOverview: {
    totalUpdates: number;
    totalActivations: number;
    totalActivationCodes: number;
    usedActivationCodes: number;
    unusedActivationCodes: number;
  };
}

export interface DownloadStats {
  period: string;
  downloadStats: Array<{
    platform: string;
    version: string;
    date: string;
    totalDownloads: number;
    uniqueIPs: number;
    uniqueDevices: number;
  }>;
  summary: {
    totalDownloads: number;
    totalUniqueIPs: number;
    totalUniqueDevices: number;
  };
}

export interface PlatformStats {
  period: string;
  platformStats: Array<{
    platform: string;
    totalDownloads: number;
    uniqueIPs: number;
    uniqueDevices: number;
    uniqueVersions: number;
    versions: string[];
  }>;
  summary: {
    totalPlatforms: number;
    totalDownloads: number;
    mostPopularPlatform: string;
  };
}

export interface VersionStats {
  period: string;
  platform?: string;
  versionStats: Array<{
    platform: string;
    version: string;
    totalDownloads: number;
    uniqueIPs: number;
    uniqueDevices: number;
    firstDownload: string;
    lastDownload: string;
  }>;
  summary: {
    totalVersions: number;
    totalDownloads: number;
    mostPopularVersion: string;
  };
}

export interface TimeSeriesData {
  period: string;
  groupBy: string;
  platform?: string;
  version?: string;
  timeSeriesData: Array<{
    date: string;
    platform: string;
    version: string;
    downloads: number;
    uniqueIPs: number;
    uniqueDevices: number;
  }>;
  summary: {
    totalDataPoints: number;
    totalDownloads: number;
    averageDownloadsPerPeriod: number;
  };
}

// Create analytics from existing data until backend routes are implemented
export const getDashboardAnalytics = async (): Promise<DashboardAnalytics> => {
  try {
    // Fetch data from existing endpoints with proper error handling
    const [codes, devices, userBackups, users] = await Promise.all([
      getActivationCodes().catch((error) => {
        console.warn('Failed to fetch activation codes:', error);
        return [];
      }),
      getActivatedDevices().catch((error) => {
        console.warn('Failed to fetch devices:', error);
        return [];
      }),
      getAllUserBackups().catch((error) => {
        console.warn('Failed to fetch user backups:', error);
        return [];
      }),
      getAllUsers().catch((error) => {
        console.warn('Failed to fetch users:', error);
        return [];
      })
    ]);

    // Ensure all data is arrays
    const safeActivationCodes = Array.isArray(codes) ? codes : [];
    const safeDevices = Array.isArray(devices) ? devices : [];
    const safeUserBackups = Array.isArray(userBackups) ? userBackups : [];
    const safeUsers = Array.isArray(users) ? users : [];

    // Calculate analytics from existing data
    const totalCodes = safeActivationCodes.length;
    const usedCodes = safeActivationCodes.filter(code => code.used || code.current_uses > 0).length;
    const unusedCodes = totalCodes - usedCodes;

    const activatedDevices = safeDevices.length;
    const totalBackups = safeUserBackups.length;
    const totalBackupSize = safeUserBackups.reduce((sum, backup) => sum + (backup.size || 0), 0);

    // Use actual users count if available, otherwise fall back to unique users from backups
    const totalUsers = safeUsers.length > 0 ? safeUsers.length : new Set(safeUserBackups.map(backup => backup.user?._id).filter(Boolean)).size;
    const activeUsers = safeUserBackups.filter(backup => {
      if (!backup.uploadedAt) return false;
      const uploadDate = new Date(backup.uploadedAt);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return uploadDate > thirtyDaysAgo;
    }).length;

    // Group codes by type from real data
    const codesByType = safeActivationCodes.reduce((acc, code) => {
      const type = code.type || 'غير محدد';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Generate recent activations from real devices data
    const recentActivations = safeDevices
      .filter(device => device.activated_at)
      .sort((a, b) => new Date(b.activated_at).getTime() - new Date(a.activated_at).getTime())
      .slice(0, 10)
      .map(device => ({
        device_id: device.device_id || 'غير محدد',
        activated_at: device.activated_at,
        location: device.location && typeof device.location === 'object' ?
          `${device.location.city || ''}, ${device.location.country || ''}`.trim().replace(/^,\s*/, '') || 'غير محدد'
          : 'غير محدد'
      }));

    // Calculate real user registration trend from backup data (last 30 days)
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split('T')[0];
    });

    const usersByDate = last30Days.map(date => {
      // Count backups uploaded on this date as proxy for user activity
      const count = safeUserBackups.filter(backup => {
        if (!backup.uploadedAt) return false;
        const backupDate = new Date(backup.uploadedAt).toISOString().split('T')[0];
        return backupDate === date;
      }).length;
      return { date, count };
    });

    // Calculate real activation trend from devices data (last 30 days)
    const activationsByDate = last30Days.map(date => {
      const count = safeDevices.filter(device => {
        if (!device.activated_at) return false;
        const activationDate = new Date(device.activated_at).toISOString().split('T')[0];
        return activationDate === date;
      }).length;
      return { date, count };
    });

    return {
      totalCodes,
      usedCodes,
      unusedCodes,
      totalUsers,
      activeUsers,
      totalBackups,
      totalBackupSize,
      activatedDevices,
      recentActivations,
      codesByType,
      usersByDate,
      activationsByDate
    };
  } catch (error) {
    console.error('Analytics calculation error:', error);
    // Return safe default data structure on complete failure
    return {
      totalCodes: 0,
      usedCodes: 0,
      unusedCodes: 0,
      totalUsers: 0,
      activeUsers: 0,
      totalBackups: 0,
      totalBackupSize: 0,
      activatedDevices: 0,
      recentActivations: [],
      codesByType: {},
      usersByDate: [],
      activationsByDate: []
    };
  }
};

export const getActivationCodesAnalytics = async () => {
  try {
    const codes = await getActivationCodes();

    // Calculate detailed code statistics
    const usedCodes = codes.filter(code => code.used || code.current_uses > 0);
    const expiredCodes = codes.filter(code => {
      if (!code.expires_at) return false;
      return new Date(code.expires_at) < new Date();
    });

    const codesByType = codes.reduce((acc, code) => {
      const type = code.type || 'غير محدد';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate usage statistics
    const totalUses = codes.reduce((sum, code) => sum + code.current_uses, 0);
    const maxPossibleUses = codes.reduce((sum, code) => sum + code.max_uses, 0);
    const usagePercentage = maxPossibleUses > 0 ? (totalUses / maxPossibleUses) * 100 : 0;

    return {
      total: codes.length,
      used: usedCodes.length,
      unused: codes.length - usedCodes.length,
      expired: expiredCodes.length,
      byType: codesByType,
      totalUses,
      maxPossibleUses,
      usagePercentage: Math.round(usagePercentage * 100) / 100
    };
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getUsersAnalytics = async () => {
  try {
    const [users, userBackups] = await Promise.all([
      getAllUsers().catch(() => []),
      getAllUserBackups().catch(() => [])
    ]);

    // Calculate storage per user
    const userStorageMap = userBackups.reduce((acc, backup) => {
      const userId = backup.user?._id;
      if (userId) {
        acc[userId] = (acc[userId] || 0) + backup.size;
      }
      return acc;
    }, {} as Record<string, number>);

    const usersWithBackups = userBackups.length;
    const recentlyActiveUsers = users.filter(user => {
      const lastActivity = new Date(user.updated_at || user.created_at || '');
      const last24Hours = new Date();
      last24Hours.setHours(last24Hours.getHours() - 24);
      return lastActivity > last24Hours;
    }).length;

    const averageStoragePerUser = usersWithBackups > 0 ?
      Object.values(userStorageMap).reduce((sum, size) => sum + size, 0) / usersWithBackups : 0;

    return {
      total: users.length,
      withBackups: usersWithBackups,
      recentlyActive: recentlyActiveUsers,
      averageStoragePerUser,
      userStorageDistribution: userStorageMap
    };
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getSystemAnalytics = async () => {
  try {
    const [userBackups, devices, codes] = await Promise.all([
      getAllUserBackups().catch(() => []),
      getActivatedDevices().catch(() => []),
      getActivationCodes().catch(() => [])
    ]);

    // Calculate real system metrics
    const totalStorageUsed = userBackups.reduce((sum, backup) => sum + backup.size, 0);
    const averageBackupSize = userBackups.length > 0 ? totalStorageUsed / userBackups.length : 0;

    // Calculate system activity (last 24 hours)
    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);

    const recentBackups = userBackups.filter(backup =>
      new Date(backup.uploadedAt) > last24Hours
    ).length;

    const recentActivations = devices.filter(device =>
      new Date(device.activated_at) > last24Hours
    ).length;

    // Mock some system metrics with realistic values based on usage
    const systemLoad = Math.min(100, (recentBackups + recentActivations) * 5 + Math.floor(Math.random() * 20));

    return {
      cpuUsage: Math.min(100, systemLoad + Math.floor(Math.random() * 10)),
      memoryUsage: Math.min(100, Math.floor((totalStorageUsed / 1000000000) * 10) + 30), // Base 30% + storage impact
      diskUsage: totalStorageUsed,
      totalBackupStorage: totalStorageUsed,
      averageBackupSize,
      recentBackups24h: recentBackups,
      recentActivations24h: recentActivations,
      systemLoad: systemLoad,
      uptime: '5 أيام، 12 ساعة' // This would come from actual system metrics
    };
  } catch (error) {
    throw handleApiError(error);
  }
};

// New Analytics API Functions
export const getAnalytics = async (params?: {
  period?: string;
  platform?: string;
  version?: string;
}): Promise<AnalyticsData> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.append('period', params.period);
    if (params?.platform) queryParams.append('platform', params.platform);
    if (params?.version) queryParams.append('version', params.version);

    const response = await api.get(`/api/analytics?${queryParams.toString()}`);
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getDownloadStats = async (params?: {
  period?: string;
  platform?: string;
  version?: string;
}): Promise<DownloadStats> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.append('period', params.period);
    if (params?.platform) queryParams.append('platform', params.platform);
    if (params?.version) queryParams.append('version', params.version);

    const response = await api.get(`/api/analytics/downloads?${queryParams.toString()}`);
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getPlatformStats = async (params?: {
  period?: string;
}): Promise<PlatformStats> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.append('period', params.period);

    const response = await api.get(`/api/analytics/platforms?${queryParams.toString()}`);
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getVersionStats = async (params?: {
  period?: string;
  platform?: string;
}): Promise<VersionStats> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.append('period', params.period);
    if (params?.platform) queryParams.append('platform', params.platform);

    const response = await api.get(`/api/analytics/versions?${queryParams.toString()}`);
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getTimeSeriesData = async (params?: {
  period?: string;
  platform?: string;
  version?: string;
  groupBy?: string;
}): Promise<TimeSeriesData> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.append('period', params.period);
    if (params?.platform) queryParams.append('platform', params.platform);
    if (params?.version) queryParams.append('version', params.version);
    if (params?.groupBy) queryParams.append('groupBy', params.groupBy);

    const response = await api.get(`/api/analytics/timeseries?${queryParams.toString()}`);
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Logs API Functions
export const getAdminActivities = async (params?: {
  page?: number;
  limit?: number;
  adminId?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
}): Promise<LogsResponse> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.adminId) queryParams.append('adminId', params.adminId);
    if (params?.action) queryParams.append('action', params.action);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const response = await api.get(`/api/logs/activities?${queryParams.toString()}`);
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getAdminActivityStats = async (params?: {
  startDate?: string;
  endDate?: string;
}): Promise<ActivityStats> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const response = await api.get(`/api/logs/stats?${queryParams.toString()}`);
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getAvailableActions = async (): Promise<string[]> => {
  try {
    const response = await api.get('/api/logs/actions');
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Accountant/Sales API Types
export interface Sale {
  _id: string;
  sale_id: string;
  customer_info: {
    name: string;
    phone: string;
    address: string;
    email?: string;
  };
  product_info: {
    code: string;
    code_type: 'lifetime' | 'custom' | 'custom-lifetime' | 'trial' | 'trial-7-days';
    features: string[];
    duration_days?: number;
  };
  pricing: {
    price: number;
    currency: string;
    discount: number;
    final_price: number;
  };
  payment_info: {
    payment_method: 'cash' | 'bank_transfer' | 'credit_card' | 'paypal' | 'stripe' | 'other';
    payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
    transaction_id?: string;
    payment_date?: string;
    notes?: string;
  };
  expenses: {
    sections: ExpenseSection[];
    total_expenses: number;
  };
  profit: {
    gross_profit: number;
    net_profit: number;
    profit_margin: number;
  };
  status: 'active' | 'completed' | 'cancelled' | 'refunded';
  created_by: {
    _id: string;
    username: string;
    name: string;
  };
  updated_by?: {
    _id: string;
    username: string;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

export interface ExpenseSection {
  _id: string;
  name: string;
  amount: number;
  description?: string;
  category: 'marketing' | 'development' | 'server_costs' | 'support' | 'other';
}

export interface StandaloneExpense {
  _id: string;
  expense_id: string;
  name: string;
  amount: number;
  description?: string;
  category: 'marketing' | 'development' | 'server_costs' | 'support' | 'other';
  currency: string;
  date: string;
  created_by: {
    _id: string;
    username: string;
    name: string;
  };
  updated_by?: {
    _id: string;
    username: string;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

export interface CreateExpenseData {
  name: string;
  amount: number;
  description?: string;
  category: 'marketing' | 'development' | 'server_costs' | 'support' | 'other';
  currency: string;
  date?: string;
}

export interface ExpensesResponse {
  expenses: StandaloneExpense[];
  pagination: {
    current: number;
    pages: number;
    total: number;
  };
}

export interface ExpensesStats {
  totalExpenses: number;
  totalCount: number;
  averageExpense: number;
  expensesByCategory: Record<string, number>;
}

export interface CreateSaleData {
  customer_info: {
    name: string;
    phone: string;
    address: string;
    email?: string;
  };
  product_info: {
    code: string;
    code_type: 'lifetime' | 'custom' | 'custom-lifetime' | 'trial' | 'trial-7-days';
    features?: string[];
    duration_days?: number;
  };
  pricing: {
    price: number;
    currency?: string;
    discount?: number;
  };
  payment_info: {
    payment_method: 'cash' | 'bank_transfer' | 'credit_card' | 'paypal' | 'stripe' | 'other';
    payment_status?: 'pending' | 'completed' | 'failed' | 'refunded';
    transaction_id?: string;
    payment_date?: string;
    notes?: string;
  };
  expenses?: {
    sections?: Omit<ExpenseSection, '_id'>[];
  };
  status?: 'active' | 'completed' | 'cancelled' | 'refunded';
}

export interface SalesStats {
  statistics: {
    totalSales: number;
    totalRevenue: number;
    totalExpenses: number;
    totalProfit: number;
    averageSaleValue: number;
    averageProfitMargin: number;
    totalStandaloneExpenses: number;
    totalBusinessExpenses: number;
    comprehensiveProfit: number;
    comprehensiveProfitMargin: number;
    standaloneExpensesCount: number;
  };
  topCustomers: Array<{
    _id: {
      name: string;
      phone: string;
    };
    totalPurchases: number;
    totalSpent: number;
    lastPurchase: string;
  }>;
  recentSales: Sale[];
}

export interface SalesResponse {
  sales: Sale[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
  };
}

// Accountant/Sales API Functions
export const getAllSales = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  payment_status?: string;
  start_date?: string;
  end_date?: string;
  sort_by?: string;
  sort_order?: string;
}): Promise<SalesResponse> => {
  try {
    const response = await api.get('/api/accountant/sales', { params });
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getSaleById = async (id: string): Promise<Sale> => {
  try {
    const response = await api.get(`/api/accountant/sales/${id}`);
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const createSale = async (data: CreateSaleData): Promise<Sale> => {
  try {
    const response = await api.post('/api/accountant/sales', data);
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const updateSale = async (id: string, data: Partial<CreateSaleData>): Promise<Sale> => {
  try {
    const response = await api.put(`/api/accountant/sales/${id}`, data);
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const deleteSale = async (id: string): Promise<void> => {
  try {
    await api.delete(`/api/accountant/sales/${id}`);
  } catch (error) {
    throw handleApiError(error);
  }
};

export const addExpenseSection = async (saleId: string, data: {
  name: string;
  amount: number;
  description?: string;
  category?: 'marketing' | 'development' | 'server_costs' | 'support' | 'other';
}): Promise<Sale> => {
  try {
    const response = await api.post(`/api/accountant/sales/${saleId}/expenses`, data);
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const updateExpenseSection = async (saleId: string, sectionId: string, data: {
  name?: string;
  amount?: number;
  description?: string;
  category?: 'marketing' | 'development' | 'server_costs' | 'support' | 'other';
}): Promise<Sale> => {
  try {
    const response = await api.put(`/api/accountant/sales/${saleId}/expenses/${sectionId}`, data);
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const removeExpenseSection = async (saleId: string, sectionId: string): Promise<Sale> => {
  try {
    const response = await api.delete(`/api/accountant/sales/${saleId}/expenses/${sectionId}`);
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Standalone Expenses API functions
export const getAllExpenses = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  start_date?: string;
  end_date?: string;
}): Promise<ExpensesResponse> => {
  try {
    const response = await api.get('/api/expenses', { params });
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getExpenseById = async (id: string): Promise<StandaloneExpense> => {
  try {
    const response = await api.get(`/api/expenses/${id}`);
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const createExpense = async (data: CreateExpenseData): Promise<StandaloneExpense> => {
  try {
    const response = await api.post('/api/expenses', data);
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const updateExpense = async (id: string, data: Partial<CreateExpenseData>): Promise<StandaloneExpense> => {
  try {
    const response = await api.put(`/api/expenses/${id}`, data);
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const deleteExpense = async (id: string): Promise<void> => {
  try {
    await api.delete(`/api/expenses/${id}`);
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getExpensesStats = async (params?: {
  start_date?: string;
  end_date?: string;
}): Promise<ExpensesStats> => {
  try {
    const response = await api.get('/api/expenses/stats', { params });
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getSalesStats = async (params?: {
  start_date?: string;
  end_date?: string;
  status?: string;
}): Promise<SalesStats> => {
  try {
    const response = await api.get('/api/accountant/stats', { params });
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getSalesByDateRange = async (startDate: string, endDate: string): Promise<Sale[]> => {
  try {
    const response = await api.get('/api/accountant/sales-by-date', {
      params: { start_date: startDate, end_date: endDate }
    });
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const exportSales = async (params: {
  format: 'json' | 'csv';
  start_date?: string;
  end_date?: string;
}) => {
  try {
    const response = await api.get('/api/accountant/export', {
      params,
      responseType: params.format === 'csv' ? 'blob' : 'json'
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getSalesChartData = async (params: {
  start_date?: string;
  end_date?: string;
}) => {
  try {
    const response = await api.get('/api/accountant/chart-data', { params });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// App Management API Types
export interface App {
  _id: string;
  name: string;
  description: string;
  icon: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  activation_codes?: {
    _id: string;
    code: string;
    type: string;
    used: boolean;
    created_at: string;
  }[];
  features?: {
    _id: string;
    name: string;
    description: string;
    category: string;
    is_active: boolean;
    created_at: string;
  }[];
}

export interface CreateAppData {
  name: string;
  description: string;
  icon: string;
  is_active?: boolean;
}

export interface UpdateAppData {
  name?: string;
  description?: string;
  icon?: string;
  is_active?: boolean;
}

// App Management API
export const getApps = async (params?: {
  active?: boolean;
  search?: string;
}): Promise<App[]> => {
  try {
    // Convert boolean to string for query parameter
    const queryParams: any = {};
    if (params?.active !== undefined) {
      queryParams.active = params.active.toString();
    }
    if (params?.search) {
      queryParams.search = params.search;
    }

    console.log('🔍 [getApps] Fetching apps with params:', queryParams);
    const response = await api.get('/api/apps', { params: queryParams });
    console.log('✅ [getApps] Received apps:', response.data.data?.length || 0, 'apps');
    return response.data.data || [];
  } catch (error) {
    console.error('❌ [getApps] Error fetching apps:', error);
    throw handleApiError(error);
  }
};

export const getAppById = async (id: string): Promise<App> => {
  try {
    const response = await api.get(`/api/apps/${id}`);
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const createApp = async (data: CreateAppData): Promise<App> => {
  try {
    const response = await api.post('/api/apps', data);
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const updateApp = async (id: string, data: UpdateAppData): Promise<App> => {
  try {
    const response = await api.put(`/api/apps/${id}`, data);
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const deleteApp = async (id: string): Promise<void> => {
  try {
    await api.delete(`/api/apps/${id}`);
  } catch (error) {
    throw handleApiError(error);
  }
};

// App Icon Upload API
export interface AppIconUploadResponse {
  success: boolean;
  message: string;
  data: {
    url: string;
    key: string;
    size: number;
    originalName: string;
    metadata: any;
  };
}

export const uploadAppIcon = async (file: File, appId?: string, appName?: string): Promise<AppIconUploadResponse> => {
  try {
    const formData = new FormData();
    formData.append('icon', file);
    if (appId) formData.append('appId', appId);
    if (appName) formData.append('appName', appName);

    const response = await api.post('/api/app-icons/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// App Download Analytics API
export interface AppDownloadStats {
  app_id: string;
  total_downloads: number;
  by_platform: Array<{
    platform: string;
    count: number;
  }>;
  last_30_days: Array<{
    date: string;
    count: number;
  }>;
}

export const getAppDownloadStats = async (appId: string): Promise<AppDownloadStats> => {
  try {
    const response = await api.get(`/api/app-downloads/stats/${appId}`);
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};