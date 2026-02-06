# Dashboard Widget Pattern

Dashboard uses static, developer-defined widgets. Widgets are self-contained React components added directly to the dashboard page -- no database storage or user configuration.

## Widget Component

```tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface StatsWidgetProps {
  metrics?: string[];
  title?: string;
}

export function StatsWidget({
  metrics = ["users", "storage"],
  title = "System Stats",
}: StatsWidgetProps) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["dashboard", "stats", metrics],
    queryFn: () => api.get("/dashboard/stats", { params: { metrics } }),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return <WidgetSkeleton />;
  if (error) return <WidgetError onRetry={refetch} />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data?.metrics?.map((m) => (
          <div key={m.label} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{m.label}</span>
            <span className="font-medium">{m.value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
```

## Adding to Dashboard

```tsx
// frontend/app/(dashboard)/dashboard/page.tsx
export default function DashboardPage() {
  const { hasPermission } = usePermission();
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <WelcomeWidget />
      <StatsWidget />
      {hasPermission("admin") && <SystemHealthWidget />}
    </div>
  );
}
```

**Key files:** `frontend/app/(dashboard)/dashboard/page.tsx`, `frontend/components/dashboard/`, `frontend/components/dashboard/widgets/`

**Related:** [Recipe: Add Dashboard Widget](../recipes/add-dashboard-widget.md), [Anti-patterns: Widgets](../anti-patterns/widgets.md)
