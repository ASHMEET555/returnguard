"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  merchant_id: string;
  merchant_name: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (fullName: string, email: string, password: string, orgName: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  const baseUrl = process.env.NEXT_PUBLIC_RETURNGUARD_API_URL || "http://127.0.0.1:8000";

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch(`${baseUrl}/v1/auth/me`, {
        method: "GET",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch(`${baseUrl}/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        return { success: true };
      }
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.detail || "Invalid email or password." };
    } catch (e: any) {
      return { success: false, error: e.message || "Network error. Please try again." };
    }
  };

  const register = async (fullName: string, email: string, password: string, orgName: string) => {
    try {
      const res = await fetch(`${baseUrl}/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          full_name: fullName,
          email,
          password,
          organization_name: orgName,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        return { success: true };
      }
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.detail || "Registration failed." };
    } catch (e: any) {
      return { success: false, error: e.message || "Network error. Please try again." };
    }
  };

  const logout = async () => {
    try {
      await fetch(`${baseUrl}/v1/auth/logout`, {
        method: "DELETE",
        credentials: "include",
      });
    } catch (e) {
      console.warn("Logout error:", e);
    } finally {
      setUser(null);
      router.push("/login");
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
