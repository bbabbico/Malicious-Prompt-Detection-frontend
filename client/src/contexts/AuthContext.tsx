/**
 * AuthContext - JWT-based authentication context
 * Design: Obsidian Precision - Dark tech SaaS
 * Stores JWT token in localStorage, provides login/logout/register
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Mock JWT generation (in production this would come from the server)
function generateMockToken(user: User): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ ...user, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }));
  const signature = btoa('mock-signature');
  return `${header}.${payload}.${signature}`;
}

function parseToken(token: string): User | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp < Date.now()) return null;
    return {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      plan: payload.plan,
      createdAt: payload.createdAt,
    };
  } catch {
    return null;
  }
}

// Mock user database (localStorage-based for demo)
function getMockUsers(): Record<string, { password: string; user: User }> {
  const stored = localStorage.getItem('pg_mock_users');
  if (stored) return JSON.parse(stored);
  const defaults: Record<string, { password: string; user: User }> = {
    'demo@promptguard.ai': {
      password: 'demo1234',
      user: {
        id: 'usr_demo001',
        email: 'demo@promptguard.ai',
        name: 'Demo User',
        plan: 'pro',
        createdAt: '2024-01-15T00:00:00Z',
      },
    },
  };
  localStorage.setItem('pg_mock_users', JSON.stringify(defaults));
  return defaults;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('pg_token');
    if (storedToken) {
      const parsedUser = parseToken(storedToken);
      if (parsedUser) {
        setUser(parsedUser);
        setToken(storedToken);
      } else {
        localStorage.removeItem('pg_token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Simulate API delay
    await new Promise(r => setTimeout(r, 800));
    const users = getMockUsers();
    const record = users[email.toLowerCase()];
    if (!record || record.password !== password) {
      throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
    }
    const newToken = generateMockToken(record.user);
    localStorage.setItem('pg_token', newToken);
    setToken(newToken);
    setUser(record.user);
  };

  const register = async (name: string, email: string, password: string) => {
    await new Promise(r => setTimeout(r, 1000));
    const users = getMockUsers();
    if (users[email.toLowerCase()]) {
      throw new Error('이미 사용 중인 이메일입니다.');
    }
    const newUser: User = {
      id: `usr_${Date.now()}`,
      email: email.toLowerCase(),
      name,
      plan: 'free',
      createdAt: new Date().toISOString(),
    };
    users[email.toLowerCase()] = { password, user: newUser };
    localStorage.setItem('pg_mock_users', JSON.stringify(users));
    const newToken = generateMockToken(newUser);
    localStorage.setItem('pg_token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('pg_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
