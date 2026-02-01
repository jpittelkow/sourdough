"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { applyThemeColors } from "@/lib/theme-colors";

export interface AppConfigFeatures {
  emailConfigured: boolean;
  passwordResetAvailable: boolean;
  emailVerificationAvailable: boolean;
  emailVerificationMode?: string;
  twoFactorMode?: string;
  passkeyMode?: string;
  searchEnabled?: boolean;
  webpushEnabled?: boolean;
  webpushVapidPublicKey?: string;
}

interface AppConfigState {
  appName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  customCss: string | null;
  features: AppConfigFeatures | null;
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
        const features = systemSettingsResponse?.data?.features;

        // Backend ensures app_name always has a default value, so it should always be present
        return {
          appName: systemSettings.general?.app_name || '',
          logoUrl: branding.logo_url || null,
          faviconUrl: branding.favicon_url || null,
          primaryColor: branding.primary_color || null,
          secondaryColor: branding.secondary_color || null,
          customCss: branding.custom_css || null,
          features: features
            ? {
                emailConfigured: !!features.email_configured,
                passwordResetAvailable: !!features.password_reset_available,
                emailVerificationAvailable: !!features.email_verification_available,
                emailVerificationMode: features.email_verification_mode ?? "optional",
                twoFactorMode: features.two_factor_mode ?? "optional",
                passkeyMode: features.passkey_mode ?? "disabled",
                searchEnabled: features.search_enabled !== false,
                webpushEnabled: !!features.webpush_enabled,
                webpushVapidPublicKey: features.webpush_vapid_public_key ?? undefined,
              }
            : null,
        };
      } catch (error) {
        // If API fails, return empty values - components should handle loading/error states
        // The backend should always return app_name, so this is a fallback for network issues
        return {
          appName: '',
          logoUrl: null,
          faviconUrl: null,
          primaryColor: null,
          secondaryColor: null,
          customCss: null,
          features: null,
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

  // Backend ensures app_name always has a default value, so it should always be present
  const appName = query.data?.appName || '';
  const logoUrl = query.data?.logoUrl || null;
  const faviconUrl = query.data?.faviconUrl || null;
  const primaryColor = query.data?.primaryColor || null;
  const secondaryColor = query.data?.secondaryColor || null;
  const customCss = query.data?.customCss || null;
  const features = query.data?.features ?? null;

  // Apply theme colors when they're loaded
  React.useEffect(() => {
    if (query.data && !query.isLoading) {
      applyThemeColors(primaryColor || undefined, secondaryColor || undefined);
    }
  }, [primaryColor, secondaryColor, query.data, query.isLoading]);

  // Update favicon and related icons when they change
  React.useEffect(() => {
    if (faviconUrl) {
      // Update favicon link
      let faviconLink = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!faviconLink) {
        faviconLink = document.createElement('link');
        faviconLink.rel = 'icon';
        document.head.appendChild(faviconLink);
      }
      faviconLink.href = faviconUrl;

      // Update Apple touch icon (uses same favicon)
      let appleLink = document.querySelector("link[rel~='apple-touch-icon']") as HTMLLinkElement;
      if (!appleLink) {
        appleLink = document.createElement('link');
        appleLink.rel = 'apple-touch-icon';
        document.head.appendChild(appleLink);
      }
      appleLink.href = faviconUrl;

      // Manifest is now dynamically generated via /api/manifest route
      // which uses the uploaded favicon for PWA icons
      // The manifest link in layout.tsx already points to /api/manifest
    }
  }, [faviconUrl]);

  // Inject custom CSS when it changes
  React.useEffect(() => {
    if (query.data && !query.isLoading) {
      let styleTag = document.getElementById('custom-branding-css');
      if (customCss) {
        if (!styleTag) {
          styleTag = document.createElement('style');
          styleTag.id = 'custom-branding-css';
          document.head.appendChild(styleTag);
        }
        styleTag.textContent = customCss;
      } else {
        // Remove style tag if custom CSS is cleared
        if (styleTag) {
          styleTag.remove();
        }
      }
    }
  }, [customCss, query.data, query.isLoading]);

  const value: AppConfigState = {
    appName,
    logoUrl,
    faviconUrl,
    primaryColor,
    secondaryColor,
    customCss,
    features,
    isLoading: query.isLoading,
    error: query.error as Error | null,
  };

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
      appName: '',
      logoUrl: null,
      faviconUrl: null,
      primaryColor: null,
      secondaryColor: null,
      customCss: null,
      features: null,
      isLoading: false,
      error: null,
    };
  }

  return context;
}
