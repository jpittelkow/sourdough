"use client";

import { useState } from "react";
import Image from "next/image";
import { APP_CONFIG } from "@/config/app";
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
 * - `full`: Shows logo image + app name (falls back to text-only if no image)
 * - `icon`: Shows square icon (falls back to short name in styled container)
 * - `text`: Shows app name as text only
 */
export function Logo({ variant = "full", size = "md", className }: LogoProps) {
  const [logoError, setLogoError] = useState(false);
  const [iconError, setIconError] = useState(false);
  const { appName, logoUrl } = useAppConfig();
  const sizes = sizeConfig[size];
  
  // Use dynamic logo URL from settings, fallback to APP_CONFIG
  const currentLogo = logoUrl || APP_CONFIG.logo;

  // Text-only variant
  if (variant === "text") {
    return (
      <span className={cn("font-semibold", sizes.text, className)}>
        {appName}
      </span>
    );
  }

  // Icon variant (for collapsed sidebar)
  if (variant === "icon") {
    const hasIcon = APP_CONFIG.icon && !iconError;

    if (hasIcon) {
      return (
        <div className={cn(sizes.icon, "relative", className)}>
          <Image
            src={APP_CONFIG.icon!}
            alt={appName}
            fill
            className="object-contain"
            onError={() => setIconError(true)}
          />
        </div>
      );
    }

    // Fallback: Short name in styled square container
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
      >
        {APP_CONFIG.shortName}
      </div>
    );
  }

  // Full variant (logo + name, or text-only fallback)
  // Use app name from settings when no logo is present
  const hasLogo = currentLogo && !logoError;

  return (
    <div className={cn("flex items-center", sizes.gap, className)}>
      {hasLogo ? (
        <div className={cn(sizes.full, "relative aspect-square")}>
          <Image
            src={currentLogo}
            alt={appName}
            fill
            className="object-contain"
            onError={() => setLogoError(true)}
          />
        </div>
      ) : (
        // No logo: show styled icon fallback before text
        <div
          className={cn(
            sizes.icon,
            "flex items-center justify-center rounded-md bg-primary text-primary-foreground font-bold flex-shrink-0",
            size === "sm" && "text-xs",
            size === "md" && "text-sm",
            size === "lg" && "text-base"
          )}
        >
          {APP_CONFIG.shortName}
        </div>
      )}
      <span className={cn("font-semibold", sizes.text)}>{appName}</span>
    </div>
  );
}
