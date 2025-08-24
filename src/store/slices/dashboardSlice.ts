import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { 
  getDashboardAnalytics,
  getActivationCodesAnalytics,
  getUsersAnalytics,
  getSystemAnalytics,
  getAnalytics,
  getDownloadStats,
  getPlatformStats,
  getVersionStats,
  getTimeSeriesData,
  type DashboardAnalytics,
  type AnalyticsData,
  type DownloadStats,
  type PlatformStats,
  type VersionStats,
  type TimeSeriesData
} from '../../api/client';

interface DashboardState {
  analytics: DashboardAnalytics | null;
  codesAnalytics: any;
  usersAnalytics: any;
  systemAnalytics: any;
  // New analytics data
  analyticsData: AnalyticsData | null;
  downloadStats: DownloadStats | null;
  platformStats: PlatformStats | null;
  versionStats: VersionStats | null;
  timeSeriesData: TimeSeriesData | null;
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  lastUpdated: string | null;
}

const initialState: DashboardState = {
  analytics: null,
  codesAnalytics: null,
  usersAnalytics: null,
  systemAnalytics: null,
  // New analytics data
  analyticsData: null,
  downloadStats: null,
  platformStats: null,
  versionStats: null,
  timeSeriesData: null,
  loading: false,
  error: null,
  refreshing: false,
  lastUpdated: null,
};

// Async thunks
export const fetchDashboardData = createAsyncThunk(
  'dashboard/fetchDashboardData',
  async (params?: { period?: string }) => {
    try {
      const period = params?.period || '30d';
      const [dashboardData, codesData, usersData, systemData, analyticsData, downloadStats, platformStats, versionStats, timeSeriesData] = await Promise.allSettled([
        getDashboardAnalytics(),
        getActivationCodesAnalytics(),
        getUsersAnalytics(),
        getSystemAnalytics(),
        getAnalytics({ period }),
        getDownloadStats({ period }),
        getPlatformStats({ period }),
        getVersionStats({ period }),
        getTimeSeriesData({ period, groupBy: 'day' })
      ]);

      return {
        analytics: dashboardData.status === 'fulfilled' ? dashboardData.value : null,
        codesAnalytics: codesData.status === 'fulfilled' ? codesData.value : null,
        usersAnalytics: usersData.status === 'fulfilled' ? usersData.value : null,
        systemAnalytics: systemData.status === 'fulfilled' ? systemData.value : null,
        analyticsData: analyticsData.status === 'fulfilled' ? analyticsData.value : null,
        downloadStats: downloadStats.status === 'fulfilled' ? downloadStats.value : null,
        platformStats: platformStats.status === 'fulfilled' ? platformStats.value : null,
        versionStats: versionStats.status === 'fulfilled' ? versionStats.value : null,
        timeSeriesData: timeSeriesData.status === 'fulfilled' ? timeSeriesData.value : null
      };
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      throw error;
    }
  }
);

export const refreshDashboardData = createAsyncThunk(
  'dashboard/refreshDashboardData',
  async (params?: { period?: string }) => {
    try {
      const period = params?.period || '30d';
      const [dashboardData, codesData, usersData, systemData, analyticsData, downloadStats, platformStats, versionStats, timeSeriesData] = await Promise.allSettled([
        getDashboardAnalytics(),
        getActivationCodesAnalytics(),
        getUsersAnalytics(),
        getSystemAnalytics(),
        getAnalytics({ period }),
        getDownloadStats({ period }),
        getPlatformStats({ period }),
        getVersionStats({ period }),
        getTimeSeriesData({ period, groupBy: 'day' })
      ]);

      return {
        analytics: dashboardData.status === 'fulfilled' ? dashboardData.value : null,
        codesAnalytics: codesData.status === 'fulfilled' ? codesData.value : null,
        usersAnalytics: usersData.status === 'fulfilled' ? usersData.value : null,
        systemAnalytics: systemData.status === 'fulfilled' ? systemData.value : null,
        analyticsData: analyticsData.status === 'fulfilled' ? analyticsData.value : null,
        downloadStats: downloadStats.status === 'fulfilled' ? downloadStats.value : null,
        platformStats: platformStats.status === 'fulfilled' ? platformStats.value : null,
        versionStats: versionStats.status === 'fulfilled' ? versionStats.value : null,
        timeSeriesData: timeSeriesData.status === 'fulfilled' ? timeSeriesData.value : null
      };
    } catch (error) {
      console.error('Dashboard data refresh error:', error);
      throw error;
    }
  }
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setRefreshing: (state, action: PayloadAction<boolean>) => {
      state.refreshing = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch dashboard data
      .addCase(fetchDashboardData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.loading = false;
        state.analytics = action.payload.analytics;
        state.codesAnalytics = action.payload.codesAnalytics;
        state.usersAnalytics = action.payload.usersAnalytics;
        state.systemAnalytics = action.payload.systemAnalytics;
        state.analyticsData = action.payload.analyticsData;
        state.downloadStats = action.payload.downloadStats;
        state.platformStats = action.payload.platformStats;
        state.versionStats = action.payload.versionStats;
        state.timeSeriesData = action.payload.timeSeriesData;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'فشل في جلب البيانات التحليلية';
      })
      // Refresh dashboard data
      .addCase(refreshDashboardData.pending, (state) => {
        state.refreshing = true;
        state.error = null;
      })
      .addCase(refreshDashboardData.fulfilled, (state, action) => {
        state.refreshing = false;
        state.analytics = action.payload.analytics;
        state.codesAnalytics = action.payload.codesAnalytics;
        state.usersAnalytics = action.payload.usersAnalytics;
        state.systemAnalytics = action.payload.systemAnalytics;
        state.analyticsData = action.payload.analyticsData;
        state.downloadStats = action.payload.downloadStats;
        state.platformStats = action.payload.platformStats;
        state.versionStats = action.payload.versionStats;
        state.timeSeriesData = action.payload.timeSeriesData;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(refreshDashboardData.rejected, (state, action) => {
        state.refreshing = false;
        state.error = action.error.message || 'فشل في تحديث البيانات التحليلية';
      });
  },
});

export const { clearError, setRefreshing } = dashboardSlice.actions;
export default dashboardSlice.reducer;