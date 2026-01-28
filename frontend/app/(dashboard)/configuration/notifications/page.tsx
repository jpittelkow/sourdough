"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import {
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  Bell,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface AdminChannel {
  id: string;
  name: string;
  description: string;
  provider_configured: boolean;
  available: boolean;
  admin_toggle: boolean;
  sms_provider: boolean | null;
}

const channelIcons: Record<string, React.ReactNode> = {
  database: <Bell className="h-5 w-5" />,
  email: <Mail className="h-5 w-5" />,
  telegram: <MessageSquare className="h-5 w-5" />,
  discord: <MessageSquare className="h-5 w-5" />,
  slack: <MessageSquare className="h-5 w-5" />,
  signal: <Phone className="h-5 w-5" />,
  matrix: <MessageSquare className="h-5 w-5" />,
  twilio: <Phone className="h-5 w-5" />,
  vonage: <Phone className="h-5 w-5" />,
  sns: <Phone className="h-5 w-5" />,
  webpush: <Bell className="h-5 w-5" />,
  fcm: <Bell className="h-5 w-5" />,
  ntfy: <Bell className="h-5 w-5" />,
};

const SMS_IDS = ["twilio", "vonage", "sns"] as const;
const SMS_LABELS: Record<string, string> = {
  twilio: "Twilio",
  vonage: "Vonage",
  sns: "AWS SNS",
};

export default function NotificationsPage() {
  const [channels, setChannels] = useState<AdminChannel[]>([]);
  const [smsProvider, setSmsProvider] = useState<string | null>(null);
  const [smsProvidersConfigured, setSmsProvidersConfigured] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingChannels, setSavingChannels] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await api.get("/admin/notification-channels");
      const data = res.data;
      setChannels(data.channels ?? []);
      setSmsProvider(data.sms_provider ?? null);
      setSmsProvidersConfigured(data.sms_providers_configured ?? []);
    } catch (e) {
      console.error("Failed to fetch notification channel config:", e);
      toast.error("Failed to load notification configuration");
      setChannels([]);
      setSmsProvidersConfigured([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAvailable = async (channelId: string, available: boolean) => {
    setSavingChannels((prev) => new Set(prev).add(channelId));
    setChannels((prev) =>
      prev.map((ch) => (ch.id === channelId ? { ...ch, available } : ch))
    );
    try {
      const current = channels.find((c) => c.id === channelId);
      await api.put("/admin/notification-channels", {
        channels: [{ id: channelId, available }],
      });
      toast.success(`${current?.name ?? channelId} ${available ? "available" : "unavailable"} to users`);
    } catch (err: unknown) {
      setChannels((prev) =>
        prev.map((ch) => (ch.id === channelId ? { ...ch, available: !available } : ch))
      );
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : null;
      toast.error(msg ?? "Failed to update channel");
    } finally {
      setSavingChannels((prev) => {
        const next = new Set(prev);
        next.delete(channelId);
        return next;
      });
    }
  };

  const handleSmsProviderChange = async (value: string) => {
    const next = value === "__none__" ? null : value;
    setSmsProvider(next);
    try {
      await api.put("/admin/notification-channels", { sms_provider: next });
      toast.success("SMS provider updated");
    } catch (err: unknown) {
      setSmsProvider(smsProvider);
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : null;
      toast.error(msg ?? "Failed to update SMS provider");
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
          Enable which notification channels are available to users. Users configure their own webhooks and phone numbers in Preferences.
        </p>
      </div>

      {smsProvidersConfigured.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>SMS provider</CardTitle>
            <CardDescription>
              Choose the preferred SMS provider. Users enter their phone number and test in Preferences.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-w-xs">
              <Label>Preferred SMS provider</Label>
              <Select
                value={smsProvider ?? "__none__"}
                onValueChange={handleSmsProviderChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {smsProvidersConfigured.map((id) => (
                    <SelectItem key={id} value={id}>
                      {SMS_LABELS[id] ?? id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Channels</h2>
        {channels.map((ch) => (
          <Card key={ch.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-full ${
                      ch.available ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {channelIcons[ch.id] ?? <Bell className="h-5 w-5" />}
                  </div>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {ch.name}
                      {ch.provider_configured ? (
                        <span className="inline-flex items-center rounded-md bg-green-100 dark:bg-green-900/30 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Configured
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          <XCircle className="mr-1 h-3 w-3" />
                          Not configured
                        </span>
                      )}
                      {!ch.admin_toggle && (
                        <span className="text-xs font-normal text-muted-foreground">(always available)</span>
                      )}
                    </CardTitle>
                    <CardDescription>{ch.description}</CardDescription>
                  </div>
                </div>
                {ch.admin_toggle ? (
                  <div className="flex items-center gap-2">
                    {savingChannels.has(ch.id) && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    <Switch
                      checked={ch.available}
                      onCheckedChange={(checked) => handleToggleAvailable(ch.id, checked)}
                      disabled={!ch.provider_configured || savingChannels.has(ch.id)}
                    />
                    <Label className="text-sm text-muted-foreground">Available to users</Label>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Always available</span>
                )}
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
