"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AuditStatsCard } from "@/components/audit/audit-stats-card";
import { DollarSign, Brain, TrendingUp, ExternalLink } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
} from "recharts";

interface UsageWidgetStats {
  summary: {
    total_estimated_cost: number;
    by_integration: Record<string, number>;
  };
  daily: Array<{
    date: string;
    llm: number;
    email: number;
    sms: number;
    storage: number;
    broadcasting: number;
  }>;
}

function dateRange() {
  const to = new Date();
  const from = new Date(to.getFullYear(), to.getMonth(), 1);
  return {
    date_from: from.toISOString().slice(0, 10),
    date_to: to.toISOString().slice(0, 10),
  };
}

export function UsageDashboardWidget() {
  const [stats, setStats] = useState<UsageWidgetStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(() => {
    setLoading(true);
    setError(null);
    const { date_from, date_to } = dateRange();
    api
      .get<UsageWidgetStats>("/usage/stats", { params: { date_from, date_to } })
      .then((r) => {
        setStats(r.data);
        setError(null);
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load usage stats")
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Skeleton className="h-[120px] rounded-lg" />
          <Skeleton className="h-[120px] rounded-lg" />
        </div>
        <Skeleton className="h-[100px] rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-8">
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchStats}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const totalCost = stats.summary.total_estimated_cost;
  const topIntegration = Object.entries(stats.summary.by_integration).reduce(
    (max, [key, val]) => (val > max.val ? { key, val } : max),
    { key: "none", val: 0 }
  );

  // Sparkline data: total cost per day
  const sparkData = stats.daily.map((d) => ({
    date: d.date,
    total: d.llm + d.email + d.sms + d.storage + d.broadcasting,
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AuditStatsCard
          title="Monthly cost"
          value={formatCurrency(totalCost)}
          description="Current month to date"
          icon={DollarSign}
          variant={totalCost > 100 ? "warning" : "default"}
        />
        {topIntegration.val > 0 && (
          <AuditStatsCard
            title={`Top: ${topIntegration.key.toUpperCase()}`}
            value={formatCurrency(topIntegration.val)}
            description="Largest cost this month"
            icon={Brain}
          />
        )}
      </div>

      {sparkData.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <TrendingUp className="h-4 w-4" />
              Daily spend trend
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="h-[60px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparkData}>
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.15}
                    strokeWidth={1.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button variant="outline" size="sm" asChild>
          <Link href="/configuration/usage">
            View usage details
            <ExternalLink className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
