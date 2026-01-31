"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth, isAdminUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/lib/use-mobile";
import { useVersion } from "@/lib/version-provider";
import { useAppConfig } from "@/lib/app-config";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  Terminal,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Search,
  UsersRound,
  MessageSquareText,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const CONFIG_NAV_STORAGE_KEY = "config-nav-expanded-groups";

type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  description: string;
  /** Permission required to see this item (e.g. settings.view). Omit for items visible to all config users. */
  permission?: string;
};

type NavGroup = {
  name: string;
  icon: LucideIcon;
  items: NavItem[];
};

const navigationGroups: NavGroup[] = [
  {
    name: "General",
    icon: Globe,
    items: [
      { name: "System", href: "/configuration/system", icon: Globe, description: "Application-wide settings", permission: "settings.view" },
      { name: "Theme & Branding", href: "/configuration/branding", icon: Palette, description: "Visual customization", permission: "settings.edit" },
    ],
  },
  {
    name: "Users & Access",
    icon: Users,
    items: [
      { name: "Users", href: "/configuration/users", icon: Users, description: "Manage application users", permission: "users.view" },
      { name: "Groups", href: "/configuration/groups", icon: UsersRound, description: "User groups and permissions", permission: "groups.view" },
      { name: "Security", href: "/configuration/security", icon: ShieldCheck, description: "Auth and security settings", permission: "settings.view" },
      { name: "SSO", href: "/configuration/sso", icon: LogIn, description: "Single sign-on providers", permission: "settings.view" },
      { name: "API & Webhooks", href: "/configuration/api", icon: Key, description: "API tokens and webhooks", permission: "settings.view" },
    ],
  },
  {
    name: "Communications",
    icon: Bell,
    items: [
      { name: "Notifications", href: "/configuration/notifications", icon: Bell, description: "Configure notification channels", permission: "settings.view" },
      { name: "Email", href: "/configuration/email", icon: Mail, description: "Email delivery configuration", permission: "settings.view" },
      { name: "Email Templates", href: "/configuration/email-templates", icon: MailOpen, description: "Customize system emails", permission: "settings.view" },
      { name: "Notification Templates", href: "/configuration/notification-templates", icon: MessageSquareText, description: "Per-type push, in-app, chat templates", permission: "settings.view" },
    ],
  },
  {
    name: "Integrations",
    icon: Brain,
    items: [
      { name: "AI / LLM", href: "/configuration/ai", icon: Brain, description: "LLM providers and modes", permission: "settings.view" },
      { name: "Storage", href: "/configuration/storage", icon: HardDrive, description: "File storage configuration", permission: "settings.view" },
      { name: "Search", href: "/configuration/search", icon: Search, description: "Manage search indexes", permission: "settings.view" },
    ],
  },
  {
    name: "Logs & Monitoring",
    icon: FileText,
    items: [
      { name: "Audit Log", href: "/configuration/audit", icon: FileText, description: "View system activity logs", permission: "audit.view" },
      { name: "Application Logs", href: "/configuration/logs", icon: Terminal, description: "Real-time console log viewer", permission: "logs.view" },
      { name: "Access Logs (HIPAA)", href: "/configuration/access-logs", icon: FileText, description: "PHI access audit trail", permission: "logs.view" },
      { name: "Log retention", href: "/configuration/log-retention", icon: FileText, description: "Retention and cleanup config", permission: "settings.view" },
      { name: "Jobs", href: "/configuration/jobs", icon: Clock, description: "Monitor scheduled jobs", permission: "settings.view" },
    ],
  },
  {
    name: "Data",
    icon: Database,
    items: [
      { name: "Backup & Restore", href: "/configuration/backup", icon: Database, description: "Manage system backups", permission: "backups.view" },
    ],
  },
];

const CONFIG_ACCESS_PERMISSIONS = [
  "settings.view",
  "settings.edit",
  "users.view",
  "groups.view",
  "audit.view",
  "logs.view",
  "backups.view",
];

function getGroupId(group: NavGroup, index: number): string {
  return `group-${index}-${group.name.replace(/\s+/g, "-").toLowerCase()}`;
}

function filterGroupsByPermission(
  groups: NavGroup[],
  permissions: string[] | undefined
): NavGroup[] {
  if (!permissions) return [];
  const hasPermission = (p: string) => permissions.includes(p);
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !item.permission || hasPermission(item.permission)
      ),
    }))
    .filter((group) => group.items.length > 0);
}

function getDefaultExpanded(pathname: string, groups: NavGroup[]): Set<string> {
  const expanded = new Set<string>();
  groups.forEach((group, index) => {
    const hasActive = group.items.some((item) => item.href === pathname);
    if (hasActive) {
      expanded.add(getGroupId(group, index));
    }
  });
  return expanded;
}

function loadStoredExpanded(pathname: string, groups: NavGroup[]): Set<string> {
  if (typeof window === "undefined") return getDefaultExpanded(pathname, groups);
  try {
    const raw = localStorage.getItem(CONFIG_NAV_STORAGE_KEY);
    if (!raw) return getDefaultExpanded(pathname, groups);
    const stored = JSON.parse(raw) as string[];
    return new Set(stored);
  } catch {
    return getDefaultExpanded(pathname, groups);
  }
}

function saveStoredExpanded(expanded: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      CONFIG_NAV_STORAGE_KEY,
      JSON.stringify(Array.from(expanded))
    );
  } catch {
    // ignore
  }
}

// Grouped navigation with collapsible sections (filtered by user permissions)
function GroupedNavigation({ pathname }: { pathname: string }) {
  const { user } = useAuth();
  const filteredGroups = useMemo(
    () => filterGroupsByPermission(navigationGroups, user?.permissions),
    [user?.permissions]
  );
  const [expanded, setExpanded] = useState<Set<string>>(() =>
    getDefaultExpanded(pathname, filteredGroups)
  );

  // Hydrate from localStorage after mount
  useEffect(() => {
    setExpanded((prev) => {
      const stored = loadStoredExpanded(pathname, filteredGroups);
      return stored.size > 0 ? stored : prev;
    });
  }, [pathname, filteredGroups]);

  // Ensure active group is expanded when pathname changes
  useEffect(() => {
    const defaultExpanded = getDefaultExpanded(pathname, filteredGroups);
    setExpanded((prev) => {
      const next = new Set(prev);
      defaultExpanded.forEach((id) => next.add(id));
      return next;
    });
  }, [pathname, filteredGroups]);

  return (
    <nav className="space-y-1" aria-label="Configuration navigation">
      {filteredGroups.map((group, groupIndex) => {
        const groupId = getGroupId(group, groupIndex);
        const isExpanded = expanded.has(groupId);
        const hasActive = group.items.some((item) => item.href === pathname);

        return (
          <Collapsible
            key={groupId}
            open={isExpanded}
            onOpenChange={(open) => {
              if (open) {
                setExpanded((prev) => {
                  const next = new Set(prev);
                  next.add(groupId);
                  saveStoredExpanded(next);
                  return next;
                });
              } else {
                setExpanded((prev) => {
                  const next = new Set(prev);
                  next.delete(groupId);
                  saveStoredExpanded(next);
                  return next;
                });
              }
            }}
          >
            <CollapsibleTrigger
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 min-h-11 text-sm transition-colors duration-200",
                "text-muted-foreground hover:bg-muted hover:text-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                hasActive && "text-foreground font-medium"
              )}
              aria-expanded={isExpanded}
              aria-controls={`${groupId}-content`}
              id={`${groupId}-trigger`}
            >
              <group.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left">{group.name}</span>
              {isExpanded ? (
                <ChevronDown
                  className="h-4 w-4 shrink-0 transition-transform duration-200"
                  aria-hidden
                />
              ) : (
                <ChevronRight
                  className="h-4 w-4 shrink-0 transition-transform duration-200"
                  aria-hidden
                />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent
              id={`${groupId}-content`}
              className="overflow-hidden duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-2"
            >
              <div className="ml-4 mt-1 space-y-0.5 border-l border-muted pl-3">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-2 py-2 min-h-10 text-sm transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium truncate">{item.name}</span>
                        <span
                          className={cn(
                            "text-xs truncate",
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
              </div>
            </CollapsibleContent>
          </Collapsible>
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
  const hasConfigAccess =
    isAdminUser(user) ||
    CONFIG_ACCESS_PERMISSIONS.some((p) => user?.permissions?.includes(p));

  useEffect(() => {
    if (!isLoading && (!user || !hasConfigAccess)) {
      router.push("/dashboard");
    }
  }, [user, isLoading, hasConfigAccess, router]);

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

  if (!hasConfigAccess) {
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
                <GroupedNavigation pathname={pathname} />
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
            <GroupedNavigation pathname={pathname} />
            <VersionFooter />
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
