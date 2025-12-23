import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { 
  getDashboardAnalytics,
  getActivationCodesAnalytics,
  getUsersAnalytics,
  type DashboardAnalytics
} from '../../api/client';

interface DashboardState {
  analytics: DashboardAnalytics | null;
  codesAnalytics: any;
  usersAnalytics: any;
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  lastUpdated: string | null;
  currentPeriod: string;
}

const initialState: DashboardState = {
  analytics: null,
  codesAnalytics: null,
  usersAnalytics: null,
  loading: false,
  error: null,
  refreshing: false,
  lastUpdated: null,
  currentPeriod: '30d',
};

// Async thunks
export const fetchDashboardData = createAsyncThunk(
  'dashboard/fetchDashboardData',
  async (params?: { period?: string }) => {
    try {
      // Fetch only essential dashboard data in parallel
      // Using Promise.allSettled to ensure partial data is returned even if some requests fail
      const [dashboardData, codesData, usersData] = await Promise.allSettled([
        getDashboardAnalytics(),
        getActivationCodesAnalytics(),
        getUsersAnalytics()
      ]);

      return {
        analytics: dashboardData.status === 'fulfilled' ? dashboardData.value : null,
        codesAnalytics: codesData.status === 'fulfilled' ? codesData.value : null,
        usersAnalytics: usersData.status === 'fulfilled' ? usersData.value : null
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
      // Fetch only essential dashboard data in parallel
      const [dashboardData, codesData, usersData] = await Promise.allSettled([
        getDashboardAnalytics(),
        getActivationCodesAnalytics(),
        getUsersAnalytics()
      ]);

      return {
        analytics: dashboardData.status === 'fulfilled' ? dashboardData.value : null,
        codesAnalytics: codesData.status === 'fulfilled' ? codesData.value : null,
        usersAnalytics: usersData.status === 'fulfilled' ? usersData.value : null
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
        state.lastUpdated = new Date().toISOString();
        if (action.meta.arg?.period) {
          state.currentPeriod = action.meta.arg.period;
        }
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