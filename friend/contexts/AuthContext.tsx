import React, { createContext, useState, useContext, useEffect } from 'react';
import authService, { AuthResponse } from '../services/authService';

interface AuthContextType {
  user: AuthResponse | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (profession: string, organization: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    const response = await authService.login({ username, password });
    setUser(response);
  };

  const signup = async (username: string, email: string, password: string) => {
    const response = await authService.signup({ username, email, password });
    setUser(response);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const updateUserProfile = async (profession: string, organization: string) => {
    await authService.updateProfile({ profession, organization });
    // Refresh user data
    const updatedUser = await authService.getCurrentUser();
    setUser(updatedUser);
  };

  const refreshUser = async () => {
    try {
      const profile = await authService.getProfile();
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        setUser({
          ...currentUser,
          ...profile,
        });
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        updateUserProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
