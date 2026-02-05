"use client";

import { useState } from "react";
import Image from "next/image";
import { useAppConfig } from "@/lib/app-config";
import { cn } from "@/lib/utils";

export interface LogoProps {
  /** Display variant */
  variant?: "full" | "icon" | "text";
  /** Size preset */
  size?: "sm" | "md" | "lg";
  /** Additional CSS classes */
  className?: string;
}

const sizeConfig = {
  sm: {
    icon: "h-6 w-6",
    text: "text-sm",
    full: "h-6",
    gap: "gap-1.5",
  },
  md: {
    icon: "h-8 w-8",
    text: "text-lg",
    full: "h-8",
    gap: "gap-2",
  },
  lg: {
    icon: "h-10 w-10",
    text: "text-xl",
    full: "h-10",
    gap: "gap-2.5",
  },
};

/**
 * Logo component with multiple display variants and automatic fallbacks.
 * 
 * - `full`: Shows logo image (replaces app name) or icon + app name if no logo
 * - `icon`: Shows favicon image (falls back to first letter in styled container)
 * - `text`: Shows app name as text only
 */
export function Logo({ variant = "full", size = "md", className }: LogoProps) {
  const [logoError, setLogoError] = useState(false);
  const [faviconError, setFaviconError] = useState(false);
  const { appName, logoUrl, faviconUrl } = useAppConfig();
  const sizes = sizeConfig[size];
  
  // Use logo from settings if present (no fallback to APP_CONFIG since logo is optional)
  const currentLogo = logoUrl;

  // Text-only variant
  if (variant === "text") {
    return (
      <span className={cn("font-semibold", sizes.text, className)} suppressHydrationWarning>
        {appName}
      </span>
    );
  }

  // Icon variant (for collapsed sidebar)
  if (variant === "icon") {
    // If favicon exists, show it
    if (faviconUrl && !faviconError) {
      return (
        <Image
          src={faviconUrl}
          alt={appName || ''}
          width={size === "sm" ? 24 : size === "md" ? 32 : 40}
          height={size === "sm" ? 24 : size === "md" ? 32 : 40}
          className={cn("object-contain", className)}
          onError={() => setFaviconError(true)}
          unoptimized
        />
      );
    }

    // Fallback: First character of app name in styled square container
    const iconChar = appName ? appName.charAt(0).toUpperCase() : '';
    return (
      <div
        className={cn(
          sizes.icon,
          "flex items-center justify-center rounded-md bg-primary text-primary-foreground font-bold",
          size === "sm" && "text-xs",
          size === "md" && "text-sm",
          size === "lg" && "text-base",
          className
        )}
        suppressHydrationWarning
      >
        {iconChar}
      </div>
    );
  }

  // Full variant (logo replaces app name, or icon + name fallback)
  // Order: logo from settings → app name from settings (app_name always has a default)
  const hasLogo = currentLogo && !logoError;

  // If logo exists, show only the logo (replaces app name)
  if (hasLogo) {
    return (
      <div className={cn("relative flex-shrink-0", sizes.full, "w-auto max-w-[200px]", className)}>
        <Image
          src={currentLogo}
          alt={appName || ''}
          width={200}
          height={size === "sm" ? 24 : size === "md" ? 32 : 40}
          className="object-contain"
          onError={() => setLogoError(true)}
          unoptimized
        />
      </div>
    );
  }

  // No logo: show icon + app name
  return (
    <div className={cn("flex items-center", sizes.gap, className)}>
      <div
        className={cn(
          sizes.icon,
          "flex items-center justify-center rounded-md bg-primary text-primary-foreground font-bold flex-shrink-0",
          size === "sm" && "text-xs",
          size === "md" && "text-sm",
          size === "lg" && "text-base"
        )}
        suppressHydrationWarning
      >
        {appName ? appName.charAt(0).toUpperCase() : ''}
      </div>
      <span className={cn("font-semibold", sizes.text)} suppressHydrationWarning>{appName}</span>
    </div>
  );
}
