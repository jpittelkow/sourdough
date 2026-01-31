"use client";

import {
  WelcomeWidget,
  StatsWidget,
  QuickActionsWidget,
} from "@/components/dashboard/widgets";

export default function DashboardPage() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <WelcomeWidget />
        <StatsWidget />
        <QuickActionsWidget />
      </div>
    </div>
  );
}
