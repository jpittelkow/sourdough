"use client";

import { create } from "zustand";
import { api } from "./api";

interface User {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  is_admin: boolean;
  email_verified_at: string | null;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  fetchUser: () => Promise<void>;
  initialize: () => Promise<void>;
  login: (email: string, password: string, remember?: boolean) => Promise<any>;
  register: (name: string, email: string, password: string, passwordConfirmation: string) => Promise<void>;
  logout: () => Promise<void>;
  verify2FA: (code: string, remember?: boolean, isRecoveryCode?: boolean) => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isInitialized: false,
  error: null,

  fetchUser: async () => {
    try {
      const response = await api.get("/auth/user");
      set({ user: response.data.user, isLoading: false, error: null });
    } catch (error) {
      set({ user: null, isLoading: false, error: null });
    }
  },

  initialize: async () => {
    // Prevent multiple initializations
    if (get().isInitialized) {
      return;
    }
    set({ isInitialized: true });
    await get().fetchUser();
  },

  login: async (email: string, password: string, remember = false) => {
    // Get CSRF cookie first
    await api.get("/sanctum/csrf-cookie", {
      baseURL: process.env.NEXT_PUBLIC_API_URL || "",
    });

    const response = await api.post("/auth/login", {
      email,
      password,
      remember,
    });

    if (response.data.requires_2fa) {
      return { requires_2fa: true };
    }

    set({ user: response.data.user, isLoading: false, error: null });
    return response.data;
  },

  register: async (name: string, email: string, password: string, passwordConfirmation: string) => {
    // Get CSRF cookie first
    await api.get("/sanctum/csrf-cookie", {
      baseURL: process.env.NEXT_PUBLIC_API_URL || "",
    });

    const response = await api.post("/auth/register", {
      name,
      email,
      password,
      password_confirmation: passwordConfirmation,
    });

    set({ user: response.data.user, isLoading: false, error: null });
  },

  logout: async () => {
    await api.post("/auth/logout");
    set({ user: null, error: null });
  },

  verify2FA: async (code: string, remember = false, isRecoveryCode = false) => {
    const response = await api.post("/auth/2fa/verify", {
      code,
      remember,
      is_recovery_code: isRecoveryCode,
    });

    set({ user: response.data.user, isLoading: false, error: null });
  },
}));

// Export a hook for components to initialize auth state after mount
// This prevents race conditions with SSR hydration
export function useInitializeAuth() {
  const { initialize, isInitialized } = useAuth();

  // Use useEffect in the consuming component to call initialize()
  // This ensures it runs after hydration
  return { initialize, isInitialized };
}
