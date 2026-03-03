import React, { createContext, useContext, useState, useCallback } from "react";

export type UserRole = "super_admin" | "admin" | "user";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenantId: string;
  tenantName: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// Mock users for demo
const MOCK_USERS: Record<string, User & { password: string }> = {
  "super@syntex.io": { id: "sa-1", name: "Super Admin", email: "super@syntex.io", password: "admin123", role: "super_admin", tenantId: "syntex", tenantName: "Syntex OS" },
  "admin@quimicabr.com": { id: "a-1", name: "Carlos Silva", email: "admin@quimicabr.com", password: "admin123", role: "admin", tenantId: "tenant-1", tenantName: "Química BR Ltda" },
  "user@quimicabr.com": { id: "u-1", name: "Ana Souza", email: "user@quimicabr.com", password: "user123", role: "user", tenantId: "tenant-1", tenantName: "Química BR Ltda" },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback((email: string, password: string) => {
    const found = MOCK_USERS[email];
    if (found && found.password === password) {
      const { password: _, ...userData } = found;
      setUser(userData);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => setUser(null), []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
