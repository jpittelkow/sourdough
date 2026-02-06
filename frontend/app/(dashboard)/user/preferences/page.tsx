"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useTheme } from "@/components/theme-provider";
import { api } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import { errorLogger } from "@/lib/error-logger";
import { useOnline } from "@/lib/use-online";
import { OfflineBadge } from "@/components/offline-badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Moon, Sun, Monitor, Loader2, Palette, Bell, Brain, Send, Smartphone, Download } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Link from "next/link";
import {
  isWebPushSupported,
  getPermissionStatus,
  subscribe,
  unsubscribe,
} from "@/lib/web-push";
import { useAppConfig } from "@/lib/app-config";
import { HelpLink } from "@/components/help/help-link";
import { useInstallPrompt } from "@/lib/use-install-prompt";

interface UserPreferences {
  theme?: "light" | "dark" | "system";
  default_llm_mode?: "single" | "aggregation" | "council";
  notification_channels?: string[];
}

interface NotificationSetting {
  key: string;
  label: string;
  type: string;
  value: string;
  placeholder?: string;
}

interface NotificationChannelPref {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  configured: boolean;
  usage_accepted: boolean;
  settings: NotificationSetting[];
}

export default function PreferencesPage() {
  const { theme, setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: theme || "system",
    default_llm_mode: "single",
    notification_channels: [],
  });
  const [channels, setChannels] = useState<NotificationChannelPref[]>([]);
  const [channelsLoading, setChannelsLoading] = useState(true);
  const [channelSettings, setChannelSettings] = useState<Record<string, Record<string, string>>>({});
  const [savingChannel, setSavingChannel] = useState<string | null>(null);
  const [testingChannel, setTestingChannel] = useState<string | null>(null);
  const [webpushLoading, setWebpushLoading] = useState(false);
  const [webpushPermission, setWebpushPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  const [installPrompting, setInstallPrompting] = useState(false);
  const { features } = useAppConfig();
  const { isOffline } = useOnline();
  const { canPrompt, isInstalled, promptInstall } = useInstallPrompt();

  const fetchChannels = useCallback(async () => {
    try {
      const response = await api.get("/user/notification-settings");
      const raw = response.data?.channels ?? [];
      const list = raw.map((c: NotificationChannelPref) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        enabled: Boolean(c.enabled),
        configured: Boolean(c.configured),
        usage_accepted: Boolean(c.usage_accepted),
        settings: Array.isArray(c.settings) ? c.settings : [],
      }));
      setChannels(list);
      const initial: Record<string, Record<string, string>> = {};
      list.forEach((ch: NotificationChannelPref) => {
        initial[ch.id] = {};
        ch.settings?.forEach((s) => {
          initial[ch.id][s.key] = s.value ?? "";
        });
      });
      setChannelSettings(initial);
    } catch (e) {
      errorLogger.captureMessage(
        "Failed to fetch notification channels",
        "warning",
        { error: e instanceof Error ? e.message : String(e) }
      );
      setChannels([]);
    } finally {
      setChannelsLoading(false);
    }
  }, []);

  const fetchPreferences = useCallback(async () => {
    try {
      const response = await api.get("/user/settings");
      const data = response.data;
      
      // Validate and normalize theme value
      const validThemes = ["light", "dark", "system"] as const;
      const themeValue = validThemes.includes(data.theme) 
        ? data.theme 
        : (theme || "system");
      
      // Validate and normalize LLM mode value
      const validModes = ["single", "aggregation", "council"] as const;
      const llmModeValue = validModes.includes(data.default_llm_mode)
        ? data.default_llm_mode
        : "single";
      
      setPreferences({
        theme: themeValue,
        default_llm_mode: llmModeValue,
        notification_channels: Array.isArray(data.notification_channels) 
          ? data.notification_channels 
          : [],
      });
      
      // Sync theme if it's different
      if (themeValue && themeValue !== theme) {
        setTheme(themeValue);
      }
    } catch (error: unknown) {
      // If endpoint doesn't exist yet, use defaults
      errorLogger.captureMessage("Failed to fetch preferences", "warning", {
        error: error instanceof Error ? error.message : String(error),
      });
      const currentTheme = theme || "system";
      setPreferences({
        theme: currentTheme,
        default_llm_mode: "single",
        notification_channels: [],
      });
    } finally {
      setIsLoading(false);
    }
  }, [theme, setTheme]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  useEffect(() => {
    setWebpushPermission(getPermissionStatus());
  }, []);

  const toggleChannel = async (channelId: string, enabled: boolean) => {
    const name = channels.find((c) => c.id === channelId)?.name ?? channelId;
    setChannels((prev) =>
      prev.map((ch) => (ch.id === channelId ? { ...ch, enabled } : ch))
    );
    try {
      const payload: { channel: string; enabled: boolean; usage_accepted?: boolean } = {
        channel: channelId,
        enabled,
      };
      if (enabled) payload.usage_accepted = true;
      await api.put("/user/notification-settings", payload);
      toast.success(`Notifications ${enabled ? "enabled" : "disabled"} for ${name}`);
    } catch (err: unknown) {
      setChannels((prev) =>
        prev.map((ch) => (ch.id === channelId ? { ...ch, enabled: !enabled } : ch))
      );
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : null;
      toast.error(msg ?? "Failed to update channel");
    }
  };

  const updateChannelSetting = (channelId: string, key: string, value: string) => {
    setChannelSettings((prev) => ({
      ...prev,
      [channelId]: { ...(prev[channelId] ?? {}), [key]: value },
    }));
  };

  const saveChannelSettings = async (channelId: string) => {
    setSavingChannel(channelId);
    try {
      const settings = channelSettings[channelId] ?? {};
      await api.put("/user/notification-settings", { channel: channelId, settings });
      toast.success("Settings saved");
      setChannels((prev) =>
        prev.map((ch) =>
          ch.id === channelId ? { ...ch, configured: true } : ch
        )
      );
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : null;
      toast.error(msg ?? "Failed to save settings");
    } finally {
      setSavingChannel(null);
    }
  };

  const testChannel = async (channelId: string) => {
    setTestingChannel(channelId);
    try {
      await api.post(`/notifications/test/${channelId}`);
      toast.success("Test notification sent");
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : null;
      toast.error(msg ?? "Failed to send test");
    } finally {
      setTestingChannel(null);
    }
  };

  const enableWebPush = async () => {
    const vapidKey = features?.webpushVapidPublicKey;
    if (!vapidKey) {
      toast.error("Browser notifications are not configured. Contact your administrator.");
      return;
    }
    if (!isWebPushSupported()) {
      toast.error("Your browser does not support push notifications.");
      return;
    }
    setWebpushLoading(true);
    try {
      const payload = await subscribe(vapidKey);
      if (!payload) {
        if (getPermissionStatus() === "denied") {
          toast.error("Notification permission was denied.");
        } else {
          toast.error("Failed to subscribe to push notifications.");
        }
        return;
      }
      await api.post("/user/webpush-subscription", payload);
      await api.put("/user/notification-settings", {
        channel: "webpush",
        enabled: true,
        usage_accepted: true,
      });
      setWebpushPermission(getPermissionStatus());
      await fetchChannels();
      toast.success("Browser notifications enabled");
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : null;
      toast.error(msg ?? "Failed to enable browser notifications");
      errorLogger.report(
        err instanceof Error ? err : new Error("Web push subscribe failed"),
        { source: "preferences-webpush" }
      );
    } finally {
      setWebpushLoading(false);
    }
  };

  const disableWebPush = async () => {
    setWebpushLoading(true);
    try {
      await api.delete("/user/webpush-subscription");
      await unsubscribe();
      await api.put("/user/notification-settings", {
        channel: "webpush",
        enabled: false,
      });
      setWebpushPermission(getPermissionStatus());
      await fetchChannels();
      toast.success("Browser notifications disabled");
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : null;
      toast.error(msg ?? "Failed to disable browser notifications");
    } finally {
      setWebpushLoading(false);
    }
  };

  const savePreferences = async (updates: Partial<UserPreferences>) => {
    setIsSaving(true);
    try {
      // Only send the fields that are being updated, filtering out undefined/null
      const payload: Partial<UserPreferences> = {};
      if (updates.theme !== undefined && updates.theme !== null) {
        payload.theme = updates.theme;
      }
      if (updates.default_llm_mode !== undefined && updates.default_llm_mode !== null) {
        payload.default_llm_mode = updates.default_llm_mode;
      }
      if (updates.notification_channels !== undefined && updates.notification_channels !== null) {
        payload.notification_channels = updates.notification_channels;
      }
      
      // Ensure we have at least one field to update
      if (Object.keys(payload).length === 0) {
        errorLogger.captureMessage("No fields to update", "warning");
        setIsSaving(false);
        return;
      }
      
      await api.put("/user/settings", payload);
      
      // Update local state with the merged preferences
      const newPreferences = { ...preferences, ...updates };
      setPreferences(newPreferences);
      toast.success("Preferences saved");
    } catch (error: unknown) {
      const data = error && typeof error === "object" && "response" in error
        ? (error as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } }).response?.data
        : null;
      if (data?.errors) {
        const errorMessages = Object.values(data.errors).flat().join(", ");
        toast.error(`Validation error: ${errorMessages}`);
      } else {
        toast.error(getErrorMessage(error, "Failed to save preferences"));
      }
      errorLogger.report(
        error instanceof Error ? error : new Error("Failed to save preferences"),
        { response: data, source: "preferences-page" }
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    savePreferences({ theme: newTheme });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Preferences</h1>
          <p className="text-muted-foreground">
            {isOffline
              ? "You're offline. Settings are read-only; changes will sync when you're back online."
              : "Customize your personal settings and preferences."}
            {!isOffline && " "}
            {!isOffline && <HelpLink articleId="notification-settings" />}
          </p>
        </div>
        <OfflineBadge />
      </div>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Appearance
          </CardTitle>
          <CardDescription>
            Choose your preferred theme and visual style.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Theme</Label>
            <RadioGroup
              value={preferences.theme ?? "system"}
              onValueChange={(value) => {
                if (isOffline) return;
                const validTheme = ["light", "dark", "system"].includes(value)
                  ? (value as "light" | "dark" | "system")
                  : "system";
                handleThemeChange(validTheme);
              }}
              disabled={isOffline}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="light" id="light" />
                <Label htmlFor="light" className="flex items-center gap-2 cursor-pointer">
                  <Sun className="h-4 w-4" />
                  Light
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dark" id="dark" />
                <Label htmlFor="dark" className="flex items-center gap-2 cursor-pointer">
                  <Moon className="h-4 w-4" />
                  Dark
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="system" id="system" />
                <Label htmlFor="system" className="flex items-center gap-2 cursor-pointer">
                  <Monitor className="h-4 w-4" />
                  System
                </Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* Defaults */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Defaults
          </CardTitle>
          <CardDescription>
            Set your default preferences for AI interactions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="default_llm_mode">Default LLM Mode</Label>
            <Select
              value={preferences.default_llm_mode ?? "single"}
              onValueChange={(value) => {
                if (isOffline) return;
                const validMode = ["single", "aggregation", "council"].includes(value)
                  ? (value as "single" | "aggregation" | "council")
                  : "single";
                savePreferences({
                  default_llm_mode: validMode,
                });
              }}
              disabled={isOffline}
            >
              <SelectTrigger id="default_llm_mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single Provider</SelectItem>
                <SelectItem value="aggregation">Aggregation</SelectItem>
                <SelectItem value="council">Council</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              <strong>Single:</strong> Uses one provider (fastest, cheapest).{" "}
              <strong>Aggregation:</strong> Queries all providers, primary synthesizes responses.{" "}
              <strong>Council:</strong> Providers vote for consensus (best for accuracy).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Enable channels, add your webhook or phone number, test, and accept usage. Only channels enabled by an administrator are shown.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {channelsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : channels.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No notification channels available. An administrator must enable channels in{" "}
              <Link href="/configuration/notifications" className="text-primary hover:underline">
                Configuration
              </Link>
              .
            </p>
          ) : (
            <div className="space-y-6">
              {channels.map((channel) => (
                <div key={channel.id} className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <Label className="text-base font-medium">{channel.name}</Label>
                      <p className="text-sm text-muted-foreground">{channel.description}</p>
                    </div>
                    {channel.id === "webpush" ? (
                      <div className="flex items-center gap-2">
                        {channel.configured ? (
                          <>
                            <span className="text-sm text-muted-foreground">
                              {webpushPermission === "granted" ? "Subscribed" : webpushPermission === "denied" ? "Permission denied" : "Enabled"}
                            </span>
                            <Switch
                              checked={channel.enabled}
                              onCheckedChange={(enabled) =>
                                enabled ? enableWebPush() : disableWebPush()
                              }
                              disabled={webpushLoading || isOffline}
                            />
                          </>
                        ) : (
                          <Button
                            size="sm"
                            onClick={enableWebPush}
                            disabled={
                              webpushLoading ||
                              isOffline ||
                              !features?.webpushEnabled ||
                              !isWebPushSupported()
                            }
                          >
                            {webpushLoading ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Smartphone className="mr-2 h-4 w-4" />
                            )}
                            Enable Browser Notifications
                          </Button>
                        )}
                      </div>
                    ) : (
                      <Switch
                        checked={channel.enabled}
                        onCheckedChange={(enabled) => toggleChannel(channel.id, enabled)}
                        disabled={(channel.settings.length > 0 && !channel.configured) || isOffline}
                      />
                    )}
                  </div>
                  {channel.id === "webpush" && channel.configured && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => testChannel("webpush")}
                      disabled={testingChannel === "webpush" || isOffline}
                    >
                      {testingChannel === "webpush" ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-4 w-4" />
                      )}
                      Test
                    </Button>
                  )}
                  {channel.settings.length > 0 && channel.id !== "webpush" && (
                    <>
                      <Separator />
                      <div className="space-y-3 pl-0">
                        {channel.settings.map((s) => (
                          <div key={s.key} className="space-y-1">
                            <Label htmlFor={`${channel.id}-${s.key}`}>{s.label}</Label>
                            <Input
                              id={`${channel.id}-${s.key}`}
                              type={s.type === "password" ? "password" : "text"}
                              value={channelSettings[channel.id]?.[s.key] ?? ""}
                              onChange={(e) => updateChannelSetting(channel.id, s.key, e.target.value)}
                              placeholder={s.placeholder}
                            />
                          </div>
                        ))}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => saveChannelSettings(channel.id)}
                            disabled={savingChannel === channel.id || isOffline}
                          >
                            {savingChannel === channel.id && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Save settings
                          </Button>
                          {channel.configured && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => testChannel(channel.id)}
                              disabled={testingChannel === channel.id || isOffline}
                            >
                              {testingChannel === channel.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="mr-2 h-4 w-4" />
                              )}
                              Test
                            </Button>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Install App (PWA) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Install App
          </CardTitle>
          <CardDescription>
            Install this app on your device for quick access and offline use.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isInstalled ? (
            <p className="text-sm text-muted-foreground">
              The app is installed. Open it from your home screen or app drawer.
            </p>
          ) : canPrompt ? (
            <Button
              size="sm"
              onClick={async () => {
                setInstallPrompting(true);
                try {
                  const result = await promptInstall();
                  if (result?.outcome === "accepted") {
                    toast.success("App installed");
                  }
                } finally {
                  setInstallPrompting(false);
                }
              }}
              disabled={installPrompting || isOffline}
            >
              {installPrompting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Install App
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">
              Install is available in supported browsers (e.g. Chrome, Edge) when you visit this site. Use your browser&apos;s menu to add to home screen.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
