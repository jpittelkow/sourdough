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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TIMEZONES = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "Eastern Time (US)" },
  { value: "America/Chicago", label: "Central Time (US)" },
  { value: "America/Denver", label: "Mountain Time (US)" },
  { value: "America/Los_Angeles", label: "Pacific Time (US)" },
  { value: "America/Toronto", label: "Toronto" },
  { value: "America/Vancouver", label: "Vancouver" },
  { value: "Europe/London", label: "London" },
  { value: "Europe/Paris", label: "Paris" },
  { value: "Europe/Berlin", label: "Berlin" },
  { value: "Europe/Rome", label: "Rome" },
  { value: "Europe/Madrid", label: "Madrid" },
  { value: "Europe/Amsterdam", label: "Amsterdam" },
  { value: "Asia/Tokyo", label: "Tokyo" },
  { value: "Asia/Shanghai", label: "Shanghai" },
  { value: "Asia/Hong_Kong", label: "Hong Kong" },
  { value: "Asia/Singapore", label: "Singapore" },
  { value: "Asia/Dubai", label: "Dubai" },
  { value: "Australia/Sydney", label: "Sydney" },
  { value: "Australia/Melbourne", label: "Melbourne" },
  { value: "Pacific/Auckland", label: "Auckland" },
];

const LOCALES = [
  { value: "en", label: "English" },
  { value: "en-US", label: "English (US)" },
  { value: "en-GB", label: "English (UK)" },
  { value: "en-CA", label: "English (Canada)" },
  { value: "en-AU", label: "English (Australia)" },
  { value: "es", label: "Spanish" },
  { value: "es-ES", label: "Spanish (Spain)" },
  { value: "es-MX", label: "Spanish (Mexico)" },
  { value: "fr", label: "French" },
  { value: "fr-FR", label: "French (France)" },
  { value: "fr-CA", label: "French (Canada)" },
  { value: "de", label: "German" },
  { value: "de-DE", label: "German (Germany)" },
  { value: "it", label: "Italian" },
  { value: "it-IT", label: "Italian (Italy)" },
  { value: "pt", label: "Portuguese" },
  { value: "pt-BR", label: "Portuguese (Brazil)" },
  { value: "pt-PT", label: "Portuguese (Portugal)" },
  { value: "ja", label: "Japanese" },
  { value: "ja-JP", label: "Japanese (Japan)" },
  { value: "zh", label: "Chinese" },
  { value: "zh-CN", label: "Chinese (Simplified)" },
  { value: "zh-TW", label: "Chinese (Traditional)" },
  { value: "ko", label: "Korean" },
  { value: "ko-KR", label: "Korean (Korea)" },
  { value: "ru", label: "Russian" },
  { value: "ru-RU", label: "Russian (Russia)" },
  { value: "ar", label: "Arabic" },
  { value: "nl", label: "Dutch" },
  { value: "nl-NL", label: "Dutch (Netherlands)" },
  { value: "pl", label: "Polish" },
  { value: "pl-PL", label: "Polish (Poland)" },
];

const systemSchema = z.object({
  general: z.object({
    app_name: z.string().min(1, "App name is required"),
    app_url: z.union([z.string().url("Invalid URL"), z.literal("")]).optional(),
    default_timezone: z.string().min(1, "Timezone is required"),
    default_locale: z.string().min(1, "Locale is required"),
  }),
  registration: z.object({
    enabled: z.boolean(),
    email_verification_required: z.boolean(),
    allowed_domains: z.string().optional(),
  }),
  security: z.object({
    session_timeout: z.number().min(5).max(1440),
    password_min_length: z.number().min(6).max(128),
    password_require_special: z.boolean(),
    max_login_attempts: z.number().min(3).max(10),
  }),
  defaults: z.object({
    default_llm_mode: z.string().optional(),
    default_theme: z.string().optional(),
  }),
});

type SystemForm = z.infer<typeof systemSchema>;

export default function SystemSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<SystemForm | null>(null);

  const { register, handleSubmit, formState: { errors, isDirty }, setValue, watch } = useForm<SystemForm>({
    resolver: zodResolver(systemSchema),
    defaultValues: {
      general: {
        app_name: "Sourdough",
        app_url: "",
        default_timezone: "UTC",
        default_locale: "en",
      },
      registration: {
        enabled: true,
        email_verification_required: true,
        allowed_domains: "",
      },
      security: {
        session_timeout: 120,
        password_min_length: 8,
        password_require_special: true,
        max_login_attempts: 5,
      },
      defaults: {
        default_llm_mode: "",
        default_theme: "light",
      },
    },
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/system-settings");
      const data = response.data.settings;

      const formData: SystemForm = {
        general: {
          app_name: data.general?.app_name || "Sourdough",
          app_url: data.general?.app_url || "",
          default_timezone: data.general?.default_timezone || "UTC",
          default_locale: data.general?.default_locale || "en",
        },
        registration: {
          enabled: data.registration?.enabled ?? true,
          email_verification_required: data.registration?.email_verification_required ?? true,
          allowed_domains: data.registration?.allowed_domains || "",
        },
        security: {
          session_timeout: data.security?.session_timeout || 120,
          password_min_length: data.security?.password_min_length || 8,
          password_require_special: data.security?.password_require_special ?? true,
          max_login_attempts: data.security?.max_login_attempts || 5,
        },
        defaults: {
          default_llm_mode: data.defaults?.default_llm_mode || "",
          default_theme: data.defaults?.default_theme || "light",
        },
      };

      setSettings(formData);
      Object.keys(formData).forEach((group) => {
        const groupData = formData[group as keyof SystemForm] as Record<string, unknown>;
        Object.keys(groupData).forEach((key) => {
          setValue(`${group}.${key}` as any, groupData[key]);
        });
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to load system settings");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: SystemForm) => {
    setIsSaving(true);
    try {
      const settingsArray: Array<{ group: string; key: string; value: unknown; is_public: boolean }> = [];
      
      // General settings
      Object.entries(data.general).forEach(([key, value]) => {
        // Convert empty strings to null for optional fields
        const finalValue = (key === "app_url" && (!value || value.trim() === "")) ? null : value;
        settingsArray.push({
          group: "general",
          key,
          value: finalValue,
          is_public: key === "app_name" || key === "app_url",
        });
      });

      // Registration settings
      Object.entries(data.registration).forEach(([key, value]) => {
        settingsArray.push({
          group: "registration",
          key,
          value,
          is_public: false,
        });
      });

      // Security settings
      Object.entries(data.security).forEach(([key, value]) => {
        settingsArray.push({
          group: "security",
          key,
          value,
          is_public: false,
        });
      });

      // Defaults settings
      Object.entries(data.defaults).forEach(([key, value]) => {
        settingsArray.push({
          group: "defaults",
          key,
          value,
          is_public: key === "default_theme",
        });
      });

      await api.put("/system-settings", { settings: settingsArray });
      toast.success("System settings updated successfully");
      await fetchSettings();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message 
        || error.response?.data?.error 
        || error.message 
        || "Failed to update system settings";
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
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
        <h1 className="text-3xl font-bold">System Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure application-wide settings and defaults
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="registration">Registration</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="defaults">Defaults</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                  Basic application configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="app_name">Application Name</Label>
                  <Input
                    id="app_name"
                    {...register("general.app_name")}
                    placeholder="Sourdough"
                  />
                  {errors.general?.app_name && (
                    <p className="text-sm text-destructive">
                      {errors.general.app_name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="app_url">Application URL</Label>
                  <Input
                    id="app_url"
                    type="url"
                    {...register("general.app_url")}
                    placeholder="https://example.com"
                  />
                  {errors.general?.app_url && (
                    <p className="text-sm text-destructive">
                      {errors.general.app_url.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="default_timezone">Default Timezone</Label>
                  <Select
                    value={watch("general.default_timezone")}
                    onValueChange={(value) => setValue("general.default_timezone", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.general?.default_timezone && (
                    <p className="text-sm text-destructive">
                      {errors.general.default_timezone.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="default_locale">Default Locale</Label>
                  <Select
                    value={watch("general.default_locale")}
                    onValueChange={(value) => setValue("general.default_locale", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select locale" />
                    </SelectTrigger>
                    <SelectContent>
                      {LOCALES.map((locale) => (
                        <SelectItem key={locale.value} value={locale.value}>
                          {locale.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.general?.default_locale && (
                    <p className="text-sm text-destructive">
                      {errors.general.default_locale.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="registration">
            <Card>
              <CardHeader>
                <CardTitle>Registration Settings</CardTitle>
                <CardDescription>
                  Control user registration and verification
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Registration Enabled</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow new users to register
                    </p>
                  </div>
                  <Switch
                    checked={watch("registration.enabled")}
                    onCheckedChange={(checked) =>
                      setValue("registration.enabled", checked)
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Verification Required</Label>
                    <p className="text-sm text-muted-foreground">
                      Require users to verify their email address
                    </p>
                  </div>
                  <Switch
                    checked={watch("registration.email_verification_required")}
                    onCheckedChange={(checked) =>
                      setValue("registration.email_verification_required", checked)
                    }
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="allowed_domains">Allowed Email Domains</Label>
                  <Input
                    id="allowed_domains"
                    {...register("registration.allowed_domains")}
                    placeholder="example.com, company.com (comma-separated, leave empty for all)"
                  />
                  <p className="text-sm text-muted-foreground">
                    Restrict registration to specific email domains
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Configure security policies and session management
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="session_timeout">Session Timeout (minutes)</Label>
                  <Input
                    id="session_timeout"
                    type="number"
                    {...register("security.session_timeout", { valueAsNumber: true })}
                    min={5}
                    max={1440}
                  />
                  {errors.security?.session_timeout && (
                    <p className="text-sm text-destructive">
                      {errors.security.session_timeout.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password_min_length">Minimum Password Length</Label>
                  <Input
                    id="password_min_length"
                    type="number"
                    {...register("security.password_min_length", { valueAsNumber: true })}
                    min={6}
                    max={128}
                  />
                  {errors.security?.password_min_length && (
                    <p className="text-sm text-destructive">
                      {errors.security.password_min_length.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Special Characters</Label>
                    <p className="text-sm text-muted-foreground">
                      Passwords must contain special characters
                    </p>
                  </div>
                  <Switch
                    checked={watch("security.password_require_special")}
                    onCheckedChange={(checked) =>
                      setValue("security.password_require_special", checked)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_login_attempts">Max Login Attempts</Label>
                  <Input
                    id="max_login_attempts"
                    type="number"
                    {...register("security.max_login_attempts", { valueAsNumber: true })}
                    min={3}
                    max={10}
                  />
                  {errors.security?.max_login_attempts && (
                    <p className="text-sm text-destructive">
                      {errors.security.max_login_attempts.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="defaults">
            <Card>
              <CardHeader>
                <CardTitle>Default Settings</CardTitle>
                <CardDescription>
                  Set default values for new users
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="default_llm_mode">Default LLM Mode</Label>
                  <Input
                    id="default_llm_mode"
                    {...register("defaults.default_llm_mode")}
                    placeholder="auto"
                  />
                  <p className="text-sm text-muted-foreground">
                    Default LLM mode for new users
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="default_theme">Default Theme</Label>
                  <Select
                    value={watch("defaults.default_theme")}
                    onValueChange={(value) => setValue("defaults.default_theme", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="mt-6">
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={!isDirty || isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
