'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'manager' | 'member';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  alertCount: number;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string, role: 'manager' | 'member') => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchUser: (email: string) => Promise<void>;
  refreshAlerts: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [alertCount, setAlertCount] = useState(0);

  const refreshSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshAlerts = async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/alerts');
      if (res.ok) {
        const data = await res.json();
        setAlertCount(data.visibleCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch alert count', err);
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  useEffect(() => {
    if (user) {
      refreshAlerts();
      const interval = setInterval(refreshAlerts, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const login = async (email: string, password = 'password123') => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }
      setUser(data.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  const signup = async (name: string, email: string, password: string, role: 'manager' | 'member') => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Signup failed' };
      }
      setUser(data.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
      setAlertCount(0);
    }
  };

  const switchUser = async (email: string) => {
    await login(email, 'password123');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        alertCount,
        login,
        signup,
        logout,
        switchUser,
        refreshAlerts,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
