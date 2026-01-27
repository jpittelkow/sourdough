"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
} from "lucide-react";

interface AIProvider {
  id: number;
  provider: string;
  model: string;
  api_key_set: boolean;
  is_enabled: boolean;
  is_primary: boolean;
}

interface ProviderTemplate {
  id: string;
  name: string;
  models: string[];
  requires_api_key: boolean;
  supports_vision: boolean;
}

const providerTemplates: ProviderTemplate[] = [
  {
    id: "claude",
    name: "Claude (Anthropic)",
    models: ["claude-3-opus-20240229", "claude-3-sonnet-20240229", "claude-3-haiku-20240307"],
    requires_api_key: true,
    supports_vision: true,
  },
  {
    id: "openai",
    name: "OpenAI",
    models: ["gpt-4-turbo-preview", "gpt-4", "gpt-3.5-turbo"],
    requires_api_key: true,
    supports_vision: true,
  },
  {
    id: "gemini",
    name: "Gemini (Google)",
    models: ["gemini-pro", "gemini-pro-vision"],
    requires_api_key: true,
    supports_vision: true,
  },
  {
    id: "ollama",
    name: "Ollama (Local)",
    models: ["llama2", "mistral", "mixtral", "codellama"],
    requires_api_key: false,
    supports_vision: false,
  },
];

type LLMMode = "single" | "aggregation" | "council";

export default function AISettingsPage() {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [mode, setMode] = useState<LLMMode>("single");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [testingProviders, setTestingProviders] = useState<Set<number>>(new Set());

  // Add provider dialog state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [newProviderModel, setNewProviderModel] = useState<string>("");
  const [newProviderApiKey, setNewProviderApiKey] = useState<string>("");
  const [newProviderBaseUrl, setNewProviderBaseUrl] = useState<string>("");

  useEffect(() => {
    fetchAIConfig();
  }, []);

  const fetchAIConfig = async () => {
    try {
      const response = await api.get("/llm/config");
      setProviders(response.data.providers || []);
      setMode(response.data.mode || "single");
    } catch (error) {
      console.error("Failed to fetch AI config:", error);
    } finally {
      setIsLoading(false);
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
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
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
                      <div className="space-y-2">
                        <Label>Model</Label>
                        <Select
                          value={newProviderModel}
                          onValueChange={setNewProviderModel}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a model" />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedTemplateData.models.map((model) => (
                              <SelectItem key={model} value={model}>
                                {model}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedTemplateData.requires_api_key && (
                        <div className="space-y-2">
                          <Label>API Key</Label>
                          <Input
                            type="password"
                            value={newProviderApiKey}
                            onChange={(e) => setNewProviderApiKey(e.target.value)}
                            placeholder="Enter your API key"
                          />
                        </div>
                      )}

                      {selectedTemplate === "ollama" && (
                        <div className="space-y-2">
                          <Label>Base URL (optional)</Label>
                          <Input
                            type="text"
                            value={newProviderBaseUrl}
                            onChange={(e) => setNewProviderBaseUrl(e.target.value)}
                            placeholder="http://localhost:11434"
                          />
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
    </div>
  );
}
