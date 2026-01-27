"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
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

export default function ConfigurationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && (!user || !user.is_admin)) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

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

  return (
    <div className="container py-6">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="lg:w-64 shrink-0">
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-muted-foreground" />
              <span className="font-semibold">Configuration</span>
            </div>
          </div>
          <nav className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
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
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
