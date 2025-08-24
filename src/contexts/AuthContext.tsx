import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { toast } from 'react-hot-toast';
import { adminLogin, getAdminProfile, updateAdminProfile as updateProfileApi, refreshAdminToken } from '../api/client';
import type { AdminUser } from '../api/client';

interface Admin {
  _id: string;
  username: string;
  name: string;
  role: string;
  permissions: string[];
  lastLogin?: string;
  createdAt: string;
}

interface AuthContextType {
  admin: Admin | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: { username?: string; name?: string; currentPassword?: string; newPassword?: string }) => Promise<boolean>;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check for existing token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('admin_token');
    const storedAdmin = localStorage.getItem('admin_data');
    
    if (storedToken && storedAdmin) {
      try {
        setToken(storedToken);
        setAdmin(JSON.parse(storedAdmin));
      } catch (error) {
        console.error('Error parsing stored admin data:', error);
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_data');
      }
    }
    
    setIsLoading(false);
  }, []);

  // Auto-refresh token before it expires
  useEffect(() => {
    if (!token) return;

    const tokenExpiry = localStorage.getItem('token_expiry');
    if (!tokenExpiry) return;

    const expiryTime = new Date(tokenExpiry).getTime();
    const currentTime = new Date().getTime();
    const timeUntilExpiry = expiryTime - currentTime;

    // Refresh token 5 minutes before expiry
    if (timeUntilExpiry > 0 && timeUntilExpiry < 5 * 60 * 1000) {
      const refreshTimer = setTimeout(() => {
        refreshToken();
      }, timeUntilExpiry - 5 * 60 * 1000);

      return () => clearTimeout(refreshTimer);
    }
  }, [token]);

  const refreshToken = async (): Promise<boolean> => {
    if (isRefreshing) return false;
    
    try {
      setIsRefreshing(true);
      const response = await refreshAdminToken();
      
      if (response.token) {
        setToken(response.token);
        localStorage.setItem('admin_token', response.token);
        
        // Set token expiry (24 hours from now)
        const expiryTime = new Date();
        expiryTime.setHours(expiryTime.getHours() + 24);
        localStorage.setItem('token_expiry', expiryTime.toISOString());
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // If refresh fails, logout the user
      logout();
      return false;
    } finally {
      setIsRefreshing(false);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const data = await adminLogin(username, password);

      if (data.success) {
        setToken(data.data.token);
        setAdmin(data.data.admin);
        
        // Store in localStorage
        localStorage.setItem('admin_token', data.data.token);
        localStorage.setItem('admin_data', JSON.stringify(data.data.admin));
        
        // Set token expiry (24 hours from now)
        const expiryTime = new Date();
        expiryTime.setHours(expiryTime.getHours() + 24);
        localStorage.setItem('token_expiry', expiryTime.toISOString());
        
        toast.success('تم تسجيل الدخول بنجاح');
        
        // Redirect to dashboard using window.location
        window.location.href = '/#/';
        
        return true;
      } else {
        toast.error(data.message || 'فشل في تسجيل الدخول');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('خطأ في الاتصال بالخادم');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setAdmin(null);
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_data');
    localStorage.removeItem('token_expiry');
    toast.success('تم تسجيل الخروج بنجاح');
  };

  const updateProfile = async (data: { name?: string; currentPassword?: string; newPassword?: string }): Promise<boolean> => {
    try {
      if (!token) {
        toast.error('غير مصرح لك');
        return false;
      }

      const responseData = await updateProfileApi(data);

      if (responseData) {
        setAdmin(responseData);
        localStorage.setItem('admin_data', JSON.stringify(responseData));
        toast.success('تم تحديث الملف الشخصي بنجاح');
        return true;
      } else {
        toast.error('فشل في تحديث الملف الشخصي');
        return false;
      }
    } catch (error) {
      console.error('Update profile error:', error);
      toast.error('خطأ في الاتصال بالخادم');
      return false;
    }
  };

  const value: AuthContextType = {
    admin,
    token,
    isAuthenticated: !!token && !!admin,
    isLoading,
    login,
    logout,
    updateProfile,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
