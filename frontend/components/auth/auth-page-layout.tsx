"use client";

import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { usePageTitle } from "@/lib/use-page-title";

interface AuthPageLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function AuthPageLayout({
  title,
  description,
  children,
  className,
}: AuthPageLayoutProps) {
  // Set page title with app name from config
  usePageTitle(title);

  return (
    <div
      className={cn(
        "min-h-screen flex items-center justify-center p-4",
        "bg-gradient-to-br from-primary/10 via-background to-secondary/10",
        "transition-colors duration-300"
      )}
    >
      <div
        className={cn(
          "w-full max-w-md rounded-2xl p-6 sm:p-8 space-y-6",
          "backdrop-blur-xl bg-card/80",
          "border border-border/20",
          "shadow-2xl",
          "animate-in fade-in-0 slide-in-from-bottom-4 duration-500",
          className
        )}
      >
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Logo variant="full" size="lg" />
          </div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-2">{description}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
