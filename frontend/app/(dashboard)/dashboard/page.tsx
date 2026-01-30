"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import {
  User,
  Shield,
  Bell,
  Brain,
  Database,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { AuditDashboardWidget } from "@/components/audit/audit-dashboard-widget";

const settingsCards = [
  {
    title: "Profile Settings",
    description: "Update your profile, password, and account settings.",
    href: "/user/profile",
    icon: User,
  },
  {
    title: "Security",
    description: "Manage 2FA, SSO connections, and security settings.",
    href: "/user/security",
    icon: Shield,
  },
  {
    title: "Notifications",
    description: "Configure notification channels and preferences.",
    href: "/configuration/notifications",
    icon: Bell,
  },
  {
    title: "AI/LLM Settings",
    description: "Configure LLM providers and orchestration mode.",
    href: "/configuration/ai",
    icon: Brain,
  },
];

interface SuspiciousAlert {
  type: string;
  message: string;
  count: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [suspiciousAlerts, setSuspiciousAlerts] = useState<SuspiciousAlert[]>([]);

  useEffect(() => {
    if (!user?.is_admin) return;
    api
      .get<{ alerts: SuspiciousAlert[]; has_alerts: boolean }>("/suspicious-activity")
      .then((res) => res.data.has_alerts && setSuspiciousAlerts(res.data.alerts))
      .catch(() => {});
  }, [user?.is_admin]);

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight" suppressHydrationWarning>
          Welcome back, {user?.name?.split(" ")[0] || "User"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {user?.is_admin
            ? "Manage system settings and preferences."
            : "Welcome to your dashboard."}
        </p>
      </div>

      {user?.is_admin && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {settingsCards.map((card) => (
              <Link key={card.href} href={card.href} className="block group">
                <Card className="h-full transition-colors hover:border-primary">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <card.icon className="h-5 w-5" />
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <CardTitle className="mt-4">{card.title}</CardTitle>
                    <CardDescription>{card.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}

            <Link href="/configuration/backup" className="block group">
              <Card className="h-full transition-colors hover:border-primary border-dashed">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                      <Database className="h-5 w-5" />
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Admin
                    </Badge>
                  </div>
                  <CardTitle className="mt-4">Backup & Restore</CardTitle>
                  <CardDescription>
                    Manage system backups and restore points.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>

          {suspiciousAlerts.length > 0 && (
            <Alert variant="destructive" className="mt-8">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Suspicious activity detected</AlertTitle>
              <AlertDescription>
                {suspiciousAlerts.map((a) => a.message).join(" ")}
                <Link
                  href="/configuration/audit"
                  className="ml-2 font-medium underline underline-offset-4"
                >
                  View audit log
                </Link>
              </AlertDescription>
            </Alert>
          )}

          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">System Activity</h2>
            <AuditDashboardWidget />
          </div>
        </>
      )}
    </div>
  );
}
