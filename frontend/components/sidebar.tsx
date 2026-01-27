"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/logo";
import { Home, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/sidebar-context";

export function Sidebar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const { isExpanded, toggleSidebar } = useSidebar();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen flex flex-col border-r bg-background z-30 transition-all duration-300",
        isExpanded ? "w-56" : "w-16"
      )}
    >
      {/* Logo and toggle section */}
      <div
        className={cn(
          "flex items-center border-b p-3 min-h-[57px]",
          isExpanded ? "justify-between" : "justify-center"
        )}
      >
        {isExpanded ? (
          <>
            <Logo variant="full" size="sm" />
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="h-7 w-7 flex-shrink-0"
              title="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <button
            onClick={toggleSidebar}
            className="flex items-center justify-center hover:opacity-80 transition-opacity"
            title="Expand sidebar"
          >
            <Logo variant="icon" size="sm" />
          </button>
        )}
      </div>

      {/* Top section - Home button */}
      <nav className="flex-1 p-2 flex flex-col pt-4">
        <Link href="/dashboard">
          <Button
            variant={pathname === "/dashboard" ? "default" : "ghost"}
            size={isExpanded ? "default" : "icon"}
            className={cn(
              isExpanded ? "w-full justify-start gap-3" : "w-12 h-12 mx-auto",
              pathname === "/dashboard" && "bg-primary text-primary-foreground"
            )}
            title="Home"
          >
            <Home className="h-5 w-5 flex-shrink-0" />
            {isExpanded && <span>Home</span>}
          </Button>
        </Link>
      </nav>

      {/* Separator */}
      <Separator orientation="horizontal" />

      {/* Bottom section - Configuration button (admin only) */}
      {user?.is_admin && (
        <nav className="p-2 flex flex-col gap-2 pb-4">
          <Link href="/configuration">
            <Button
              variant={pathname?.startsWith("/configuration") ? "default" : "ghost"}
              size={isExpanded ? "default" : "icon"}
              className={cn(
                isExpanded ? "w-full justify-start gap-3" : "w-12 h-12 mx-auto",
                pathname?.startsWith("/configuration") &&
                  "bg-primary text-primary-foreground"
              )}
              title="Configuration"
            >
              <Settings className="h-5 w-5 flex-shrink-0" />
              {isExpanded && <span>Configuration</span>}
            </Button>
          </Link>
        </nav>
      )}
    </aside>
  );
}
