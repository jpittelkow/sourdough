"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { WidgetCard } from "@/components/dashboard/widget-card";
import { WidgetSkeleton } from "@/components/dashboard/widget-skeleton";
import { errorLogger } from "@/lib/error-logger";

interface Metric {
  label: string;
  value: string | number;
}

interface StatsResponse {
  metrics?: Metric[];
}

/**
 * Stats widget. Reference implementation for a widget that fetches data from the API.
 */
export function StatsWidget() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: async (): Promise<StatsResponse> => {
      const res = await api.get<StatsResponse>("/dashboard/stats");
      return res.data;
    },
  });

  if (error) {
    errorLogger.report(error instanceof Error ? error : new Error(String(error)), {
      context: "StatsWidget",
    });
    return (
      <WidgetCard title="System Stats">
        <p className="text-sm text-destructive">Failed to load stats.</p>
      </WidgetCard>
    );
  }

  if (isLoading) {
    return <WidgetSkeleton />;
  }

  const metrics = data?.metrics ?? [];

  return (
    <WidgetCard title="System Stats">
      <div className="space-y-2">
        {metrics.map((metric: Metric) => (
          <div
            key={metric.label}
            className="flex justify-between text-sm"
          >
            <span className="text-muted-foreground">{metric.label}</span>
            <span className="font-medium">{metric.value}</span>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}
