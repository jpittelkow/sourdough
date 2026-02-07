"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { errorLogger } from "@/lib/error-logger";
import { getErrorMessage } from "@/lib/utils";
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
import { FormField } from "@/components/ui/form-field";
import { SettingsPageSkeleton } from "@/components/ui/settings-page-skeleton";
import { SaveButton } from "@/components/ui/save-button";
import { PasswordInput } from "@/components/ui/password-input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ExternalLink } from "lucide-react";

const novuSchema = z.object({
  enabled: z.boolean().default(false),
  api_key: z.string().optional(),
  app_identifier: z.string().optional(),
  api_url: z
    .string()
    .refine((val) => !val || val === "" || (() => { try { new URL(val); return true; } catch { return false; } })(), {
      message: "Must be a valid URL",
    })
    .optional(),
  socket_url: z
    .string()
    .refine((val) => !val || val === "" || (() => { try { new URL(val); return true; } catch { return false; } })(), {
      message: "Must be a valid URL",
    })
    .optional(),
});

type NovuForm = z.infer<typeof novuSchema>;

const defaultValues: NovuForm = {
  enabled: false,
  api_key: "",
  app_identifier: "",
  api_url: "https://api.novu.co",
  socket_url: "https://ws.novu.co",
};

export default function NovuConfigurationPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<boolean | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    watch,
    reset,
  } = useForm<NovuForm>({
    resolver: zodResolver(novuSchema),
    mode: "onBlur",
    defaultValues,
  });

  const fetchSettings = useCallback(async () => {
    try {
      const res = await api.get<{ settings: Record<string, unknown> }>("/novu-settings");
      const s = res.data?.settings ?? {};
      const settings = typeof s === "object" && s !== null ? s as Record<string, unknown> : {};
      reset({
        enabled: Boolean(settings.enabled),
        api_key: (settings.api_key as string) ?? "",
        app_identifier: (settings.app_identifier as string) ?? "",
        api_url: (settings.api_url as string) ?? defaultValues.api_url,
        socket_url: (settings.socket_url as string) ?? defaultValues.socket_url,
      });
      setTestResult(null);
    } catch (err) {
      toast.error("Failed to load Novu settings");
      if (err instanceof Error) {
        errorLogger.report(err, { context: "NovuConfigurationPage.fetchSettings" });
      }
    } finally {
      setIsLoading(false);
    }
  }, [reset]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const onSubmit = async (data: NovuForm) => {
    setIsSaving(true);
    try {
      await api.put("/novu-settings", {
        enabled: data.enabled,
        api_key: data.api_key || null,
        app_identifier: data.app_identifier || null,
        api_url: data.api_url || null,
        socket_url: data.socket_url || null,
      });
      toast.success("Novu settings saved");
      await fetchSettings();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to save Novu settings"));
      if (err instanceof Error) {
        errorLogger.report(err, { context: "NovuConfigurationPage.onSubmit" });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const onTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      await api.post("/novu-settings/test");
      setTestResult(true);
      toast.success("Connection successful");
    } catch {
      setTestResult(false);
      toast.error("Connection failed. Check API key and URL.");
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return <SettingsPageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Novu</h1>
        <p className="text-muted-foreground mt-2">
          Optional notification infrastructure. When enabled, notifications are sent via Novu (Cloud or self-hosted) and the in-app notification center uses Novu&apos;s inbox.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>
              Use Novu Cloud (default URLs) or your self-hosted Novu instance. Leave disabled to use the built-in notification system.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Novu</Label>
                <p className="text-sm text-muted-foreground">Route notifications through Novu when configured.</p>
              </div>
              <Switch
                checked={watch("enabled")}
                onCheckedChange={(checked) => setValue("enabled", checked, { shouldDirty: true })}
              />
            </div>

            <FormField
              id="api_key"
              label="API Key"
              description="From your Novu dashboard (Settings → API Keys)."
              error={errors.api_key?.message}
            >
              <PasswordInput
                {...register("api_key")}
                placeholder="Leave blank to keep existing"
                autoComplete="off"
              />
            </FormField>

            <FormField
              id="app_identifier"
              label="Application Identifier"
              description="Used by the frontend notification center. Find it in Novu dashboard → Application."
              error={errors.app_identifier?.message}
            >
              <Input {...register("app_identifier")} placeholder="e.g. my-app" />
            </FormField>

            <FormField
              id="api_url"
              label="API URL"
              description="Default: Novu Cloud. Change for self-hosted."
              error={errors.api_url?.message}
            >
              <Input {...register("api_url")} placeholder="https://api.novu.co" />
            </FormField>

            <FormField
              id="socket_url"
              label="WebSocket URL"
              description="For real-time notifications. Default: Novu Cloud."
              error={errors.socket_url?.message}
            >
              <Input {...register("socket_url")} placeholder="https://ws.novu.co" />
            </FormField>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onTest}
                disabled={isTesting || !watch("enabled")}
              >
                {isTesting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing…
                  </>
                ) : (
                  "Test connection"
                )}
              </Button>
              {testResult === true && (
                <Badge variant="success">Connected</Badge>
              )}
              {testResult === false && (
                <Badge variant="destructive">Connection failed</Badge>
              )}
            </div>

            <Alert>
              <AlertDescription>
                Create workflows in the Novu dashboard for each notification type (e.g. backup-completed, auth-login). See the recipe in docs for mapping.
                <a
                  href="https://docs.novu.co"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 ml-2 text-primary hover:underline"
                >
                  Novu docs <ExternalLink className="h-3 w-3" />
                </a>
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex justify-end">
            <SaveButton isDirty={isDirty} isSaving={isSaving} />
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
