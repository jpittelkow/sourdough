"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { errorLogger } from "@/lib/error-logger";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FormField } from "@/components/ui/form-field";
import { SettingsSwitchRow } from "@/components/ui/settings-switch-row";
import { SaveButton } from "@/components/ui/save-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Loader2,
  Brain,
  Plus,
  Trash2,
  Star,
  StarOff,
  CheckCircle,
  XCircle,
  Play,
  Settings2,
  Info,
  Cpu,
} from "lucide-react";

interface AIProvider {
  id: number;
  provider: string;
  model: string;
  api_key_set: boolean;
  is_enabled: boolean;
  is_primary: boolean;
}

interface DiscoveredModel {
  id: string;
  name: string;
  provider: string;
  capabilities?: string[];
}

interface ProviderTemplate {
  id: string;
  name: string;
  requires_api_key: boolean;
  supports_vision: boolean;
  supports_discovery: boolean;
}

const providerTemplates: ProviderTemplate[] = [
  {
    id: "claude",
    name: "Claude (Anthropic)",
    requires_api_key: true,
    supports_vision: true,
    supports_discovery: true,
  },
  {
    id: "openai",
    name: "OpenAI",
    requires_api_key: true,
    supports_vision: true,
    supports_discovery: true,
  },
  {
    id: "gemini",
    name: "Gemini (Google)",
    requires_api_key: true,
    supports_vision: true,
    supports_discovery: true,
  },
  {
    id: "ollama",
    name: "Ollama (Local)",
    requires_api_key: false,
    supports_vision: false,
    supports_discovery: true,
  },
];

type LLMMode = "single" | "aggregation" | "council";

const SYSTEM_DEFAULTS_INIT = {
  timeout: 120,
  logging_enabled: true,
  council_min_providers: 2,
  council_strategy: "synthesize" as const,
  aggregation_parallel: true,
  aggregation_include_sources: true,
};

type CouncilStrategy = "majority" | "weighted" | "synthesize";

export default function AISettingsPage() {
  const { user } = useAuth();
  const isAdmin = user?.is_admin ?? false;

  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [mode, setMode] = useState<LLMMode>("single");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [testingProviders, setTestingProviders] = useState<Set<number>>(new Set());

  // System defaults (admin-only)
  const [systemDefaults, setSystemDefaults] = useState<{
    timeout: number;
    logging_enabled: boolean;
    council_min_providers: number;
    council_strategy: CouncilStrategy;
    aggregation_parallel: boolean;
    aggregation_include_sources: boolean;
  }>(SYSTEM_DEFAULTS_INIT);
  const [systemDefaultsDirty, setSystemDefaultsDirty] = useState(false);
  const [systemDefaultsSaving, setSystemDefaultsSaving] = useState(false);
  const [systemDefaultsLoaded, setSystemDefaultsLoaded] = useState(false);

  // Add provider dialog state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [newProviderModel, setNewProviderModel] = useState<string>("");
  const [newProviderApiKey, setNewProviderApiKey] = useState<string>("");
  const [newProviderBaseUrl, setNewProviderBaseUrl] = useState<string>("");

  // API key validation state (Add Provider dialog)
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyValid, setKeyValid] = useState<boolean | null>(null);
  const [keyError, setKeyError] = useState<string | null>(null);

  // Model discovery state (Add Provider dialog)
  const [discoveredModels, setDiscoveredModels] = useState<DiscoveredModel[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);

  const fetchAIConfig = useCallback(async () => {
    try {
      const response = await api.get("/llm/config");
      setProviders(response.data.providers || []);
      setMode(response.data.mode || "single");
    } catch (error) {
      errorLogger.report(
        error instanceof Error ? error : new Error("Failed to fetch AI config"),
        { source: "ai-page" }
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchSystemDefaults = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const response = await api.get("/llm-settings");
      const s = response.data?.settings ?? {};
      setSystemDefaults({
        timeout: s.timeout != null ? Number(s.timeout) : SYSTEM_DEFAULTS_INIT.timeout,
        logging_enabled: s.logging_enabled ?? SYSTEM_DEFAULTS_INIT.logging_enabled,
        council_min_providers: s.council_min_providers != null ? Number(s.council_min_providers) : SYSTEM_DEFAULTS_INIT.council_min_providers,
        council_strategy: (s.council_strategy as CouncilStrategy) ?? SYSTEM_DEFAULTS_INIT.council_strategy,
        aggregation_parallel: s.aggregation_parallel ?? SYSTEM_DEFAULTS_INIT.aggregation_parallel,
        aggregation_include_sources: s.aggregation_include_sources ?? SYSTEM_DEFAULTS_INIT.aggregation_include_sources,
      });
      setSystemDefaultsDirty(false);
    } catch {
      toast.error("Failed to load system defaults");
    } finally {
      setSystemDefaultsLoaded(true);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchAIConfig();
  }, [fetchAIConfig]);

  useEffect(() => {
    if (isAdmin && !systemDefaultsLoaded) {
      fetchSystemDefaults();
    }
  }, [isAdmin, systemDefaultsLoaded, fetchSystemDefaults]);

  const saveSystemDefaults = async () => {
    if (!isAdmin || !systemDefaultsDirty) return;
    setSystemDefaultsSaving(true);
    try {
      await api.put("/llm-settings", {
        timeout: systemDefaults.timeout,
        logging_enabled: systemDefaults.logging_enabled,
        council_min_providers: systemDefaults.council_min_providers,
        council_strategy: systemDefaults.council_strategy,
        aggregation_parallel: systemDefaults.aggregation_parallel,
        aggregation_include_sources: systemDefaults.aggregation_include_sources,
      });
      toast.success("System defaults saved");
      setSystemDefaultsDirty(false);
      await fetchSystemDefaults();
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : null;
      toast.error(msg ?? "Failed to save system defaults");
    } finally {
      setSystemDefaultsSaving(false);
    }
  };

  const handleModeChange = async (newMode: LLMMode) => {
    setMode(newMode);
    setIsSaving(true);

    try {
      await api.put("/llm/config", { mode: newMode });
      toast.success(`LLM mode set to ${newMode}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to update mode");
      // Revert
      fetchAIConfig();
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddProvider = async () => {
    if (!selectedTemplate || !newProviderModel) {
      toast.error("Please select a provider and model");
      return;
    }

    const template = providerTemplates.find((t) => t.id === selectedTemplate);
    if (template?.requires_api_key && !newProviderApiKey) {
      toast.error("API key is required for this provider");
      return;
    }

    setIsSaving(true);

    try {
      const response = await api.post("/llm/providers", {
        provider: selectedTemplate,
        model: newProviderModel,
        api_key: newProviderApiKey || undefined,
        base_url: newProviderBaseUrl || undefined,
      });

      setProviders((prev) => [...prev, response.data.provider]);
      setShowAddDialog(false);
      resetAddDialog();
      toast.success("Provider added successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to add provider");
    } finally {
      setIsSaving(false);
    }
  };

  const resetAddDialog = () => {
    setSelectedTemplate("");
    setNewProviderModel("");
    setNewProviderApiKey("");
    setNewProviderBaseUrl("");
    setKeyValid(null);
    setKeyError(null);
    setDiscoveredModels([]);
    setDiscoveryError(null);
  };

  const testApiKey = async () => {
    if (selectedTemplate === "ollama") {
      if (!newProviderBaseUrl?.trim()) {
        setKeyError("Enter Ollama host (e.g. http://localhost:11434)");
        return;
      }
    } else if (!newProviderApiKey?.trim()) {
      setKeyError("Enter your API key");
      return;
    }
    setIsTestingKey(true);
    setKeyError(null);
    setKeyValid(null);
    try {
      const response = await api.post("/llm-settings/test-key", {
        provider: selectedTemplate,
        api_key: newProviderApiKey || undefined,
        host: selectedTemplate === "ollama" ? (newProviderBaseUrl || "http://localhost:11434") : undefined,
      });
      setKeyValid(response.data.valid);
      if (!response.data.valid && response.data.error) {
        setKeyError(response.data.error);
      }
    } catch (err: unknown) {
      const data = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { error?: string; message?: string } } }).response?.data
        : null;
      setKeyValid(false);
      setKeyError(data?.error ?? data?.message ?? "Failed to validate API key");
    } finally {
      setIsTestingKey(false);
    }
  };

  const discoverModels = async () => {
    if (selectedTemplate === "ollama") {
      if (!newProviderBaseUrl?.trim()) {
        setDiscoveryError("Enter Ollama host first");
        return;
      }
    } else if (!newProviderApiKey?.trim()) {
      setDiscoveryError("Enter your API key first");
      return;
    }
    setIsDiscovering(true);
    setDiscoveryError(null);
    try {
      const response = await api.post("/llm-settings/discover-models", {
        provider: selectedTemplate,
        api_key: newProviderApiKey || undefined,
        host: selectedTemplate === "ollama" ? (newProviderBaseUrl || "http://localhost:11434") : undefined,
      });
      setDiscoveredModels(response.data.models ?? []);
      if ((response.data.models ?? []).length === 0) {
        setDiscoveryError("No models returned. Check your API key or host.");
      }
    } catch (err: unknown) {
      const data = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { error?: string; message?: string } } }).response?.data
        : null;
      setDiscoveryError(data?.message ?? data?.error ?? "Failed to fetch models. Check your API key.");
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleToggleProvider = async (providerId: number, enabled: boolean) => {
    setProviders((prev) =>
      prev.map((p) => (p.id === providerId ? { ...p, is_enabled: enabled } : p))
    );

    try {
      await api.put(`/llm/providers/${providerId}`, { is_enabled: enabled });
    } catch (error: any) {
      toast.error(error.message || "Failed to update provider");
      fetchAIConfig();
    }
  };

  const handleSetPrimary = async (providerId: number) => {
    setProviders((prev) =>
      prev.map((p) => ({
        ...p,
        is_primary: p.id === providerId,
      }))
    );

    try {
      await api.put(`/llm/providers/${providerId}`, { is_primary: true });
      toast.success("Primary provider updated");
    } catch (error: any) {
      toast.error(error.message || "Failed to update provider");
      fetchAIConfig();
    }
  };

  const handleDeleteProvider = async (providerId: number) => {
    try {
      await api.delete(`/llm/providers/${providerId}`);
      setProviders((prev) => prev.filter((p) => p.id !== providerId));
      toast.success("Provider removed");
    } catch (error: any) {
      toast.error(error.message || "Failed to remove provider");
    }
  };

  const handleTestProvider = async (providerId: number, providerName: string) => {
    setTestingProviders((prev) => new Set(prev).add(providerId));

    try {
      const response = await api.post(`/llm/test/${providerName}`);
      if (response.data.success) {
        toast.success("Provider connection successful!");
      } else {
        toast.error(response.data.error || "Connection test failed");
      }
    } catch (error: any) {
      toast.error(error.message || "Connection test failed");
    } finally {
      setTestingProviders((prev) => {
        const newSet = new Set(prev);
        newSet.delete(providerId);
        return newSet;
      });
    }
  };

  const selectedTemplateData = providerTemplates.find(
    (t) => t.id === selectedTemplate
  );

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
        <h1 className="text-2xl font-bold tracking-tight">AI / LLM Settings</h1>
        <p className="text-muted-foreground">
          Configure AI providers and orchestration modes.
        </p>
      </div>

      {/* Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Orchestration Mode
          </CardTitle>
          <CardDescription>
            Choose how AI providers work together to generate responses.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={mode} onValueChange={(v) => handleModeChange(v as LLMMode)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="single">Single</TabsTrigger>
              <TabsTrigger value="aggregation">Aggregation</TabsTrigger>
              <TabsTrigger value="council">Council</TabsTrigger>
            </TabsList>
            <TabsContent value="single" className="mt-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Single Mode</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>
                    Queries are sent to your primary provider only. This is the fastest
                    and most cost-effective option.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <strong>Best for:</strong> Standard tasks, cost-conscious usage, when you trust
                    one provider for your needs. Uses 1 API call per request.
                  </p>
                </AlertDescription>
              </Alert>
            </TabsContent>
            <TabsContent value="aggregation" className="mt-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Aggregation Mode</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>
                    All enabled providers are queried in parallel, then the primary provider
                    reads all responses and synthesizes them into one comprehensive answer.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <strong>Best for:</strong> Complex questions where different AI models may offer
                    unique insights. The primary provider decides what to include. Uses N+1 API calls.
                  </p>
                </AlertDescription>
              </Alert>
            </TabsContent>
            <TabsContent value="council" className="mt-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Council Mode</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>
                    All providers respond independently, then a consensus algorithm compares their
                    answers. The final response includes only points where providers agree (70%+
                    threshold), plus a confidence score and any dissenting views.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <strong>Best for:</strong> Critical decisions, fact verification, reducing AI
                    hallucinations. No single provider has final say—it&apos;s democratic. Requires
                    at least 2 enabled providers.
                  </p>
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Providers List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Providers
              </CardTitle>
              <CardDescription>
                Manage your configured AI providers.
              </CardDescription>
            </div>
            <Dialog
              open={showAddDialog}
              onOpenChange={(open) => {
                setShowAddDialog(open);
                if (!open) resetAddDialog();
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Provider
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add AI Provider</DialogTitle>
                  <DialogDescription>
                    Configure a new AI provider for your application.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Provider</Label>
                    <Select
                      value={selectedTemplate}
                      onValueChange={(v) => {
                        setSelectedTemplate(v);
                        setNewProviderModel("");
                        setKeyValid(null);
                        setKeyError(null);
                        setDiscoveredModels([]);
                        setDiscoveryError(null);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {providerTemplates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedTemplateData && (
                    <>
                      {selectedTemplateData.requires_api_key && (
                        <div className="space-y-2">
                          <Label>API Key</Label>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Input
                                type="password"
                                value={newProviderApiKey}
                                onChange={(e) => {
                                  setNewProviderApiKey(e.target.value);
                                  setKeyValid(null);
                                  setKeyError(null);
                                  setDiscoveredModels([]);
                                  setDiscoveryError(null);
                                }}
                                placeholder="Enter your API key"
                              />
                              {keyValid === true && (
                                <CheckCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-500" />
                              )}
                              {keyValid === false && (
                                <XCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-destructive" />
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={testApiKey}
                              disabled={!newProviderApiKey.trim() || isTestingKey}
                            >
                              {isTestingKey ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Test"
                              )}
                            </Button>
                          </div>
                          {keyError && (
                            <p className="text-sm text-destructive">{keyError}</p>
                          )}
                        </div>
                      )}

                      {selectedTemplate === "ollama" && (
                        <div className="space-y-2">
                          <Label>Ollama host</Label>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Input
                                type="text"
                                value={newProviderBaseUrl}
                                onChange={(e) => {
                                  setNewProviderBaseUrl(e.target.value);
                                  setKeyValid(null);
                                  setKeyError(null);
                                  setDiscoveredModels([]);
                                  setDiscoveryError(null);
                                }}
                                placeholder="http://localhost:11434"
                              />
                              {keyValid === true && (
                                <CheckCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-500" />
                              )}
                              {keyValid === false && (
                                <XCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-destructive" />
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={testApiKey}
                              disabled={!newProviderBaseUrl?.trim() || isTestingKey}
                            >
                              {isTestingKey ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Test"
                              )}
                            </Button>
                          </div>
                          {keyError && (
                            <p className="text-sm text-destructive">{keyError}</p>
                          )}
                        </div>
                      )}

                      {selectedTemplateData.supports_discovery && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Label className="mb-0">Models</Label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={discoverModels}
                              disabled={
                                (selectedTemplateData.requires_api_key && !newProviderApiKey?.trim()) ||
                                (selectedTemplate === "ollama" && !newProviderBaseUrl?.trim()) ||
                                isDiscovering
                              }
                            >
                              {isDiscovering ? (
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                              ) : null}
                              Fetch Models
                            </Button>
                          </div>
                          {discoveryError && (
                            <p className="text-sm text-destructive">{discoveryError}</p>
                          )}
                          {discoveredModels.length > 0 ? (
                            <Select
                              value={newProviderModel}
                              onValueChange={setNewProviderModel}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a model" />
                              </SelectTrigger>
                              <SelectContent>
                                {discoveredModels.map((model) => (
                                  <SelectItem key={model.id} value={model.id}>
                                    {model.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              Enter your API key (or host for Ollama) and click Fetch Models.
                            </p>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2">
                        {selectedTemplateData.supports_vision && (
                          <Badge variant="secondary">Vision Support</Badge>
                        )}
                        {!selectedTemplateData.requires_api_key && (
                          <Badge variant="outline">No API Key Required</Badge>
                        )}
                      </div>
                    </>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddDialog(false);
                      resetAddDialog();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAddProvider} disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add Provider
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {providers.length === 0 ? (
            <div className="text-center py-8">
              <Brain className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">No providers configured</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Add an AI provider to get started with LLM functionality.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {providers.map((provider) => (
                <div
                  key={provider.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-2 rounded-full ${
                        provider.is_enabled
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Brain className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium capitalize">
                          {provider.provider}
                        </span>
                        {provider.is_primary && (
                          <Badge variant="default" className="text-xs">
                            <Star className="mr-1 h-3 w-3" />
                            Primary
                          </Badge>
                        )}
                        {provider.api_key_set ? (
                          <Badge variant="success" className="text-xs">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            API Key Set
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            <XCircle className="mr-1 h-3 w-3" />
                            No API Key
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {provider.model}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        handleTestProvider(provider.id, provider.provider)
                      }
                      disabled={testingProviders.has(provider.id)}
                    >
                      {testingProviders.has(provider.id) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleSetPrimary(provider.id)}
                      disabled={provider.is_primary}
                    >
                      {provider.is_primary ? (
                        <Star className="h-4 w-4 fill-current" />
                      ) : (
                        <StarOff className="h-4 w-4" />
                      )}
                    </Button>
                    <Switch
                      checked={provider.is_enabled}
                      onCheckedChange={(checked) =>
                        handleToggleProvider(provider.id, checked)
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteProvider(provider.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mode Requirements Alert */}
      {mode === "council" && providers.filter((p) => p.is_enabled).length < 2 && (
        <Alert variant="warning">
          <AlertTitle>Council Mode Requirement</AlertTitle>
          <AlertDescription>
            Council mode requires at least 2 enabled providers to reach consensus.
            Please enable more providers or switch to a different mode.
          </AlertDescription>
        </Alert>
      )}

      {/* System Defaults (admin-only) */}
      {isAdmin && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveSystemDefaults();
          }}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5" />
                System Defaults
              </CardTitle>
              <CardDescription>
                System-wide LLM defaults: timeout, logging, and mode-specific options.
                Users inherit these when not overridden.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
            <FormField id="sys-timeout" label="Request timeout (seconds)">
              <Input
                id="sys-timeout"
                type="number"
                min={10}
                max={600}
                value={systemDefaults.timeout}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (!isNaN(v)) {
                    setSystemDefaults((prev) => ({ ...prev, timeout: Math.max(10, Math.min(600, v)) }));
                    setSystemDefaultsDirty(true);
                  }
                }}
                className="min-h-[44px] max-w-xs"
              />
            </FormField>
            <SettingsSwitchRow
              label="Log requests"
              description="Log LLM requests for debugging and cost analysis"
              checked={systemDefaults.logging_enabled}
              onCheckedChange={(checked) => {
                setSystemDefaults((prev) => ({ ...prev, logging_enabled: checked }));
                setSystemDefaultsDirty(true);
              }}
            />

            {mode === "council" && (
              <div className="space-y-4 pt-2 border-t">
                <h4 className="text-sm font-medium">Council mode</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField id="sys-council-min" label="Minimum providers">
                    <Input
                      id="sys-council-min"
                      type="number"
                      min={2}
                      max={6}
                      value={systemDefaults.council_min_providers}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10);
                        if (!isNaN(v)) {
                          setSystemDefaults((prev) => ({ ...prev, council_min_providers: Math.max(2, Math.min(6, v)) }));
                          setSystemDefaultsDirty(true);
                        }
                      }}
                      className="min-h-[44px]"
                    />
                  </FormField>
                  <FormField id="sys-council-strategy" label="Resolution strategy">
                    <Select
                      value={systemDefaults.council_strategy}
                      onValueChange={(v: CouncilStrategy) => {
                        setSystemDefaults((prev) => ({ ...prev, council_strategy: v }));
                        setSystemDefaultsDirty(true);
                      }}
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
                </div>
              </div>
            )}

            {mode === "aggregation" && (
              <div className="space-y-4 pt-2 border-t">
                <h4 className="text-sm font-medium">Aggregation mode</h4>
                <div className="space-y-4">
                  <SettingsSwitchRow
                    label="Parallel execution"
                    description="Run provider queries in parallel"
                    checked={systemDefaults.aggregation_parallel}
                    onCheckedChange={(checked) => {
                      setSystemDefaults((prev) => ({ ...prev, aggregation_parallel: checked }));
                      setSystemDefaultsDirty(true);
                    }}
                  />
                  <SettingsSwitchRow
                    label="Include sources"
                    description="Include individual provider responses"
                    checked={systemDefaults.aggregation_include_sources}
                    onCheckedChange={(checked) => {
                      setSystemDefaults((prev) => ({ ...prev, aggregation_include_sources: checked }));
                      setSystemDefaultsDirty(true);
                    }}
                  />
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4 sm:flex-row sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Changes take effect immediately. Empty values fall back to environment variables.
            </p>
            <SaveButton
              isDirty={systemDefaultsDirty}
              isSaving={systemDefaultsSaving}
            />
          </CardFooter>
        </Card>
        </form>
      )}
    </div>
  );
}
