"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/lib/auth";
import { AppConfigProvider } from "@/lib/app-config";
import { VersionProvider } from "@/lib/version-provider";
import { NotificationProvider } from "@/lib/notifications";
import { ErrorBoundary } from "@/components/error-boundary";
import { ErrorHandlerSetup } from "@/components/error-handler-setup";
import { ServiceWorkerSetup } from "@/components/service-worker-setup";

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { initialize, isInitialized } = useAuth();

  useEffect(() => {
    // Initialize auth state after component mounts (post-hydration)
    if (!isInitialized) {
      initialize();
    }
  }, [initialize, isInitialized]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <AppConfigProvider>
          <VersionProvider>
            <ThemeProvider defaultTheme="system" storageKey="sourdough-theme">
              <TooltipProvider delayDuration={300}>
                <ErrorHandlerSetup />
                <ServiceWorkerSetup />
                <AuthInitializer>
                  <NotificationProvider>{children}</NotificationProvider>
                </AuthInitializer>
                <Toaster richColors position="top-right" />
              </TooltipProvider>
            </ThemeProvider>
          </VersionProvider>
        </AppConfigProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}
