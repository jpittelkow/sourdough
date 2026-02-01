"use client";

import { useState } from "react";
import { Download, X } from "lucide-react";
import { useInstallPrompt } from "@/lib/use-install-prompt";
import { useAppConfig } from "@/lib/app-config";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

const APP_NAME_FALLBACK = "Sourdough";

/**
 * Non-intrusive PWA install banner shown at the bottom after 2+ visits.
 * Dismissible with "Don't show again" (30-day cooldown).
 * Respects prefers-reduced-motion.
 */
export function InstallPrompt() {
  const { shouldShowBanner, promptInstall, dismissBanner } = useInstallPrompt();
  const { appName } = useAppConfig();
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [isPrompting, setIsPrompting] = useState(false);

  const appDisplayName = appName || APP_NAME_FALLBACK;

  if (!shouldShowBanner) return null;

  const handleInstall = async () => {
    setIsPrompting(true);
    try {
      await promptInstall();
    } finally {
      setIsPrompting(false);
    }
  };

  const handleDismiss = () => {
    dismissBanner(dontShowAgain);
  };

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 flex justify-center p-4 pointer-events-none"
      role="dialog"
      aria-label={`Install ${appDisplayName} app`}
    >
      <div className="pointer-events-auto w-full max-w-md">
        <Card
          className={cn(
            "shadow-lg border bg-card",
            !prefersReducedMotion && "animate-in slide-in-from-bottom-4 duration-300"
          )}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  Install {appDisplayName}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Add to your home screen for quick access and offline use.
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <Button
                    size="sm"
                    onClick={handleInstall}
                    disabled={isPrompting}
                    className="gap-1.5"
                  >
                    <Download className="h-4 w-4" aria-hidden />
                    {isPrompting ? "Installing…" : "Install"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleDismiss}
                    disabled={isPrompting}
                  >
                    Not now
                  </Button>
                </div>
                <label className="flex items-center gap-2 mt-3 cursor-pointer text-xs text-muted-foreground">
                  <Checkbox
                    checked={dontShowAgain}
                    onCheckedChange={(checked) =>
                      setDontShowAgain(checked === true)
                    }
                    aria-label="Don't show again"
                  />
                  <span>Don&apos;t show again</span>
                </label>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={handleDismiss}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
