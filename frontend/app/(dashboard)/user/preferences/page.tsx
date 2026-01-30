"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useTheme } from "@/components/theme-provider";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Moon, Sun, Monitor, Loader2, Palette, Bell, Brain, Send } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Link from "next/link";

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

  useEffect(() => {
    fetchPreferences();
  }, []);

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
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
  };

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

  const fetchPreferences = async () => {
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
    } catch (error: any) {
      // Handle Laravel validation errors
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const errorMessages = Object.values(errors).flat().join(", ");
        toast.error(`Validation error: ${errorMessages}`);
      } else {
        const errorMessage = error.response?.data?.message 
          || error.message 
          || "Failed to save preferences";
        toast.error(errorMessage);
      }
      errorLogger.report(
        error instanceof Error ? error : new Error("Failed to save preferences"),
        { response: error.response?.data, source: "preferences-page" }
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Preferences</h1>
        <p className="text-muted-foreground">
          Customize your personal settings and preferences.
        </p>
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
                const validTheme = ["light", "dark", "system"].includes(value)
                  ? (value as "light" | "dark" | "system")
                  : "system";
                handleThemeChange(validTheme);
              }}
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
                const validMode = ["single", "aggregation", "council"].includes(value)
                  ? (value as "single" | "aggregation" | "council")
                  : "single";
                savePreferences({
                  default_llm_mode: validMode,
                });
              }}
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
                    <Switch
                      checked={channel.enabled}
                      onCheckedChange={(enabled) => toggleChannel(channel.id, enabled)}
                      disabled={channel.settings.length > 0 && !channel.configured}
                    />
                  </div>
                  {channel.settings.length > 0 && (
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
                            disabled={savingChannel === channel.id}
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
                              disabled={testingChannel === channel.id}
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
    </div>
  );
}
