"use client";

import { useAuth } from "@/lib/auth";
import { WidgetCard } from "@/components/dashboard/widget-card";

/**
 * Static welcome widget. Reference implementation for a widget with no data fetching.
 */
export function WelcomeWidget() {
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] || "User";

  return (
    <WidgetCard title="Welcome">
      <p className="text-sm text-muted-foreground">
        Welcome back, {firstName}. Here&apos;s your dashboard overview.
      </p>
    </WidgetCard>
  );
}
