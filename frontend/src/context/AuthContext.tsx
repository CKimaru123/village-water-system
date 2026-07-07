import React, { createContext, useState, useEffect, ReactNode } from "react";
import { clearAuthToken, fetchCurrentUser, logoutRequest, refreshTokenRequest, setAuthToken, setRefreshToken, clearRefreshToken } from "../utils/api";
import i18n from "../i18n";

interface User {
  id: string;
  phone: string;
  email?: string;
  role: "admin" | "client" | "super_admin";
  account_type: "household" | "institution";
  status: string;
  token?: string;
  
  // Common fields
  communication_preference?: string;
  landmark?: string;
  newsletter_subscription?: boolean;
  
  // Household fields
  first_name?: string;
  last_name?: string;
  full_name?: string;
  alt_phone?: string;
  plot_number?: string;
  household_size?: number;
  village?: string;
  
  // Institution fields
  institution_name?: string;
  institution_type?: string;
  contact_person?: string;
  alt_contact?: string;
  population_served?: number;
  storage_capacity?: string;
  
  // Add avatar field to User interface
  avatar?: string;
  department?: string;
  permissions?: string[];
  accountType?: "household" | "institution";
  plotNumber?: string;
}

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  refreshUserData: () => Promise<void>;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount and fetch fresh data
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        // Apply user preferred language if available
        const userLang = parsedUser?.language_settings?.language || parsedUser?.language || parsedUser?.lang || parsedUser?.locale;
        if (userLang && i18n.language?.slice(0,2) !== userLang.slice(0,2)) {
          i18n.changeLanguage(userLang);
        }
        // Validate token with backend immediately on load
        fetchFreshUserData(storedToken);
      } catch (error) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }
    setIsLoading(false);
  }, []);

  // Listen for 401 events from API utilities — auto-logout on expired session
  useEffect(() => {
    const handleSessionExpired = () => {
      setUser(null);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      // Redirect to home so the nav updates correctly
      window.location.href = "/";
    };
    window.addEventListener("session:expired", handleSessionExpired);
    return () => window.removeEventListener("session:expired", handleSessionExpired);
  }, []);

  // Separate useEffect for polling — refresh user data every 30 seconds silently
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !user) return;

    const interval = setInterval(() => {
      fetchFreshUserData(token);
    }, 30000); // every 30 seconds

    return () => clearInterval(interval);
  }, [user?.id]);

  const attemptTokenRefresh = async () => {
    try {
      const refreshResult = await refreshTokenRequest();
      if (refreshResult.success && refreshResult.data) {
        const refreshedToken = refreshResult.data.token || refreshResult.data.access_token;
        const refreshedRefreshToken = refreshResult.data.refresh_token || refreshResult.data.refreshToken;

        if (refreshedToken) {
          setAuthToken(refreshedToken);
        }

        if (refreshedRefreshToken) {
          setRefreshToken(refreshedRefreshToken);
        }

        return refreshedToken;
      }
    } catch (refreshError) {
      console.error('Refresh token failed:', refreshError);
    }

    return null;
  };

  // Fetch fresh user data from API — clears session if token is expired (401)
  const fetchFreshUserData = async (token: string) => {
    try {
      const result = await fetchCurrentUser();
      if (result.success && result.data.user) {
        const freshUser = { ...result.data.user, token };
        // Apply language from backend if present
        const backendLang = result.data.user.language_settings?.language || result.data.user.language || result.data.user.lang;
        if (backendLang && i18n.language?.slice(0,2) !== backendLang.slice(0,2)) {
          i18n.changeLanguage(backendLang);
        }
        setUser(prev => {
          if (JSON.stringify(prev) === JSON.stringify(freshUser)) return prev;
          localStorage.setItem("user", JSON.stringify(freshUser));
          return freshUser;
        });
      }
    } catch (error: any) {
      if (error?.status === 401) {
        const newToken = await attemptTokenRefresh();
        if (newToken) {
          try {
            const retryResult = await fetchCurrentUser();
            if (retryResult.success && retryResult.data.user) {
              const freshUser = { ...retryResult.data.user, token: newToken };
              setUser(freshUser);
              localStorage.setItem("user", JSON.stringify(freshUser));
              return;
            }
          } catch (retryError) {
            console.error('Retry after token refresh failed:', retryError);
          }
        }

        setUser(null);
        localStorage.removeItem("user");
        clearAuthToken();
        clearRefreshToken();
      }
      // Network error — keep cached session, don't clear
    }
  };

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    // Apply language preference from newly-logged-in user
    const userLang = (userData as any)?.language_settings?.language || (userData as any)?.language || (userData as any)?.lang;
    if (userLang && i18n.language?.slice(0,2) !== userLang.slice(0,2)) {
      i18n.changeLanguage(userLang);
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    }
  };

  // Refresh user data from API
  const refreshUserData = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      await fetchFreshUserData(token);
    }
  };

  const logout = async () => {
    try {
      await logoutRequest();
    } catch (error) {
      console.error('Logout API error:', error);
      // Continue with logout even if API call fails
    } finally {
      setUser(null);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      clearRefreshToken();
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, refreshUserData, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

// 👇 ensures this is a module under --isolatedModules
export {};
