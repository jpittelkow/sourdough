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

const llmSchema = z.object({
  mode: z.enum(["single", "aggregation", "council"]),
  primary: z.enum(["claude", "openai", "gemini", "ollama", "bedrock", "azure"]),
  timeout: z.coerce.number().min(10).max(600),
  logging_enabled: z.boolean(),
  council_min_providers: z.coerce.number().min(2).max(6),
  council_strategy: z.enum(["majority", "weighted", "synthesize"]),
  aggregation_parallel: z.boolean(),
  aggregation_include_sources: z.boolean(),
});
type LLMForm = z.infer<typeof llmSchema>;

const defaultValues: LLMForm = {
  mode: "single",
  primary: "claude",
  timeout: 120,
  logging_enabled: true,
  council_min_providers: 2,
  council_strategy: "synthesize",
  aggregation_parallel: true,
  aggregation_include_sources: true,
};

export default function LLMSystemPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    watch,
    reset,
  } = useForm<LLMForm>({
    resolver: zodResolver(llmSchema),
    mode: "onBlur",
    defaultValues,
  });

  const currentMode = watch("mode");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/llm-settings");
      const settings = response.data?.settings ?? {};
      const formValues: LLMForm = {
        mode: (settings.mode as LLMForm["mode"]) ?? defaultValues.mode,
        primary: (settings.primary as LLMForm["primary"]) ?? defaultValues.primary,
        timeout: settings.timeout != null ? Number(settings.timeout) : defaultValues.timeout,
        logging_enabled: settings.logging_enabled ?? defaultValues.logging_enabled,
        council_min_providers: settings.council_min_providers != null ? Number(settings.council_min_providers) : defaultValues.council_min_providers,
        council_strategy: (settings.council_strategy as LLMForm["council_strategy"]) ?? defaultValues.council_strategy,
        aggregation_parallel: settings.aggregation_parallel ?? defaultValues.aggregation_parallel,
        aggregation_include_sources: settings.aggregation_include_sources ?? defaultValues.aggregation_include_sources,
      };
      reset(formValues);
    } catch (e) {
      toast.error("Failed to load LLM system settings");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: LLMForm) => {
    setIsSaving(true);
    try {
      await api.put("/llm-settings", data);
      toast.success("LLM system settings saved");
      await fetchSettings();
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
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
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">LLM system settings</h1>
        <p className="text-muted-foreground mt-1">
          System-wide defaults for LLM mode, primary provider, and orchestration. Users can override in AI Settings.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mode & provider</CardTitle>
            <CardDescription>
              Default operating mode and primary provider for all users.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField id="mode" label="Mode" error={errors.mode?.message}>
              <Select
                value={watch("mode")}
                onValueChange={(v) => setValue("mode", v as LLMForm["mode"], { shouldDirty: true })}
              >
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single (one provider)</SelectItem>
                  <SelectItem value="aggregation">Aggregation (multiple, primary synthesizes)</SelectItem>
                  <SelectItem value="council">Council (consensus)</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField id="primary" label="Primary provider" error={errors.primary?.message}>
              <Select
                value={watch("primary")}
                onValueChange={(v) => setValue("primary", v as LLMForm["primary"], { shouldDirty: true })}
              >
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="claude">Claude</SelectItem>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="gemini">Gemini</SelectItem>
                  <SelectItem value="ollama">Ollama</SelectItem>
                  <SelectItem value="bedrock">Bedrock</SelectItem>
                  <SelectItem value="azure">Azure OpenAI</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField id="timeout" label="Request timeout (seconds)" error={errors.timeout?.message}>
              <Input
                id="timeout"
                type="number"
                min={10}
                max={600}
                {...register("timeout")}
                className="min-h-[44px]"
              />
            </FormField>
            <SettingsSwitchRow
              label="Log requests"
              description="Log LLM requests for debugging and cost analysis"
              checked={watch("logging_enabled")}
              onCheckedChange={(checked) => setValue("logging_enabled", checked, { shouldDirty: true })}
            />
          </CardContent>
        </Card>

        {currentMode === "council" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Council mode</CardTitle>
              <CardDescription>
                Minimum providers and resolution strategy for council mode.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FormField id="council_min_providers" label="Minimum providers" error={errors.council_min_providers?.message}>
                <Input
                  id="council_min_providers"
                  type="number"
                  min={2}
                  max={6}
                  {...register("council_min_providers")}
                  className="min-h-[44px]"
                />
              </FormField>
              <FormField id="council_strategy" label="Resolution strategy" error={errors.council_strategy?.message}>
                <Select
                  value={watch("council_strategy")}
                  onValueChange={(v) => setValue("council_strategy", v as LLMForm["council_strategy"], { shouldDirty: true })}
                >
                  <SelectTrigger className="min-h-[44px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="majority">Majority</SelectItem>
                    <SelectItem value="weighted">Weighted</SelectItem>
                    <SelectItem value="synthesize">Synthesize</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </CardContent>
          </Card>
        )}

        {currentMode === "aggregation" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Aggregation mode</CardTitle>
              <CardDescription>
                Run provider queries in parallel and include individual responses.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingsSwitchRow
                label="Parallel execution"
                checked={watch("aggregation_parallel")}
                onCheckedChange={(checked) => setValue("aggregation_parallel", checked, { shouldDirty: true })}
              />
              <SettingsSwitchRow
                label="Include sources"
                checked={watch("aggregation_include_sources")}
                onCheckedChange={(checked) => setValue("aggregation_include_sources", checked, { shouldDirty: true })}
              />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardFooter className="flex flex-col gap-4 sm:flex-row sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Changes take effect immediately. Empty values fall back to environment variables.
            </p>
            <SaveButton isDirty={isDirty} isSaving={isSaving} />
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
