"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, ApiClientError } from "@/lib/api";
import { clearStoredUser, getStoredUser, storeUser } from "@/lib/utils";
import type { AuthUser, LoginPayload, RegisterPayload } from "@/types";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setUser(getStoredUser());
    setIsLoading(false);
  }, []);

  const persistUser = useCallback((authUser: AuthUser) => {
    storeUser(authUser);
    setUser(authUser);
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const { user: authUser } = await api.auth.login(payload);
    persistUser(authUser);
  }, [persistUser]);

  const register = useCallback(async (payload: RegisterPayload) => {
    const { user: authUser } = await api.auth.register(payload);
    persistUser(authUser);
  }, [persistUser]);

  const logout = useCallback(() => {
    clearStoredUser();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAdmin: user?.role === "admin",
      login,
      register,
      logout,
    }),
    [user, isLoading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export { ApiClientError };
