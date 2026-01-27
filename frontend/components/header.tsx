"use client";

import { UserDropdown } from "@/components/user-dropdown";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-end px-4">
        <UserDropdown />
      </div>
    </header>
  );
}
