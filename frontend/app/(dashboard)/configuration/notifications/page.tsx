"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
  CardFooter,
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
import { FormField } from "@/components/ui/form-field";
import { SettingsPageSkeleton } from "@/components/ui/settings-page-skeleton";
import { SaveButton } from "@/components/ui/save-button";
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

const credentialSchema = z.object({
  telegram_bot_token: z.string().optional(),
  discord_webhook_url: z.string().optional(),
  discord_bot_name: z.string().optional(),
  discord_avatar_url: z.string().optional(),
  slack_webhook_url: z.string().optional(),
  slack_bot_name: z.string().optional(),
  slack_icon: z.string().optional(),
  signal_cli_path: z.string().optional(),
  signal_phone_number: z.string().optional(),
  signal_config_dir: z.string().optional(),
  twilio_sid: z.string().optional(),
  twilio_token: z.string().optional(),
  twilio_from: z.string().optional(),
  vonage_api_key: z.string().optional(),
  vonage_api_secret: z.string().optional(),
  vonage_from: z.string().optional(),
  sns_enabled: z.boolean().default(false),
  vapid_public_key: z.string().optional(),
  vapid_private_key: z.string().optional(),
  vapid_subject: z.string().optional(),
  fcm_server_key: z.string().optional(),
  ntfy_enabled: z.boolean().default(true),
  ntfy_server: z.string().optional(),
  matrix_homeserver: z.string().optional(),
  matrix_access_token: z.string().optional(),
  matrix_default_room: z.string().optional(),
});
type CredentialForm = z.infer<typeof credentialSchema>;

const credentialDefaultValues: CredentialForm = {
  telegram_bot_token: "",
  discord_webhook_url: "",
  discord_bot_name: "",
  discord_avatar_url: "",
  slack_webhook_url: "",
  slack_bot_name: "",
  slack_icon: "",
  signal_cli_path: "",
  signal_phone_number: "",
  signal_config_dir: "",
  twilio_sid: "",
  twilio_token: "",
  twilio_from: "",
  vonage_api_key: "",
  vonage_api_secret: "",
  vonage_from: "",
  sns_enabled: false,
  vapid_public_key: "",
  vapid_private_key: "",
  vapid_subject: "",
  fcm_server_key: "",
  ntfy_enabled: true,
  ntfy_server: "",
  matrix_homeserver: "",
  matrix_access_token: "",
  matrix_default_room: "",
};

export default function NotificationsPage() {
  const [channels, setChannels] = useState<AdminChannel[]>([]);
  const [smsProvider, setSmsProvider] = useState<string | null>(null);
  const [smsProvidersConfigured, setSmsProvidersConfigured] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingChannels, setSavingChannels] = useState<Set<string>>(new Set());
  const [isSavingCredentials, setIsSavingCredentials] = useState(false);
  const [testingChannel, setTestingChannel] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    watch,
    reset,
  } = useForm<CredentialForm>({
    resolver: zodResolver(credentialSchema),
    mode: "onBlur",
    defaultValues: credentialDefaultValues,
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setIsLoading(true);
      const [channelsRes, settingsRes] = await Promise.all([
        api.get("/admin/notification-channels"),
        api.get("/notification-settings"),
      ]);
      const channelData = channelsRes.data;
      setChannels(channelData.channels ?? []);
      setSmsProvider(channelData.sms_provider ?? null);
      setSmsProvidersConfigured(channelData.sms_providers_configured ?? []);

      const settings = settingsRes.data?.settings ?? {};
      const formValues: CredentialForm = {
        ...credentialDefaultValues,
        ...settings,
        ntfy_enabled: settings.ntfy_enabled ?? true,
        sns_enabled: settings.sns_enabled ?? false,
      };
      reset(formValues);
    } catch (e) {
      console.error("Failed to fetch notification config:", e);
      toast.error("Failed to load notification configuration");
      setChannels([]);
      setSmsProvidersConfigured([]);
    } finally {
      setIsLoading(false);
    }
  };

  const onCredentialsSubmit = async (data: CredentialForm) => {
    setIsSavingCredentials(true);
    try {
      const payload: Record<string, string | boolean | null> = { ...data };
      Object.keys(payload).forEach((k) => {
        const v = payload[k];
        if (typeof v === "string" && v === "") payload[k] = null;
      });
      await api.put("/notification-settings", payload);
      toast.success("Channel credentials saved");
      await fetchConfig();
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : null;
      toast.error(msg ?? "Failed to save credentials");
    } finally {
      setIsSavingCredentials(false);
    }
  };

  const handleTestChannel = async (channel: string) => {
    setTestingChannel(channel);
    try {
      await api.post(`/notification-settings/test/${channel}`);
      toast.success(`Test notification sent via ${channel}`);
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : null;
      toast.error(msg ?? `Failed to send test via ${channel}`);
    } finally {
      setTestingChannel(null);
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
    return <SettingsPageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Notifications</h1>
        <p className="text-muted-foreground mt-1">
          Enable which notification channels are available to users. Configure channel credentials below. Users set their own webhooks and phone numbers in Preferences.
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
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center ${
                      ch.available ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {channelIcons[ch.id] ?? <Bell className="h-5 w-5" />}
                  </div>
                  <div>
                    <CardTitle className="flex flex-wrap items-center gap-2 text-base md:text-lg">
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
                      className="min-h-[44px]"
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

      <form onSubmit={handleSubmit(onCredentialsSubmit)} className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Channel credentials</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure API keys and webhooks for each channel. Leave blank to use environment variables.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Telegram</CardTitle>
            <CardDescription>Bot token from BotFather</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField id="telegram_bot_token" label="Bot token" error={errors.telegram_bot_token?.message}>
              <Input
                id="telegram_bot_token"
                type="password"
                placeholder="Optional"
                {...register("telegram_bot_token")}
                className="min-h-[44px]"
              />
            </FormField>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleTestChannel("telegram")}
              disabled={testingChannel !== null}
              className="min-h-[44px]"
            >
              {testingChannel === "telegram" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Discord</CardTitle>
            <CardDescription>Webhook URL and optional display name</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField id="discord_webhook_url" label="Webhook URL" error={errors.discord_webhook_url?.message}>
              <Input
                id="discord_webhook_url"
                type="password"
                placeholder="Optional"
                {...register("discord_webhook_url")}
                className="min-h-[44px]"
              />
            </FormField>
            <FormField id="discord_bot_name" label="Bot name" error={errors.discord_bot_name?.message}>
              <Input id="discord_bot_name" placeholder="Sourdough" {...register("discord_bot_name")} className="min-h-[44px]" />
            </FormField>
            <FormField id="discord_avatar_url" label="Avatar URL" error={errors.discord_avatar_url?.message}>
              <Input id="discord_avatar_url" placeholder="Optional" {...register("discord_avatar_url")} className="min-h-[44px]" />
            </FormField>
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleTestChannel("discord")}
                disabled={testingChannel !== null}
                className="min-h-[44px]"
              >
                {testingChannel === "discord" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Slack</CardTitle>
            <CardDescription>Webhook URL and optional display</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField id="slack_webhook_url" label="Webhook URL" error={errors.slack_webhook_url?.message}>
              <Input
                id="slack_webhook_url"
                type="password"
                placeholder="Optional"
                {...register("slack_webhook_url")}
                className="min-h-[44px]"
              />
            </FormField>
            <FormField id="slack_bot_name" label="Bot name" error={errors.slack_bot_name?.message}>
              <Input id="slack_bot_name" placeholder="Sourdough" {...register("slack_bot_name")} className="min-h-[44px]" />
            </FormField>
            <FormField id="slack_icon" label="Icon (e.g. :robot_face:)" error={errors.slack_icon?.message}>
              <Input id="slack_icon" placeholder=":robot_face:" {...register("slack_icon")} className="min-h-[44px]" />
            </FormField>
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleTestChannel("slack")}
                disabled={testingChannel !== null}
                className="min-h-[44px]"
              >
                {testingChannel === "slack" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Signal</CardTitle>
            <CardDescription>signal-cli path and phone number</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField id="signal_cli_path" label="CLI path" error={errors.signal_cli_path?.message}>
              <Input id="signal_cli_path" placeholder="/usr/local/bin/signal-cli" {...register("signal_cli_path")} className="min-h-[44px]" />
            </FormField>
            <FormField id="signal_phone_number" label="Phone number" error={errors.signal_phone_number?.message}>
              <Input id="signal_phone_number" type="password" placeholder="+1234567890" {...register("signal_phone_number")} className="min-h-[44px]" />
            </FormField>
            <FormField id="signal_config_dir" label="Config directory" error={errors.signal_config_dir?.message}>
              <Input id="signal_config_dir" placeholder="Optional" {...register("signal_config_dir")} className="min-h-[44px]" />
            </FormField>
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleTestChannel("signal")}
                disabled={testingChannel !== null}
                className="min-h-[44px]"
              >
                {testingChannel === "signal" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Twilio (SMS)</CardTitle>
            <CardDescription>Account SID, token, and from number</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField id="twilio_sid" label="Account SID" error={errors.twilio_sid?.message}>
              <Input id="twilio_sid" placeholder="Optional" {...register("twilio_sid")} className="min-h-[44px]" />
            </FormField>
            <FormField id="twilio_token" label="Auth token" error={errors.twilio_token?.message}>
              <Input id="twilio_token" type="password" placeholder="Optional" {...register("twilio_token")} className="min-h-[44px]" />
            </FormField>
            <FormField id="twilio_from" label="From number" error={errors.twilio_from?.message}>
              <Input id="twilio_from" placeholder="+1234567890" {...register("twilio_from")} className="min-h-[44px]" />
            </FormField>
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleTestChannel("twilio")}
                disabled={testingChannel !== null}
                className="min-h-[44px]"
              >
                {testingChannel === "twilio" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vonage (SMS)</CardTitle>
            <CardDescription>API key, secret, and from number</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField id="vonage_api_key" label="API key" error={errors.vonage_api_key?.message}>
              <Input id="vonage_api_key" placeholder="Optional" {...register("vonage_api_key")} className="min-h-[44px]" />
            </FormField>
            <FormField id="vonage_api_secret" label="API secret" error={errors.vonage_api_secret?.message}>
              <Input id="vonage_api_secret" type="password" placeholder="Optional" {...register("vonage_api_secret")} className="min-h-[44px]" />
            </FormField>
            <FormField id="vonage_from" label="From number" error={errors.vonage_from?.message}>
              <Input id="vonage_from" placeholder="Optional" {...register("vonage_from")} className="min-h-[44px]" />
            </FormField>
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleTestChannel("vonage")}
                disabled={testingChannel !== null}
                className="min-h-[44px]"
              >
                {testingChannel === "vonage" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">AWS SNS (SMS)</CardTitle>
            <CardDescription>Uses mail SES AWS credentials. Enable SNS here.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label>Enable SNS</Label>
                <p className="text-sm text-muted-foreground">Use AWS credentials from mail settings for SNS</p>
              </div>
              <Switch
                checked={watch("sns_enabled")}
                onCheckedChange={(checked) => setValue("sns_enabled", checked, { shouldDirty: true })}
                className="min-h-[44px]"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Web Push (VAPID)</CardTitle>
            <CardDescription>VAPID keys for web push notifications</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField id="vapid_public_key" label="Public key" error={errors.vapid_public_key?.message}>
              <Input id="vapid_public_key" placeholder="Optional" {...register("vapid_public_key")} className="min-h-[44px]" />
            </FormField>
            <FormField id="vapid_private_key" label="Private key" error={errors.vapid_private_key?.message}>
              <Input id="vapid_private_key" type="password" placeholder="Optional" {...register("vapid_private_key")} className="min-h-[44px]" />
            </FormField>
            <FormField id="vapid_subject" label="Subject (mailto or URL)" error={errors.vapid_subject?.message}>
              <Input id="vapid_subject" placeholder="Optional" {...register("vapid_subject")} className="min-h-[44px]" />
            </FormField>
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleTestChannel("webpush")}
                disabled={testingChannel !== null}
                className="min-h-[44px]"
              >
                {testingChannel === "webpush" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Firebase Cloud Messaging</CardTitle>
            <CardDescription>FCM server key</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField id="fcm_server_key" label="Server key" error={errors.fcm_server_key?.message}>
              <Input id="fcm_server_key" type="password" placeholder="Optional" {...register("fcm_server_key")} className="min-h-[44px]" />
            </FormField>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleTestChannel("fcm")}
              disabled={testingChannel !== null}
              className="min-h-[44px]"
            >
              {testingChannel === "fcm" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">ntfy</CardTitle>
            <CardDescription>Enable and optional server URL</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <Label>Enable ntfy</Label>
              <Switch
                checked={watch("ntfy_enabled")}
                onCheckedChange={(checked) => setValue("ntfy_enabled", checked, { shouldDirty: true })}
                className="min-h-[44px]"
              />
            </div>
            <FormField id="ntfy_server" label="Server URL" error={errors.ntfy_server?.message}>
              <Input id="ntfy_server" placeholder="https://ntfy.sh" {...register("ntfy_server")} className="min-h-[44px]" />
            </FormField>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleTestChannel("ntfy")}
              disabled={testingChannel !== null}
              className="min-h-[44px]"
            >
              {testingChannel === "ntfy" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Matrix</CardTitle>
            <CardDescription>Homeserver, access token, and default room</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField id="matrix_homeserver" label="Homeserver URL" error={errors.matrix_homeserver?.message}>
              <Input id="matrix_homeserver" placeholder="https://matrix.example.com" {...register("matrix_homeserver")} className="min-h-[44px]" />
            </FormField>
            <FormField id="matrix_access_token" label="Access token" error={errors.matrix_access_token?.message}>
              <Input id="matrix_access_token" type="password" placeholder="Optional" {...register("matrix_access_token")} className="min-h-[44px]" />
            </FormField>
            <FormField id="matrix_default_room" label="Default room ID" error={errors.matrix_default_room?.message}>
              <Input id="matrix_default_room" placeholder="Optional" {...register("matrix_default_room")} className="min-h-[44px]" />
            </FormField>
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleTestChannel("matrix")}
                disabled={testingChannel !== null}
                className="min-h-[44px]"
              >
                {testingChannel === "matrix" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardFooter className="flex flex-col gap-4 sm:flex-row sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Changes take effect immediately. Empty fields fall back to environment variables.
            </p>
            <SaveButton
              isDirty={isDirty}
              isSaving={isSavingCredentials}
            />
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
