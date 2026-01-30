"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/lib/use-mobile";
import { useVersion } from "@/lib/version-provider";
import { useAppConfig } from "@/lib/app-config";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Settings,
  Globe,
  Users,
  Bell,
  Brain,
  Mail,
  HardDrive,
  Key,
  Palette,
  FileText,
  Clock,
  Database,
  Menu,
  LogIn,
  MailOpen,
} from "lucide-react";

const navigation = [
  {
    name: "System",
    href: "/configuration/system",
    icon: Globe,
    description: "Application-wide settings",
  },
  {
    name: "Users",
    href: "/configuration/users",
    icon: Users,
    description: "Manage application users",
  },
  {
    name: "Notifications",
    href: "/configuration/notifications",
    icon: Bell,
    description: "Configure notification channels",
  },
  {
    name: "AI / LLM",
    href: "/configuration/ai",
    icon: Brain,
    description: "LLM providers and modes",
  },
  {
    name: "Email",
    href: "/configuration/email",
    icon: Mail,
    description: "Email delivery configuration",
  },
  {
    name: "Email Templates",
    href: "/configuration/email-templates",
    icon: MailOpen,
    description: "Customize system emails",
  },
  {
    name: "SSO",
    href: "/configuration/sso",
    icon: LogIn,
    description: "Single sign-on providers",
  },
  {
    name: "Storage",
    href: "/configuration/storage",
    icon: HardDrive,
    description: "File storage configuration",
  },
  {
    name: "API & Webhooks",
    href: "/configuration/api",
    icon: Key,
    description: "API tokens and webhooks",
  },
  {
    name: "Theme & Branding",
    href: "/configuration/branding",
    icon: Palette,
    description: "Visual customization",
  },
  {
    name: "Audit Log",
    href: "/configuration/audit",
    icon: FileText,
    description: "View system activity logs",
  },
  {
    name: "Jobs",
    href: "/configuration/jobs",
    icon: Clock,
    description: "Monitor scheduled jobs",
  },
  {
    name: "Backup & Restore",
    href: "/configuration/backup",
    icon: Database,
    description: "Manage system backups",
  },
];

// Navigation items component to avoid duplication
function NavigationItems({ pathname }: { pathname: string }) {
  return (
    <nav className="space-y-1">
      {navigation.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 min-h-11 text-sm transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            <div className="flex flex-col">
              <span className="font-medium">{item.name}</span>
              <span
                className={cn(
                  "text-xs",
                  isActive
                    ? "text-primary-foreground/70"
                    : "text-muted-foreground"
                )}
              >
                {item.description}
              </span>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}

// Version footer component
function VersionFooter() {
  const { version, buildSha } = useVersion();
  const { appName } = useAppConfig();
  
  if (!version) {
    return null;
  }

  const displayName = appName || "Sourdough";
  const shortSha = buildSha && buildSha !== "development" 
    ? buildSha.substring(0, 7) 
    : null;

  return (
    <div className="mt-auto pt-4 border-t">
      <p className="text-xs text-muted-foreground px-3">
        {displayName} v{version}
        {shortSha && ` • Build ${shortSha}`}
      </p>
    </div>
  );
}

export default function ConfigurationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isLoading && (!user || !user.is_admin)) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  // Close drawer on navigation
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user?.is_admin) {
    return null;
  }

  // Mobile layout: header with menu button + Sheet drawer
  if (isMobile) {
    return (
      <div className="container py-6">
        {/* Mobile header */}
        <div className="mb-6 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 min-w-11 shrink-0"
            onClick={() => setIsMenuOpen(true)}
            title="Open configuration menu"
            aria-label="Open configuration menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <span className="font-semibold">Configuration</span>
          </div>
        </div>

        {/* Mobile drawer */}
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetContent
            side="left"
            className="w-96 max-w-[100vw] p-0 flex flex-col"
          >
            <div className="flex flex-col h-full pt-14 px-3 pb-4">
              <SheetHeader className="mb-4 border-b pb-3">
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-muted-foreground" />
                  <SheetTitle>Configuration</SheetTitle>
                </div>
              </SheetHeader>
              <div className="flex-1 flex flex-col">
                <NavigationItems pathname={pathname} />
                <VersionFooter />
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Main content */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    );
  }

  // Desktop layout: sidebar + content (unchanged)
  return (
    <div className="container py-6">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="lg:w-64 shrink-0 flex flex-col">
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-muted-foreground" />
              <span className="font-semibold">Configuration</span>
            </div>
          </div>
          <div className="flex-1 flex flex-col">
            <NavigationItems pathname={pathname} />
            <VersionFooter />
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
