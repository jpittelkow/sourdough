"use client";

import { usePathname } from "next/navigation";
import { usePageTitle } from "@/lib/use-page-title";

/**
 * Route-to-title mapping for automatic page title detection.
 * Maps pathnames to their display titles.
 */
const routeTitles: Record<string, string> = {
  // Landing & Auth
  "/": "Welcome",
  "/login": "Sign In",
  "/register": "Create Account",
  "/forgot-password": "Forgot Password",
  "/reset-password": "Reset Password",
  "/verify-email": "Verify Email",

  // Dashboard
  "/dashboard": "Dashboard",

  // Configuration
  "/configuration/system": "System Settings",
  "/configuration/branding": "Theme & Branding",
  "/configuration/notifications": "Notifications",
  "/configuration/ai": "AI Settings",
  "/configuration/llm-system": "LLM system settings",
  "/configuration/backup": "Backup & Restore",
  "/configuration/email": "Email Settings",
  "/configuration/storage": "Storage",
  "/configuration/api": "API Keys",
  "/configuration/jobs": "Background Jobs",
  "/configuration/audit": "Audit Log",
  "/configuration/users": "User Management",
  "/configuration/security": "Security",
  "/configuration/profile": "Profile",

  // User pages
  "/user/profile": "Profile",
  "/user/security": "Security",
  "/user/preferences": "Preferences",

  // Admin pages
  "/admin": "Admin",
  "/admin/users": "User Management",
  "/admin/audit": "Audit Log",
  "/admin/jobs": "Background Jobs",
  "/admin/backup": "Backup & Restore",

  // Settings (duplicate structure)
  "/settings": "Settings",
  "/settings/profile": "Profile",
  "/settings/branding": "Theme & Branding",
  "/settings/email": "Email Settings",
  "/settings/ai": "AI Settings",
  "/settings/api": "API Keys",
  "/settings/storage": "Storage",
  "/settings/notifications": "Notifications",
  "/settings/system": "System Settings",
  "/settings/security": "Security",
};

/**
 * PageTitleManager automatically sets page titles based on the current route.
 * This component should be placed in the AppShell to apply globally.
 */
export function PageTitleManager() {
  const pathname = usePathname();
  const pageTitle = routeTitles[pathname];

  usePageTitle(pageTitle);

  return null; // This component renders nothing
}
