"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  Bell,
  Send,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface NotificationChannel {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  configured: boolean;
  settings: {
    key: string;
    label: string;
    type: "text" | "password" | "email";
    value: string;
    placeholder?: string;
  }[];
}

const channelIcons: Record<string, React.ReactNode> = {
  email: <Mail className="h-5 w-5" />,
  telegram: <MessageSquare className="h-5 w-5" />,
  discord: <MessageSquare className="h-5 w-5" />,
  slack: <MessageSquare className="h-5 w-5" />,
  twilio: <Phone className="h-5 w-5" />,
  database: <Bell className="h-5 w-5" />,
};

export default function NotificationsPage() {
  const [channels, setChannels] = useState<NotificationChannel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingChannels, setSavingChannels] = useState<Set<string>>(new Set());
  const [testingChannels, setTestingChannels] = useState<Set<string>>(new Set());
  const [channelSettings, setChannelSettings] = useState<Record<string, Record<string, string>>>({});

  useEffect(() => {
    fetchNotificationSettings();
  }, []);

  const fetchNotificationSettings = async () => {
    try {
      const response = await api.get("/settings/notifications");
      const channelsData = response.data.channels || [];

      // Add icons to channels
      const channelsWithIcons = channelsData.map((channel: NotificationChannel) => ({
        ...channel,
        icon: channelIcons[channel.id] || <Bell className="h-5 w-5" />,
      }));

      setChannels(channelsWithIcons);

      // Initialize settings state
      const initialSettings: Record<string, Record<string, string>> = {};
      channelsData.forEach((channel: NotificationChannel) => {
        initialSettings[channel.id] = {};
        channel.settings?.forEach((setting) => {
          initialSettings[channel.id][setting.key] = setting.value || "";
        });
      });
      setChannelSettings(initialSettings);
    } catch (error) {
      console.error("Failed to fetch notification settings:", error);
      // Set default channels if API doesn't return data
      setChannels([
        {
          id: "email",
          name: "Email",
          description: "Receive notifications via email",
          icon: <Mail className="h-5 w-5" />,
          enabled: false,
          configured: false,
          settings: [],
        },
        {
          id: "telegram",
          name: "Telegram",
          description: "Receive notifications via Telegram bot",
          icon: <MessageSquare className="h-5 w-5" />,
          enabled: false,
          configured: false,
          settings: [
            {
              key: "chat_id",
              label: "Chat ID",
              type: "text",
              value: "",
              placeholder: "Your Telegram chat ID",
            },
          ],
        },
        {
          id: "discord",
          name: "Discord",
          description: "Receive notifications via Discord webhook",
          icon: <MessageSquare className="h-5 w-5" />,
          enabled: false,
          configured: false,
          settings: [
            {
              key: "webhook_url",
              label: "Webhook URL",
              type: "text",
              value: "",
              placeholder: "https://discord.com/api/webhooks/...",
            },
          ],
        },
        {
          id: "slack",
          name: "Slack",
          description: "Receive notifications via Slack webhook",
          icon: <MessageSquare className="h-5 w-5" />,
          enabled: false,
          configured: false,
          settings: [
            {
              key: "webhook_url",
              label: "Webhook URL",
              type: "text",
              value: "",
              placeholder: "https://hooks.slack.com/services/...",
            },
          ],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleChannel = async (channelId: string, enabled: boolean) => {
    setChannels((prev) =>
      prev.map((ch) => (ch.id === channelId ? { ...ch, enabled } : ch))
    );

    try {
      await api.put(`/settings/notifications`, {
        channel: channelId,
        enabled,
      });
      toast.success(`${channelId} notifications ${enabled ? "enabled" : "disabled"}`);
    } catch (error: any) {
      // Revert on error
      setChannels((prev) =>
        prev.map((ch) => (ch.id === channelId ? { ...ch, enabled: !enabled } : ch))
      );
      toast.error(error.message || "Failed to update channel");
    }
  };

  const handleSettingChange = (channelId: string, key: string, value: string) => {
    setChannelSettings((prev) => ({
      ...prev,
      [channelId]: {
        ...prev[channelId],
        [key]: value,
      },
    }));
  };

  const handleSaveChannelSettings = async (channelId: string) => {
    setSavingChannels((prev) => new Set(prev).add(channelId));

    try {
      await api.put(`/settings/notifications`, {
        channel: channelId,
        settings: channelSettings[channelId],
      });
      toast.success("Settings saved");

      // Update configured status
      setChannels((prev) =>
        prev.map((ch) =>
          ch.id === channelId ? { ...ch, configured: true } : ch
        )
      );
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings");
    } finally {
      setSavingChannels((prev) => {
        const newSet = new Set(prev);
        newSet.delete(channelId);
        return newSet;
      });
    }
  };

  const handleTestChannel = async (channelId: string) => {
    setTestingChannels((prev) => new Set(prev).add(channelId));

    try {
      await api.post(`/notifications/test/${channelId}`);
      toast.success("Test notification sent!");
    } catch (error: any) {
      toast.error(error.message || "Failed to send test notification");
    } finally {
      setTestingChannels((prev) => {
        const newSet = new Set(prev);
        newSet.delete(channelId);
        return newSet;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground">
          Configure how and where you receive notifications.
        </p>
      </div>

      {channels.map((channel) => (
        <Card key={channel.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-full ${
                    channel.enabled
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {channel.icon}
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {channel.name}
                    {channel.configured ? (
                      <Badge variant="success" className="text-xs">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Configured
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        <XCircle className="mr-1 h-3 w-3" />
                        Not configured
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>{channel.description}</CardDescription>
                </div>
              </div>
              <Switch
                checked={channel.enabled}
                onCheckedChange={(checked) =>
                  handleToggleChannel(channel.id, checked)
                }
              />
            </div>
          </CardHeader>
          {channel.settings && channel.settings.length > 0 && (
            <CardContent>
              <Separator className="mb-4" />
              <div className="space-y-4">
                {channel.settings.map((setting) => (
                  <div key={setting.key} className="space-y-2">
                    <Label htmlFor={`${channel.id}-${setting.key}`}>
                      {setting.label}
                    </Label>
                    <Input
                      id={`${channel.id}-${setting.key}`}
                      type={setting.type}
                      value={channelSettings[channel.id]?.[setting.key] || ""}
                      onChange={(e) =>
                        handleSettingChange(channel.id, setting.key, e.target.value)
                      }
                      placeholder={setting.placeholder}
                    />
                  </div>
                ))}
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => handleSaveChannelSettings(channel.id)}
                    disabled={savingChannels.has(channel.id)}
                  >
                    {savingChannels.has(channel.id) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Settings
                  </Button>
                  {channel.configured && (
                    <Button
                      variant="outline"
                      onClick={() => handleTestChannel(channel.id)}
                      disabled={testingChannels.has(channel.id)}
                    >
                      {testingChannels.has(channel.id) ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-4 w-4" />
                      )}
                      Send Test
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          )}
          {channel.id === "email" && (
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Email notifications use the system SMTP configuration. Contact
                your administrator to set up email delivery.
              </p>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}
