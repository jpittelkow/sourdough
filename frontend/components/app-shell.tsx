"use client";

import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { SidebarProvider, useSidebar } from "@/components/sidebar-context";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
}

function AppShellContent({ children }: AppShellProps) {
  const { isExpanded } = useSidebar();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className={cn("transition-all duration-300", isExpanded ? "pl-56" : "pl-16")}>
        <Header />
        <main>{children}</main>
      </div>
    </div>
  );
}

export function AppShell({ children }: AppShellProps) {
  return (
    <SidebarProvider>
      <AppShellContent>{children}</AppShellContent>
    </SidebarProvider>
  );
}
