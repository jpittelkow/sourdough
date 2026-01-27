"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { useAuth } from "@/lib/auth";
import { AppConfigProvider } from "@/lib/app-config";

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
      <AppConfigProvider>
        <ThemeProvider defaultTheme="system" storageKey="sourdough-theme">
          <AuthInitializer>
            {children}
          </AuthInitializer>
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </AppConfigProvider>
    </QueryClientProvider>
  );
}
