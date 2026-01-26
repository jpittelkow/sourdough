"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Home, Settings } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const { user } = useAuth();
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-16 flex flex-col border-r bg-background z-30">
      {/* Top section - Home button */}
      <nav className="flex-1 p-2 flex flex-col items-center pt-4">
        <Link href="/dashboard">
          <Button
            variant={pathname === "/dashboard" ? "default" : "ghost"}
            size="icon"
            className={cn(
              "w-12 h-12",
              pathname === "/dashboard" && "bg-primary text-primary-foreground"
            )}
            title="Home"
          >
            <Home className="h-5 w-5" />
          </Button>
        </Link>
      </nav>

      {/* Separator */}
      <Separator orientation="horizontal" />

      {/* Bottom section - Settings button (admin only) */}
      {user?.is_admin && (
        <nav className="p-2 flex flex-col items-center pb-4">
          <Link href="/settings">
            <Button
              variant={pathname?.startsWith("/settings") ? "default" : "ghost"}
              size="icon"
              className={cn(
                "w-12 h-12",
                pathname?.startsWith("/settings") &&
                  "bg-primary text-primary-foreground"
              )}
              title="Settings"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </Link>
        </nav>
      )}
    </aside>
  );
}
