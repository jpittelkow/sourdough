"use client";

import { useAuth } from "@/lib/auth";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  User,
  Shield,
  Bell,
  Brain,
  Database,
  ArrowRight,
} from "lucide-react";

const settingsCards = [
  {
    title: "Profile Settings",
    description: "Update your profile, password, and account settings.",
    href: "/settings/profile",
    icon: User,
  },
  {
    title: "Security",
    description: "Manage 2FA, SSO connections, and security settings.",
    href: "/settings/security",
    icon: Shield,
  },
  {
    title: "Notifications",
    description: "Configure notification channels and preferences.",
    href: "/settings/notifications",
    icon: Bell,
  },
  {
    title: "AI/LLM Settings",
    description: "Configure LLM providers and orchestration mode.",
    href: "/settings/ai",
    icon: Brain,
  },
];

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.name?.split(" ")[0]}
        </h1>
        <p className="text-muted-foreground mt-1">
          {user?.is_admin
            ? "Manage system settings and preferences."
            : "Welcome to your dashboard."}
        </p>
      </div>

      {user?.is_admin && (
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

          <Link href="/admin/backup" className="block group">
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
      )}
    </div>
  );
}
