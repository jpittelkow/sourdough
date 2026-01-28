"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserDropdown } from "@/components/user-dropdown";
import { useSidebar } from "@/components/sidebar-context";
import { NotificationBell } from "@/components/notifications/notification-bell";

export function Header() {
  const { setMobileMenuOpen } = useSidebar();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between md:justify-end pl-4 pr-5 sm:pr-6 md:px-4 gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-11 w-11 min-w-11 shrink-0"
          onClick={() => setMobileMenuOpen(true)}
          title="Open menu"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-1 ml-auto md:ml-0">
          <NotificationBell />
          <UserDropdown />
        </div>
      </div>
    </header>
  );
}
