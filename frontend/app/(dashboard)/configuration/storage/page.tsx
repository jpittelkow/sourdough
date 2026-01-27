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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, HardDrive, Database } from "lucide-react";

const storageSchema = z.object({
  driver: z.enum(["local", "s3"]),
  max_upload_size: z.number().min(1),
  allowed_file_types: z.array(z.string()),
  s3_bucket: z.string().optional(),
  s3_region: z.string().optional(),
  s3_key: z.string().optional(),
  s3_secret: z.string().optional(),
});

type StorageForm = z.infer<typeof storageSchema>;

interface StorageStats {
  driver: string;
  total_size: number;
  total_size_formatted: string;
  file_count: number;
}

export default function StorageSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [fileTypesInput, setFileTypesInput] = useState("");

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
      <div>
        <h1 className="text-3xl font-bold">Storage Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure file storage and upload policies
        </p>
      </div>

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
                onValueChange={(value) => setValue("driver", value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select driver" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">Local Filesystem</SelectItem>
                  <SelectItem value="s3">Amazon S3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {driver === "s3" && (
              <>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="s3_bucket">S3 Bucket</Label>
                    <Input
                      id="s3_bucket"
                      {...register("s3_bucket")}
                      placeholder="my-bucket"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="s3_region">Region</Label>
                    <Input
                      id="s3_region"
                      {...register("s3_region")}
                      placeholder="us-east-1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="s3_key">Access Key ID</Label>
                    <Input
                      id="s3_key"
                      {...register("s3_key")}
                      placeholder="Your AWS access key"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="s3_secret">Secret Access Key</Label>
                    <Input
                      id="s3_secret"
                      type="password"
                      {...register("s3_secret")}
                      placeholder="Your AWS secret key"
                    />
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
          </CardContent>
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
