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
  const { appName, logoUrl } = useAppConfig();
  const sizes = sizeConfig[size];
  
  // Use logo from settings if present (no fallback to APP_CONFIG since logo is optional)
  const currentLogo = logoUrl;

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
    // For icon variant, we use the first character of app name as fallback
    // (no separate icon from settings currently, but could be added later)
    const iconChar = appName.charAt(0).toUpperCase();

    // Fallback: First character of app name in styled square container
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
        {iconChar}
      </div>
    );
  }

  // Full variant (logo + name, or text-only fallback)
  // Order: logo from settings → app name from settings (app_name always has a default)
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
        // No logo: show first character of app name in styled icon container before text
        <div
          className={cn(
            sizes.icon,
            "flex items-center justify-center rounded-md bg-primary text-primary-foreground font-bold flex-shrink-0",
            size === "sm" && "text-xs",
            size === "md" && "text-sm",
            size === "lg" && "text-base"
          )}
        >
          {appName.charAt(0).toUpperCase()}
        </div>
      )}
      <span className={cn("font-semibold", sizes.text)}>{appName}</span>
    </div>
  );
}
