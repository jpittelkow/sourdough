"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2,
  Plus,
  Trash2,
  Copy,
  Key,
  Webhook,
  Play,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useAuth, isAdminUser } from "@/lib/auth";

interface ApiToken {
  id: number;
  name: string;
  token_preview: string;
  abilities: string[];
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
}

interface Webhook {
  id: number;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  last_triggered_at: string | null;
  created_at: string;
}

export default function APISettingsPage() {
  const { user } = useAuth();
  const [apiTokens, setApiTokens] = useState<ApiToken[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingToken, setIsCreatingToken] = useState(false);
  const [isCreatingWebhook, setIsCreatingWebhook] = useState(false);
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);
  const [webhookDialogOpen, setWebhookDialogOpen] = useState(false);
  const [newTokenName, setNewTokenName] = useState("");
  const [newToken, setNewToken] = useState<string | null>(null);
  const [newWebhook, setNewWebhook] = useState({
    name: "",
    url: "",
    secret: "",
    events: [] as string[],
    active: true,
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([fetchApiTokens(), fetchWebhooks()]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchApiTokens = async () => {
    try {
      const response = await api.get("/api-tokens");
      setApiTokens(response.data.tokens || []);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to load API tokens"));
    }
  };

  const fetchWebhooks = async () => {
    if (!isAdminUser(user)) return;

    try {
      const response = await api.get("/webhooks");
      setWebhooks(response.data.webhooks || []);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to load webhooks"));
    }
  };

  const handleCreateToken = async () => {
    if (!newTokenName) {
      toast.error("Please enter a token name");
      return;
    }

    setIsCreatingToken(true);
    try {
      const response = await api.post("/api-tokens", {
        name: newTokenName,
        abilities: ["*"],
      });
      setNewToken(response.data.token);
      setNewTokenName("");
      await fetchApiTokens();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to create API token"));
    } finally {
      setIsCreatingToken(false);
    }
  };

  const handleDeleteToken = async (id: number) => {
    if (!confirm("Are you sure you want to delete this API token?")) {
      return;
    }

    try {
      await api.delete(`/api-tokens/${id}`);
      toast.success("API token deleted");
      await fetchApiTokens();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to delete API token"));
    }
  };

  const handleCreateWebhook = async () => {
    if (!newWebhook.name || !newWebhook.url || newWebhook.events.length === 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsCreatingWebhook(true);
    try {
      await api.post("/webhooks", newWebhook);
      toast.success("Webhook created successfully");
      setWebhookDialogOpen(false);
      setNewWebhook({
        name: "",
        url: "",
        secret: "",
        events: [],
        active: true,
      });
      await fetchWebhooks();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to create webhook"));
    } finally {
      setIsCreatingWebhook(false);
    }
  };

  const handleDeleteWebhook = async (id: number) => {
    if (!confirm("Are you sure you want to delete this webhook?")) {
      return;
    }

    try {
      await api.delete(`/webhooks/${id}`);
      toast.success("Webhook deleted");
      await fetchWebhooks();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to delete webhook"));
    }
  };

  const handleTestWebhook = async (id: number) => {
    try {
      await api.post(`/webhooks/${id}/test`);
      toast.success("Webhook test sent");
      await fetchWebhooks();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to test webhook"));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const toggleEvent = (event: string) => {
    setNewWebhook({
      ...newWebhook,
      events: newWebhook.events.includes(event)
        ? newWebhook.events.filter((e) => e !== event)
        : [...newWebhook.events, event],
    });
  };

  const availableEvents = [
    "user.created",
    "user.updated",
    "user.deleted",
    "backup.completed",
    "backup.failed",
    "settings.updated",
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">API & Webhooks</h1>
        <p className="text-muted-foreground mt-2">
          Manage API tokens and webhook endpoints
        </p>
      </div>

      <Tabs defaultValue="tokens" className="space-y-6">
        <TabsList>
          <TabsTrigger value="tokens">
            <Key className="mr-2 h-4 w-4" />
            API Tokens
          </TabsTrigger>
          {isAdminUser(user) && (
            <TabsTrigger value="webhooks">
              <Webhook className="mr-2 h-4 w-4" />
              Webhooks
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="tokens">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Personal API Tokens</CardTitle>
                  <CardDescription>
                    Create tokens to access the API
                  </CardDescription>
                </div>
                <Button onClick={() => setTokenDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Token
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : apiTokens.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No API tokens created yet
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Token</TableHead>
                        <TableHead>Last Used</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {apiTokens.map((token) => (
                        <TableRow key={token.id}>
                          <TableCell className="font-medium">
                            {token.name}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {token.token_preview}
                          </TableCell>
                          <TableCell>
                            {token.last_used_at
                              ? new Date(token.last_used_at).toLocaleDateString()
                              : "Never"}
                          </TableCell>
                          <TableCell>
                            {new Date(token.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteToken(token.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {isAdminUser(user) && (
          <TabsContent value="webhooks">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Webhooks</CardTitle>
                    <CardDescription>
                      Configure outgoing webhook endpoints
                    </CardDescription>
                  </div>
                  <Button onClick={() => setWebhookDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Webhook
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : webhooks.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No webhooks configured
                  </div>
                ) : (
                  <div className="space-y-4">
                    {webhooks.map((webhook) => (
                      <Card key={webhook.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{webhook.name}</span>
                                {webhook.active ? (
                                  <Badge variant="success">
                                    Active
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">Inactive</Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {webhook.url}
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {webhook.events.map((event) => (
                                  <Badge key={event} variant="outline">
                                    {event}
                                  </Badge>
                                ))}
                              </div>
                              {webhook.last_triggered_at && (
                                <div className="text-xs text-muted-foreground">
                                  Last triggered:{" "}
                                  {new Date(webhook.last_triggered_at).toLocaleString()}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleTestWebhook(webhook.id)}
                              >
                                <Play className="mr-2 h-4 w-4" />
                                Test
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteWebhook(webhook.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Create Token Dialog */}
      <Dialog open={tokenDialogOpen} onOpenChange={setTokenDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create API Token</DialogTitle>
            <DialogDescription>
              {newToken
                ? "Copy your token now. You won't be able to see it again!"
                : "Create a new personal access token"}
            </DialogDescription>
          </DialogHeader>
            {newToken ? (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Your Token</Label>
                  <div className="flex gap-2">
                    <Input value={newToken} readOnly className="font-mono" />
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(newToken)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-destructive">
                    Make sure to copy this token. You won't be able to see it again.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="token-name">Token Name</Label>
                  <Input
                    id="token-name"
                    value={newTokenName}
                    onChange={(e) => setNewTokenName(e.target.value)}
                    placeholder="My API Token"
                  />
                </div>
              </div>
            )}
          <DialogFooter>
            {newToken ? (
              <Button onClick={() => {
                setNewToken(null);
                setTokenDialogOpen(false);
              }}>
                Done
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setTokenDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateToken} disabled={isCreatingToken}>
                  {isCreatingToken && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Webhook Dialog */}
      {isAdminUser(user) && (
        <Dialog open={webhookDialogOpen} onOpenChange={setWebhookDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Webhook</DialogTitle>
              <DialogDescription>
                Configure a new webhook endpoint
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="webhook-name">Name</Label>
                <Input
                  id="webhook-name"
                  value={newWebhook.name}
                  onChange={(e) =>
                    setNewWebhook({ ...newWebhook, name: e.target.value })
                  }
                  placeholder="My Webhook"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="webhook-url">URL</Label>
                <Input
                  id="webhook-url"
                  type="url"
                  value={newWebhook.url}
                  onChange={(e) =>
                    setNewWebhook({ ...newWebhook, url: e.target.value })
                  }
                  placeholder="https://example.com/webhook"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="webhook-secret">Secret (optional)</Label>
                <Input
                  id="webhook-secret"
                  type="password"
                  value={newWebhook.secret}
                  onChange={(e) =>
                    setNewWebhook({ ...newWebhook, secret: e.target.value })
                  }
                  placeholder="Webhook secret for verification"
                />
              </div>
              <div className="space-y-2">
                <Label>Events</Label>
                <div className="grid grid-cols-2 gap-2">
                  {availableEvents.map((event) => (
                    <div key={event} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`event-${event}`}
                        checked={newWebhook.events.includes(event)}
                        onChange={() => toggleEvent(event)}
                        className="rounded"
                      />
                      <Label htmlFor={`event-${event}`} className="cursor-pointer">
                        {event}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch
                  checked={newWebhook.active}
                  onCheckedChange={(checked) =>
                    setNewWebhook({ ...newWebhook, active: checked })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setWebhookDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateWebhook} disabled={isCreatingWebhook}>
                {isCreatingWebhook && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
