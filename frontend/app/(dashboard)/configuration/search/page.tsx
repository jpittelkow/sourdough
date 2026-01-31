"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { errorLogger } from "@/lib/error-logger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SettingsPageSkeleton } from "@/components/ui/settings-page-skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, RefreshCw, Settings } from "lucide-react";

interface IndexStat {
  count: number;
  name: string;
}

interface StatsResponse {
  stats: Record<string, IndexStat>;
}

interface SearchSettings {
  results_per_page: number;
  suggestions_limit: number;
  min_query_length: number;
}

const DEFAULT_SEARCH_SETTINGS: SearchSettings = {
  results_per_page: 15,
  suggestions_limit: 5,
  min_query_length: 2,
};

export default function SearchConfigurationPage() {
  const [stats, setStats] = useState<Record<string, IndexStat> | null>(null);
  const [searchSettings, setSearchSettings] = useState<SearchSettings>(DEFAULT_SEARCH_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [reindexing, setReindexing] = useState<string | "all" | null>(null);

  const fetchStats = async () => {
    try {
      const res = await api.get<StatsResponse>("/admin/search/stats");
      setStats(res.data.stats ?? {});
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load search stats";
      toast.error(message);
      if (err instanceof Error) {
        errorLogger.report(err, { context: "SearchConfigurationPage.fetchStats" });
      }
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await api.get<{ settings: Record<string, Record<string, unknown>> }>("/system-settings");
      const search = res.data?.settings?.search;
      if (search && typeof search === "object") {
        setSearchSettings({
          results_per_page: Number(search.results_per_page) || DEFAULT_SEARCH_SETTINGS.results_per_page,
          suggestions_limit: Number(search.suggestions_limit) || DEFAULT_SEARCH_SETTINGS.suggestions_limit,
          min_query_length: Number(search.min_query_length) ?? DEFAULT_SEARCH_SETTINGS.min_query_length,
        });
      }
    } catch {
      // Use defaults if fetch fails
    }
  };

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchStats(), fetchSettings()]).finally(() => {
      if (!cancelled) setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleReindex = async (model: string | null) => {
    setReindexing(model ?? "all");
    try {
      if (model) {
        await api.post("/admin/search/reindex", { model });
        toast.success(`Index "${model}" reindexed successfully.`);
      } else {
        await api.post("/admin/search/reindex");
        toast.success("All indexes reindexed successfully.");
      }
      await fetchStats();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Reindex failed";
      toast.error(message);
      if (err instanceof Error) {
        errorLogger.report(err, { context: "SearchConfigurationPage.reindex" });
      }
    } finally {
      setReindexing(null);
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const settingsArray = [
        { group: "search", key: "results_per_page", value: searchSettings.results_per_page },
        { group: "search", key: "suggestions_limit", value: searchSettings.suggestions_limit },
        { group: "search", key: "min_query_length", value: searchSettings.min_query_length },
      ];
      await api.put("/system-settings", { settings: settingsArray });
      toast.success("Search settings saved.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save search settings";
      toast.error(message);
      if (err instanceof Error) {
        errorLogger.report(err, { context: "SearchConfigurationPage.saveSettings" });
      }
    } finally {
      setIsSavingSettings(false);
    }
  };

  if (isLoading) {
    return <SettingsPageSkeleton />;
  }

  const entries = stats ? Object.entries(stats) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Search</h1>
        <p className="text-muted-foreground">
          Manage search indexes and reindex content for full-text search.
        </p>
      </div>

      <Tabs defaultValue="indexes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="indexes">Index statistics</TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>
        <TabsContent value="indexes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Index statistics</CardTitle>
              <CardDescription>
                Document counts per searchable model. Use Reindex to refresh after
                bulk changes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {entries.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No search indexes configured.
                </p>
              ) : (
                <ul className="space-y-3">
                  {entries.map(([key, stat]) => (
                    <li
                      key={key}
                      className="flex items-center justify-between rounded-lg border px-4 py-3"
                    >
                      <div>
                        <span className="font-medium capitalize">{stat.name.replace(/_/g, " ")}</span>
                        <span className="ml-2 text-sm text-muted-foreground">
                          {stat.count} document{stat.count !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={reindexing !== null}
                        onClick={() => handleReindex(key)}
                      >
                        {reindexing === key ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <RefreshCw className="mr-1.5 h-4 w-4" />
                            Reindex
                          </>
                        )}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              {entries.length > 0 && (
                <div className="pt-2">
                  <Button
                    variant="secondary"
                    disabled={reindexing !== null}
                    onClick={() => handleReindex(null)}
                  >
                    {reindexing === "all" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Reindex all
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Search settings</CardTitle>
              <CardDescription>
                Configure results per page, suggestions limit, and minimum query length.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="results_per_page">Results per page (5–50)</Label>
                  <Input
                    id="results_per_page"
                    type="number"
                    min={5}
                    max={50}
                    value={searchSettings.results_per_page}
                    onChange={(e) =>
                      setSearchSettings((s) => ({
                        ...s,
                        results_per_page: Math.min(50, Math.max(5, Number(e.target.value) || 15)),
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="suggestions_limit">Suggestions limit (3–10)</Label>
                  <Input
                    id="suggestions_limit"
                    type="number"
                    min={3}
                    max={10}
                    value={searchSettings.suggestions_limit}
                    onChange={(e) =>
                      setSearchSettings((s) => ({
                        ...s,
                        suggestions_limit: Math.min(10, Math.max(3, Number(e.target.value) || 5)),
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min_query_length">Minimum query length (1–5)</Label>
                  <Input
                    id="min_query_length"
                    type="number"
                    min={1}
                    max={5}
                    value={searchSettings.min_query_length}
                    onChange={(e) =>
                      setSearchSettings((s) => ({
                        ...s,
                        min_query_length: Math.min(5, Math.max(1, Number(e.target.value) ?? 2)),
                      }))
                    }
                  />
                </div>
              </div>
              <Button onClick={handleSaveSettings} disabled={isSavingSettings}>
                {isSavingSettings ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Save settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
