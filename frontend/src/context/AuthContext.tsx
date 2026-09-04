import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: { first_name: string; last_name: string; email: string; phone?: string; password: string }) => Promise<void>;
  sendRegistrationOtp: (data: { first_name: string; last_name: string; email: string; phone?: string; password: string }) => Promise<{ message: string }>;
  verifyRegistrationOtp: (email: string, otp: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('yurae_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('yurae_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.get('/auth/me')
        .then((res) => {
          setUser(res.data);
          localStorage.setItem('yurae_user', JSON.stringify(res.data));
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await api.post('/auth/login', { email, password });
    const { access_token, user: loggedUser } = res.data;
    setToken(access_token);
    setUser(loggedUser);
    localStorage.setItem('yurae_token', access_token);
    localStorage.setItem('yurae_user', JSON.stringify(loggedUser));
    return loggedUser;
  };

  const register = async (data: { first_name: string; last_name: string; email: string; phone?: string; password: string }) => {
    const res = await api.post('/auth/register', data);
    const { access_token, user: registeredUser } = res.data;
    setToken(access_token);
    setUser(registeredUser);
    localStorage.setItem('yurae_token', access_token);
    localStorage.setItem('yurae_user', JSON.stringify(registeredUser));
  };

  const sendRegistrationOtp = async (data: { first_name: string; last_name: string; email: string; phone?: string; password: string }) => {
    const res = await api.post('/auth/send-registration-otp', data);
    return res.data;
  };

  const verifyRegistrationOtp = async (email: string, otp: string) => {
    const res = await api.post('/auth/verify-registration-otp', { email, otp });
    const { access_token, user: registeredUser } = res.data;
    setToken(access_token);
    setUser(registeredUser);
    localStorage.setItem('yurae_token', access_token);
    localStorage.setItem('yurae_user', JSON.stringify(registeredUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('yurae_token');
    localStorage.removeItem('yurae_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isAdmin: !!user && user.role === 'ADMIN',
        login,
        register,
        sendRegistrationOtp,
        verifyRegistrationOtp,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
