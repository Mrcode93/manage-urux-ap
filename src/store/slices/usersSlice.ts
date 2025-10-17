import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { getActivatedDevices } from '../../api/client';

// Define User interface locally since it's not exported from client
interface User {
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
  license: {
    device_id: string;
    features: string[];
    type: string;
    expires_at?: string;
    issued_at: string;
    signature: string;
    is_active: boolean;
  };
}

interface UsersState {
  users: User[];
  loading: boolean;
  error: string | null;
  totalUsers: number;
  currentPage: number;
  totalPages: number;
  searchTerm: string;
  locationCache: { [key: string]: string };
}

const initialState: UsersState = {
  users: [],
  loading: false,
  error: null,
  totalUsers: 0,
  currentPage: 1,
  totalPages: 1,
  searchTerm: '',
  locationCache: {},
};

// Async thunks
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async ({ page = 1, search = '' }: { page?: number; search?: string }) => {
    const devices = await getActivatedDevices();
    
    // Filter devices based on search term
    const filteredDevices = devices.filter(device => {
      const locationString = typeof device.location === 'string' 
        ? device.location.toLowerCase() 
        : `${device.location?.city || ''} ${device.location?.country || ''}`.toLowerCase();
      
      return device.device_id.toLowerCase().includes(search.toLowerCase()) ||
        device.ip.includes(search) ||
        locationString.includes(search.toLowerCase()) ||
        device.location_data?.city?.toLowerCase().includes(search.toLowerCase()) ||
        device.location_data?.country?.toLowerCase().includes(search.toLowerCase());
    });
    
    // Calculate pagination
    const itemsPerPage = 100;
    const totalItems = filteredDevices.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedDevices = filteredDevices.slice(startIndex, endIndex);
    
    return {
      users: paginatedDevices,
      total: totalItems,
      totalPages,
      currentPage: page
    };
  }
);

export const removeUser = createAsyncThunk(
  'users/removeUser',
  async (userId: string) => {
    // Since there's no deleteUser function, we'll just return the userId
    // This functionality might need to be implemented in the API
    console.warn('Delete user functionality not implemented in API');
    return userId;
  }
);

export const updateLocationCache = createAsyncThunk(
  'users/updateLocationCache',
  async ({ ip, location }: { ip: string; location: string }) => {
    return { ip, location };
  }
);

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch users
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.users;
        state.totalUsers = action.payload.total;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'فشل في جلب المستخدمين';
      })
      // Remove user
      .addCase(removeUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(removeUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users = state.users.filter(user => user._id !== action.payload);
        state.totalUsers -= 1;
      })
      .addCase(removeUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'فشل في حذف المستخدم';
      })
      // Update location cache
      .addCase(updateLocationCache.fulfilled, (state, action) => {
        state.locationCache[action.payload.ip] = action.payload.location;
      });
  },
});

export const { setSearchTerm, setCurrentPage, clearError } = usersSlice.actions;
export default usersSlice.reducer;