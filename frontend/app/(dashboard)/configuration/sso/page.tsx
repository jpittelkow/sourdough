"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { SettingsSwitchRow } from "@/components/ui/settings-switch-row";
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

const ssoSchema = z.object({
  enabled: z.boolean(),
  allow_linking: z.boolean(),
  auto_register: z.boolean(),
  trust_provider_email: z.boolean(),
  google_client_id: z.string().optional(),
  google_client_secret: z.string().optional(),
  github_client_id: z.string().optional(),
  github_client_secret: z.string().optional(),
  microsoft_client_id: z.string().optional(),
  microsoft_client_secret: z.string().optional(),
  apple_client_id: z.string().optional(),
  apple_client_secret: z.string().optional(),
  discord_client_id: z.string().optional(),
  discord_client_secret: z.string().optional(),
  gitlab_client_id: z.string().optional(),
  gitlab_client_secret: z.string().optional(),
  oidc_client_id: z.string().optional(),
  oidc_client_secret: z.string().optional(),
  oidc_issuer_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  oidc_provider_name: z.string().optional(),
});
type SSOForm = z.infer<typeof ssoSchema>;

const defaultValues: SSOForm = {
  enabled: true,
  allow_linking: true,
  auto_register: true,
  trust_provider_email: true,
  google_client_id: "",
  google_client_secret: "",
  github_client_id: "",
  github_client_secret: "",
  microsoft_client_id: "",
  microsoft_client_secret: "",
  apple_client_id: "",
  apple_client_secret: "",
  discord_client_id: "",
  discord_client_secret: "",
  gitlab_client_id: "",
  gitlab_client_secret: "",
  oidc_client_id: "",
  oidc_client_secret: "",
  oidc_issuer_url: "",
  oidc_provider_name: "Enterprise SSO",
};

const providers = [
  { id: "google", label: "Google", clientIdKey: "google_client_id" as const, clientSecretKey: "google_client_secret" as const },
  { id: "github", label: "GitHub", clientIdKey: "github_client_id" as const, clientSecretKey: "github_client_secret" as const },
  { id: "microsoft", label: "Microsoft", clientIdKey: "microsoft_client_id" as const, clientSecretKey: "microsoft_client_secret" as const },
  { id: "apple", label: "Apple", clientIdKey: "apple_client_id" as const, clientSecretKey: "apple_client_secret" as const },
  { id: "discord", label: "Discord", clientIdKey: "discord_client_id" as const, clientSecretKey: "discord_client_secret" as const },
  { id: "gitlab", label: "GitLab", clientIdKey: "gitlab_client_id" as const, clientSecretKey: "gitlab_client_secret" as const },
];

function toBool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (v === "true" || v === "1") return true;
  if (v === "false" || v === "0" || v === "" || v == null) return false;
  return Boolean(v);
}

export default function SSOSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    watch,
    reset,
  } = useForm<SSOForm>({
    resolver: zodResolver(ssoSchema),
    mode: "onBlur",
    defaultValues,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/sso-settings");
      const settings = response.data?.settings ?? {};
      const formValues: SSOForm = {
        enabled: toBool(settings.enabled ?? defaultValues.enabled),
        allow_linking: toBool(settings.allow_linking ?? defaultValues.allow_linking),
        auto_register: toBool(settings.auto_register ?? defaultValues.auto_register),
        trust_provider_email: toBool(settings.trust_provider_email ?? defaultValues.trust_provider_email),
        google_client_id: settings.google_client_id ?? "",
        google_client_secret: settings.google_client_secret ?? "",
        github_client_id: settings.github_client_id ?? "",
        github_client_secret: settings.github_client_secret ?? "",
        microsoft_client_id: settings.microsoft_client_id ?? "",
        microsoft_client_secret: settings.microsoft_client_secret ?? "",
        apple_client_id: settings.apple_client_id ?? "",
        apple_client_secret: settings.apple_client_secret ?? "",
        discord_client_id: settings.discord_client_id ?? "",
        discord_client_secret: settings.discord_client_secret ?? "",
        gitlab_client_id: settings.gitlab_client_id ?? "",
        gitlab_client_secret: settings.gitlab_client_secret ?? "",
        oidc_client_id: settings.oidc_client_id ?? "",
        oidc_client_secret: settings.oidc_client_secret ?? "",
        oidc_issuer_url: settings.oidc_issuer_url ?? "",
        oidc_provider_name: settings.oidc_provider_name ?? defaultValues.oidc_provider_name,
      };
      reset(formValues);
    } catch {
      toast.error("Failed to load SSO settings");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: SSOForm) => {
    setIsSaving(true);
    try {
      await api.put("/sso-settings", data);
      toast.success("SSO settings saved");
      await fetchSettings();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      toast.error(msg ?? "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <SettingsPageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">SSO settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure single sign-on providers. Credentials are stored securely and take effect immediately.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Global options</CardTitle>
            <CardDescription>
              Master switch and behavior for SSO login and account linking.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SettingsSwitchRow
              label="Enable SSO"
              description="Allow users to sign in with SSO providers"
              checked={watch("enabled")}
              onCheckedChange={(checked) => setValue("enabled", checked, { shouldDirty: true })}
            />
            <SettingsSwitchRow
              label="Allow account linking"
              description="Let users link multiple SSO providers to one account"
              checked={watch("allow_linking")}
              onCheckedChange={(checked) => setValue("allow_linking", checked, { shouldDirty: true })}
            />
            <SettingsSwitchRow
              label="Auto-register"
              description="Create accounts for new SSO logins"
              checked={watch("auto_register")}
              onCheckedChange={(checked) => setValue("auto_register", checked, { shouldDirty: true })}
            />
            <SettingsSwitchRow
              label="Trust provider email"
              description="Treat SSO provider emails as verified"
              checked={watch("trust_provider_email")}
              onCheckedChange={(checked) => setValue("trust_provider_email", checked, { shouldDirty: true })}
            />
          </CardContent>
        </Card>

        {providers.map(({ id, label, clientIdKey, clientSecretKey }) => (
          <Card key={id}>
            <CardHeader>
              <CardTitle className="text-base">{label}</CardTitle>
              <CardDescription>
                OAuth client ID and secret from your {label} developer console.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FormField id={clientIdKey} label="Client ID" error={errors[clientIdKey]?.message}>
                <Input
                  id={clientIdKey}
                  type="text"
                  placeholder="Optional"
                  {...register(clientIdKey)}
                  className="min-h-[44px]"
                />
              </FormField>
              <FormField id={clientSecretKey} label="Client secret" error={errors[clientSecretKey]?.message}>
                <Input
                  id={clientSecretKey}
                  type="password"
                  placeholder="Optional"
                  {...register(clientSecretKey)}
                  className="min-h-[44px]"
                />
              </FormField>
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Enterprise SSO (OIDC)</CardTitle>
            <CardDescription>
              Generic OIDC provider for Okta, Auth0, Keycloak, or other IdPs.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField id="oidc_client_id" label="Client ID" error={errors.oidc_client_id?.message}>
              <Input
                id="oidc_client_id"
                type="text"
                placeholder="Optional"
                {...register("oidc_client_id")}
                className="min-h-[44px]"
              />
            </FormField>
            <FormField id="oidc_client_secret" label="Client secret" error={errors.oidc_client_secret?.message}>
              <Input
                id="oidc_client_secret"
                type="password"
                placeholder="Optional"
                {...register("oidc_client_secret")}
                className="min-h-[44px]"
              />
            </FormField>
            <FormField id="oidc_issuer_url" label="Issuer URL" error={errors.oidc_issuer_url?.message}>
              <Input
                id="oidc_issuer_url"
                type="url"
                placeholder="https://..."
                {...register("oidc_issuer_url")}
                className="min-h-[44px]"
              />
            </FormField>
            <FormField id="oidc_provider_name" label="Provider name" error={errors.oidc_provider_name?.message}>
              <Input
                id="oidc_provider_name"
                type="text"
                placeholder="Enterprise SSO"
                {...register("oidc_provider_name")}
                className="min-h-[44px]"
              />
            </FormField>
          </CardContent>
        </Card>

        <Card>
          <CardFooter className="flex flex-col gap-4 sm:flex-row sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Changes take effect immediately. Leave blank to use environment variables.
            </p>
            <SaveButton isDirty={isDirty} isSaving={isSaving} />
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
