"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth, isAdminUser } from "@/lib/auth";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, FolderOpen, Globe, Archive, Database, Users, FileText, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { ProviderIcon } from "@/components/provider-icons";

const DRIVERS = ["local", "s3", "gcs", "azure", "do_spaces", "minio", "b2"] as const;

const storageSchema = z.object({
  driver: z.enum(DRIVERS),
  max_upload_size: z.number().min(1),
  allowed_file_types: z.array(z.string()),
  s3_bucket: z.string().optional(),
  s3_region: z.string().optional(),
  s3_key: z.string().optional(),
  s3_secret: z.string().optional(),
  gcs_bucket: z.string().optional(),
  gcs_project_id: z.string().optional(),
  gcs_credentials_json: z.string().optional(),
  azure_container: z.string().optional(),
  azure_connection_string: z.string().optional(),
  do_spaces_bucket: z.string().optional(),
  do_spaces_region: z.string().optional(),
  do_spaces_key: z.string().optional(),
  do_spaces_secret: z.string().optional(),
  do_spaces_endpoint: z.string().optional(),
  minio_bucket: z.string().optional(),
  minio_endpoint: z.string().optional(),
  minio_key: z.string().optional(),
  minio_secret: z.string().optional(),
  b2_bucket: z.string().optional(),
  b2_region: z.string().optional(),
  b2_key_id: z.string().optional(),
  b2_application_key: z.string().optional(),
});

type StorageForm = z.infer<typeof storageSchema>;

const STORAGE_PROVIDERS: { id: (typeof DRIVERS)[number]; label: string }[] = [
  { id: "local", label: "Local Filesystem" },
  { id: "s3", label: "Amazon S3" },
  { id: "gcs", label: "Google Cloud Storage" },
  { id: "azure", label: "Azure Blob Storage" },
  { id: "do_spaces", label: "DigitalOcean Spaces" },
  { id: "minio", label: "MinIO" },
  { id: "b2", label: "Backblaze B2" },
];

interface StorageStats {
  driver: string;
  total_size: number;
  total_size_formatted: string;
  file_count: number;
  breakdown?: Record<string, { size: number; size_formatted: string }>;
}

interface StoragePath {
  key: string;
  path: string;
  description: string;
}

interface StorageHealth {
  status: "healthy" | "warning";
  writable: boolean;
  disk_used_percent: number;
  disk_free_formatted: string;
  disk_total_formatted: string;
}

export default function StorageSettingsPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [paths, setPaths] = useState<StoragePath[]>([]);
  const [health, setHealth] = useState<StorageHealth | null>(null);
  const [fileTypesInput, setFileTypesInput] = useState("");
  const [testStatus, setTestStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [testError, setTestError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isDirty }, setValue, watch } = useForm<StorageForm>({
    resolver: zodResolver(storageSchema),
    defaultValues: {
      driver: "local",
      max_upload_size: 10485760, // 10MB
      allowed_file_types: [],
    },
  });

  const driver = watch("driver");

  useEffect(() => {
    fetchSettings();
    fetchStats();
    fetchPaths();
    fetchHealth();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/storage-settings");
      const settings = response.data.settings || {};

      if (settings.allowed_file_types) {
        setFileTypesInput(Array.isArray(settings.allowed_file_types)
          ? settings.allowed_file_types.join(", ")
          : settings.allowed_file_types);
      }

      Object.keys(settings).forEach((key) => {
        if (key === "max_upload_size") {
          setValue(key as any, settings[key] ? parseInt(settings[key]) : 10485760);
        } else if (key === "allowed_file_types") {
          setValue(key as any, Array.isArray(settings[key]) ? settings[key] : []);
        } else {
          setValue(key as any, settings[key] || "");
        }
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to load storage settings");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    setIsLoadingStats(true);
    try {
      const response = await api.get("/storage-settings/stats");
      setStats(response.data);
    } catch (error: any) {
      // Stats might not be available
    } finally {
      setIsLoadingStats(false);
    }
  };

  const fetchPaths = async () => {
    try {
      const response = await api.get("/storage-settings/paths");
      setPaths(response.data.paths ?? []);
    } catch (error: any) {
      // Paths might not be available
    }
  };

  const fetchHealth = async () => {
    try {
      const response = await api.get("/storage-settings/health");
      setHealth(response.data);
    } catch (error: any) {
      // Health might not be available
    }
  };

  const onTestConnection = async () => {
    setTestStatus("loading");
    setTestError(null);
    try {
      const fileTypes = fileTypesInput
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
      const payload = {
        driver,
        max_upload_size: 0,
        allowed_file_types: fileTypes,
        ...(driver === "s3" && {
          s3_bucket: watch("s3_bucket"),
          s3_region: watch("s3_region"),
          s3_key: watch("s3_key"),
          s3_secret: watch("s3_secret"),
        }),
        ...(driver === "gcs" && {
          gcs_bucket: watch("gcs_bucket"),
          gcs_project_id: watch("gcs_project_id"),
          gcs_credentials_json: watch("gcs_credentials_json"),
        }),
        ...(driver === "azure" && {
          azure_container: watch("azure_container"),
          azure_connection_string: watch("azure_connection_string"),
        }),
        ...(driver === "do_spaces" && {
          do_spaces_bucket: watch("do_spaces_bucket"),
          do_spaces_region: watch("do_spaces_region"),
          do_spaces_key: watch("do_spaces_key"),
          do_spaces_secret: watch("do_spaces_secret"),
          do_spaces_endpoint: watch("do_spaces_endpoint"),
        }),
        ...(driver === "minio" && {
          minio_bucket: watch("minio_bucket"),
          minio_endpoint: watch("minio_endpoint"),
          minio_key: watch("minio_key"),
          minio_secret: watch("minio_secret"),
        }),
        ...(driver === "b2" && {
          b2_bucket: watch("b2_bucket"),
          b2_region: watch("b2_region"),
          b2_key_id: watch("b2_key_id"),
          b2_application_key: watch("b2_application_key"),
        }),
      };
      const response = await api.post("/storage-settings/test", payload);
      if (response.data?.success) {
        setTestStatus("success");
        toast.success("Connection successful");
      } else {
        setTestStatus("error");
        setTestError(response.data?.error ?? "Connection failed");
      }
    } catch (error: any) {
      setTestStatus("error");
      const msg = error.response?.data?.error ?? error.message ?? "Connection test failed";
      setTestError(msg);
      toast.error(msg);
    }
  };

  const onSubmit = async (data: StorageForm) => {
    setIsSaving(true);
    try {
      // Parse file types
      const fileTypes = fileTypesInput
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const submitData = {
        ...data,
        allowed_file_types: fileTypes,
      };

      await api.put("/storage-settings", submitData);
      toast.success("Storage settings updated successfully");
      await fetchSettings();
      await fetchStats();
      await fetchPaths();
      await fetchHealth();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update storage settings");
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Storage Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure file storage and upload policies
          </p>
        </div>
        {isAdminUser(user) && (
          <Button asChild variant="outline" className="shrink-0">
            <Link href="/configuration/storage/files" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Manage Files
            </Link>
          </Button>
        )}
      </div>

      {health && health.status === "warning" && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Storage Health Warning</AlertTitle>
          <AlertDescription>
            {!health.writable
              ? "Storage directory is not writable. Check permissions."
              : `Disk usage is at ${health.disk_used_percent}%. Free space: ${health.disk_free_formatted} of ${health.disk_total_formatted}. Consider freeing space or expanding storage.`}
          </AlertDescription>
        </Alert>
      )}

      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Storage Statistics</CardTitle>
            <CardDescription>Current storage usage</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Total Size</div>
                  <div className="text-2xl font-bold">{stats.total_size_formatted}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">File Count</div>
                  <div className="text-2xl font-bold">{stats.file_count}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Driver</div>
                  <Badge>{stats.driver}</Badge>
                </div>
              </div>
            )}
            {!isLoadingStats && stats.breakdown && Object.keys(stats.breakdown).length > 0 && (
              <>
                <Separator className="my-4" />
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Usage by directory</div>
                  <div className="space-y-2">
                    {Object.entries(stats.breakdown).map(([dir, { size_formatted }]) => (
                      <div key={dir} className="flex items-center justify-between text-sm">
                        <span className="font-mono text-muted-foreground">{dir}</span>
                        <span className="font-medium">{size_formatted}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {paths.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Storage Paths</CardTitle>
            <CardDescription>
              Where files are stored on this server (local driver only)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {paths.map((item) => {
                const Icon = {
                  app: FolderOpen,
                  public: Globe,
                  backups: Archive,
                  cache: Database,
                  sessions: Users,
                  logs: FileText,
                }[item.key] ?? FolderOpen;
                return (
                  <div
                    key={item.key}
                    className="flex gap-3 rounded-lg border p-3"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="font-medium capitalize">{item.key}</div>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                      <code className="block truncate rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                        {item.path}
                      </code>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Storage Configuration</CardTitle>
            <CardDescription>
              Configure storage driver and upload policies
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="driver">Storage Driver</Label>
              <Select
                value={driver}
                onValueChange={(value) => {
                  setValue("driver", value as StorageForm["driver"]);
                  setTestStatus("idle");
                  setTestError(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select driver" />
                </SelectTrigger>
                <SelectContent>
                  {STORAGE_PROVIDERS.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <span className="flex items-center gap-2">
                        <ProviderIcon provider={p.id === "local" ? "key" : p.id === "gcs" ? "gdrive" : p.id === "s3" ? "s3" : p.id} size="sm" />
                        {p.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {driver === "s3" && (
              <>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="s3_bucket">S3 Bucket</Label>
                    <Input id="s3_bucket" {...register("s3_bucket")} placeholder="my-bucket" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="s3_region">Region</Label>
                    <Input id="s3_region" {...register("s3_region")} placeholder="us-east-1" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="s3_key">Access Key ID</Label>
                    <Input id="s3_key" {...register("s3_key")} placeholder="Your AWS access key" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="s3_secret">Secret Access Key</Label>
                    <Input id="s3_secret" type="password" {...register("s3_secret")} placeholder="Your AWS secret key" />
                  </div>
                </div>
              </>
            )}

            {driver === "gcs" && (
              <>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gcs_bucket">GCS Bucket</Label>
                    <Input id="gcs_bucket" {...register("gcs_bucket")} placeholder="my-bucket" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gcs_project_id">Project ID</Label>
                    <Input id="gcs_project_id" {...register("gcs_project_id")} placeholder="my-project" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gcs_credentials_json">Service Account JSON</Label>
                  <Input
                    id="gcs_credentials_json"
                    type="password"
                    {...register("gcs_credentials_json")}
                    placeholder="Paste service account JSON (stored securely)"
                  />
                  <p className="text-sm text-muted-foreground">
                    Paste the contents of your GCS service account key JSON file.
                  </p>
                </div>
              </>
            )}

            {driver === "azure" && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="azure_connection_string">Connection String</Label>
                  <Input
                    id="azure_connection_string"
                    type="password"
                    {...register("azure_connection_string")}
                    placeholder="DefaultEndpointsProtocol=https;AccountName=...;AccountKey=..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="azure_container">Container Name</Label>
                  <Input id="azure_container" {...register("azure_container")} placeholder="my-container" />
                </div>
              </>
            )}

            {driver === "do_spaces" && (
              <>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="do_spaces_bucket">Spaces Bucket</Label>
                    <Input id="do_spaces_bucket" {...register("do_spaces_bucket")} placeholder="my-space" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="do_spaces_region">Region</Label>
                    <Input id="do_spaces_region" {...register("do_spaces_region")} placeholder="nyc3" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="do_spaces_endpoint">Endpoint (optional)</Label>
                  <Input
                    id="do_spaces_endpoint"
                    {...register("do_spaces_endpoint")}
                    placeholder="https://nyc3.digitaloceanspaces.com"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="do_spaces_key">Spaces Access Key</Label>
                    <Input id="do_spaces_key" {...register("do_spaces_key")} placeholder="Access Key" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="do_spaces_secret">Spaces Secret Key</Label>
                    <Input id="do_spaces_secret" type="password" {...register("do_spaces_secret")} placeholder="Secret Key" />
                  </div>
                </div>
              </>
            )}

            {driver === "minio" && (
              <>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minio_bucket">MinIO Bucket</Label>
                    <Input id="minio_bucket" {...register("minio_bucket")} placeholder="my-bucket" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minio_endpoint">Endpoint URL</Label>
                    <Input id="minio_endpoint" {...register("minio_endpoint")} placeholder="http://localhost:9000" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minio_key">Access Key</Label>
                    <Input id="minio_key" {...register("minio_key")} placeholder="Access Key" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minio_secret">Secret Key</Label>
                    <Input id="minio_secret" type="password" {...register("minio_secret")} placeholder="Secret Key" />
                  </div>
                </div>
              </>
            )}

            {driver === "b2" && (
              <>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="b2_bucket">B2 Bucket Name</Label>
                    <Input id="b2_bucket" {...register("b2_bucket")} placeholder="my-bucket" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="b2_region">Region</Label>
                    <Input id="b2_region" {...register("b2_region")} placeholder="us-west-002" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="b2_key_id">Application Key ID</Label>
                    <Input id="b2_key_id" {...register("b2_key_id")} placeholder="Key ID" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="b2_application_key">Application Key</Label>
                    <Input id="b2_application_key" type="password" {...register("b2_application_key")} placeholder="Application Key" />
                  </div>
                </div>
              </>
            )}

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="max_upload_size">Max Upload Size (bytes)</Label>
              <Input
                id="max_upload_size"
                type="number"
                {...register("max_upload_size", { valueAsNumber: true })}
                placeholder="10485760"
              />
              <p className="text-sm text-muted-foreground">
                Maximum file size in bytes (e.g., 10485760 = 10MB)
              </p>
              {errors.max_upload_size && (
                <p className="text-sm text-destructive">
                  {errors.max_upload_size.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="allowed_file_types">Allowed File Types</Label>
              <Input
                id="allowed_file_types"
                value={fileTypesInput}
                onChange={(e) => setFileTypesInput(e.target.value)}
                placeholder="jpg, png, pdf, doc, docx (comma-separated)"
              />
              <p className="text-sm text-muted-foreground">
                Comma-separated list of allowed file extensions
              </p>
            </div>
            {testStatus === "error" && testError && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <XCircle className="h-4 w-4 shrink-0" />
                <span>{testError}</span>
              </div>
            )}
            {testStatus === "success" && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-500">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Connection successful</span>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-wrap items-center justify-end gap-2">
            {driver !== "local" && (
              <Button
                type="button"
                variant="outline"
                onClick={onTestConnection}
                disabled={testStatus === "loading"}
              >
                {testStatus === "loading" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Test Connection
              </Button>
            )}
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
