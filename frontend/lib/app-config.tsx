"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { APP_CONFIG } from "@/config/app";

interface AppConfigState {
  appName: string;
  logoUrl: string | null;
  isLoading: boolean;
  error: Error | null;
}

const AppConfigContext = React.createContext<AppConfigState | undefined>(undefined);

/**
 * Fetches public system settings including app name and branding.
 * Uses React Query for caching (1 hour stale time).
 */
function useAppConfigQuery() {
  return useQuery({
    queryKey: ["app-config"],
    queryFn: async () => {
      try {
        // Fetch both system settings and branding in parallel
        const [systemSettingsResponse, brandingResponse] = await Promise.all([
          api.get("/system-settings/public").catch(() => null),
          api.get("/branding").catch(() => null),
        ]);

        const systemSettings = systemSettingsResponse?.data?.settings || {};
        const branding = brandingResponse?.data?.settings || {};

        return {
          appName:
            systemSettings.general?.app_name ||
            process.env.NEXT_PUBLIC_APP_NAME ||
            APP_CONFIG.name,
          logoUrl: branding.logo_url || null,
        };
      } catch (error) {
        // Fallback to defaults on error
        return {
          appName:
            process.env.NEXT_PUBLIC_APP_NAME || APP_CONFIG.name,
          logoUrl: null,
        };
      }
    },
    staleTime: 60 * 60 * 1000, // 1 hour cache
    gcTime: 24 * 60 * 60 * 1000, // 24 hours garbage collection
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

/**
 * Provider component that fetches and provides app configuration.
 */
export function AppConfigProvider({ children }: { children: React.ReactNode }) {
  const query = useAppConfigQuery();

  const appName = query.data?.appName || process.env.NEXT_PUBLIC_APP_NAME || APP_CONFIG.name;
  const logoUrl = query.data?.logoUrl || null;

  const value: AppConfigState = {
    appName,
    logoUrl,
    isLoading: query.isLoading,
    error: query.error as Error | null,
  };

  // Update page title when app name changes or query completes
  // Use multiple attempts to ensure it overrides Next.js metadata
  React.useEffect(() => {
    const updateTitle = () => {
      if (appName) {
        document.title = appName;
        // Also update the meta title tag if it exists
        const titleTag = document.querySelector('title');
        if (titleTag) {
          titleTag.textContent = appName;
        }
      }
    };
    
    // Update immediately
    updateTitle();
    
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      updateTitle();
    });
    
    // Also update after delays to ensure it overrides Next.js metadata
    const timeoutId = setTimeout(updateTitle, 100);
    const timeoutId2 = setTimeout(updateTitle, 500);
    
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(timeoutId2);
    };
  }, [appName, query.data]); // Also depend on query.data to update when query completes

  return React.createElement(
    AppConfigContext.Provider,
    { value },
    children
  );
}

/**
 * Hook to access app configuration (app name, logo URL, etc.)
 * Falls back to environment variables or defaults if settings are not available.
 */
export function useAppConfig(): AppConfigState {
  const context = React.useContext(AppConfigContext);

  if (context === undefined) {
    // Fallback if used outside provider (shouldn't happen, but safe fallback)
    return {
      appName: process.env.NEXT_PUBLIC_APP_NAME || APP_CONFIG.name,
      logoUrl: null,
      isLoading: false,
      error: null,
    };
  }

  return context;
}
