"use client";

import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { SidebarProvider, useSidebar } from "@/components/sidebar-context";
import { SearchProvider } from "@/components/search/search-provider";
import { PageTitleManager } from "@/components/page-title-manager";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
}

function AppShellContent({ children }: AppShellProps) {
  const { isExpanded } = useSidebar();

  return (
    <div className="min-h-screen bg-background">
      <PageTitleManager />
      <Sidebar />
      <div
        className={cn(
          "transition-all duration-300",
          "pl-0",
          isExpanded ? "md:pl-56" : "md:pl-16"
        )}
      >
        <Header />
        <main className="px-4 sm:px-6 md:px-0">{children}</main>
      </div>
    </div>
  );
}

export function AppShell({ children }: AppShellProps) {
  return (
    <SidebarProvider>
      <SearchProvider>
        <AppShellContent>{children}</AppShellContent>
      </SearchProvider>
    </SidebarProvider>
  );
}
