"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAppConfig } from "@/lib/app-config";
import { errorLogger } from "@/lib/error-logger";

/**
 * Hook to set page title and meta tags dynamically.
 * 
 * @param pageTitle - Optional page-specific title (e.g., "Dashboard")
 * @param description - Optional meta description
 * 
 * @example
 * // Just app name
 * usePageTitle();
 * 
 * // Page name + app name
 * usePageTitle('Dashboard');
 * 
 * // With description
 * usePageTitle('Dashboard', 'Manage your account settings');
 */
export function usePageTitle(pageTitle?: string, description?: string) {
  const { appName, isLoading } = useAppConfig();
  const pathname = usePathname();

  useEffect(() => {
    // Always update title when appName is available (backend ensures it always has a value)
    if (!isLoading && appName) {
      // Calculate the full title once
      const fullTitle = (pageTitle && pageTitle.trim()) ? `${pageTitle} | ${appName}` : appName;
      
      const updateTitle = () => {
        // Force update document.title - use Object.defineProperty to ensure it sticks
        try {
          document.title = fullTitle;
          // Also update the title element directly if it exists
          const titleElement = document.querySelector('title');
          if (titleElement) {
            titleElement.textContent = fullTitle;
          }
        } catch (e) {
          // Fallback if direct assignment fails
          errorLogger.captureMessage(
            "Failed to update document.title",
            "warning",
            { error: e instanceof Error ? e.message : String(e) }
          );
        }

        // Update meta description if provided
        if (description) {
          let metaDescription = document.querySelector('meta[name="description"]');
          if (!metaDescription) {
            metaDescription = document.createElement('meta');
            metaDescription.setAttribute('name', 'description');
            document.head.appendChild(metaDescription);
          }
          metaDescription.setAttribute('content', description);
        }

        // Update Open Graph title
        let ogTitle = document.querySelector('meta[property="og:title"]');
        if (!ogTitle) {
          ogTitle = document.createElement('meta');
          ogTitle.setAttribute('property', 'og:title');
          document.head.appendChild(ogTitle);
        }
        ogTitle.setAttribute('content', fullTitle);
      };

      // Update immediately (synchronously) to minimize flash
      if (typeof window !== 'undefined') {
        updateTitle();
      }

      // Use setTimeout to ensure this runs after render phase completes
      // This prevents the React warning about updating during render
      const timeoutId = setTimeout(() => {
        updateTitle();
        
        // Also update after requestAnimationFrame to catch any late updates
        requestAnimationFrame(() => {
          updateTitle();
        });
        
        // Additional updates to ensure it overrides anything else
        setTimeout(updateTitle, 50);
        setTimeout(updateTitle, 200);
      }, 0);
      
      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [appName, pageTitle, description, pathname, isLoading]);
}
