"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2,
  Database,
  Download,
  Upload,
  Trash2,
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock,
  HardDrive,
  FileArchive,
} from "lucide-react";

interface Backup {
  filename: string;
  size: number;
  created_at: string;
  type: "full" | "database" | "files";
}

export default function BackupPage() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<string | null>(null);
  const [restoreConfirmation, setRestoreConfirmation] = useState("");

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    try {
      const response = await api.get("/backup");
      setBackups(response.data.backups || []);
    } catch (error) {
      console.error("Failed to fetch backups:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setIsCreating(true);

    try {
      await api.post("/backup/create");
      toast.success("Backup created successfully");
      fetchBackups();
    } catch (error: any) {
      toast.error(error.message || "Failed to create backup");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDownloadBackup = async (filename: string) => {
    try {
      const response = await api.get(`/backup/download/${filename}`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error(error.message || "Failed to download backup");
    }
  };

  const handleRestoreBackup = async () => {
    if (!restoreTarget || restoreConfirmation !== "RESTORE") {
      toast.error('Please type "RESTORE" to confirm');
      return;
    }

    setIsRestoring(true);

    try {
      await api.post("/backup/restore", { filename: restoreTarget });
      toast.success("Backup restored successfully. The application will restart.");
      setRestoreTarget(null);
      setRestoreConfirmation("");
    } catch (error: any) {
      toast.error(error.message || "Failed to restore backup");
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDeleteBackup = async (filename: string) => {
    try {
      await api.delete(`/backup/${filename}`);
      toast.success("Backup deleted");
      setBackups((prev) => prev.filter((b) => b.filename !== filename));
      setDeleteTarget(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete backup");
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Backup & Restore</h1>
        <p className="text-muted-foreground">
          Manage system backups and restore points.
        </p>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Create a new backup or restore from an existing one.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button onClick={handleCreateBackup} disabled={isCreating}>
              {isCreating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Create Backup
            </Button>
            <Button variant="outline" asChild>
              <label className="cursor-pointer">
                <Upload className="mr-2 h-4 w-4" />
                Upload Backup
                <input
                  type="file"
                  accept=".zip"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    const formData = new FormData();
                    formData.append("backup", file);

                    try {
                      await api.post("/backup/upload", formData, {
                        headers: { "Content-Type": "multipart/form-data" },
                      });
                      toast.success("Backup uploaded successfully");
                      fetchBackups();
                    } catch (error: any) {
                      toast.error(error.message || "Failed to upload backup");
                    }
                  }}
                />
              </label>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Backups List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileArchive className="h-5 w-5" />
            Available Backups
          </CardTitle>
          <CardDescription>
            {backups.length} backup{backups.length !== 1 ? "s" : ""} available
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-9 w-24" />
                </div>
              ))}
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-8">
              <Database className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">No backups yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Create your first backup to protect your data.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {backups.map((backup) => (
                <div
                  key={backup.filename}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-full bg-muted">
                      <FileArchive className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{backup.filename}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <HardDrive className="h-3 w-3" />
                          {formatBytes(backup.size)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(backup.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadBackup(backup.filename)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRestoreTarget(backup.filename)}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Restore
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            Restore Backup
                          </DialogTitle>
                          <DialogDescription>
                            This will replace all current data with the backup data.
                            This action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <Alert variant="destructive" className="my-4">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>Warning</AlertTitle>
                          <AlertDescription>
                            Restoring a backup will overwrite all current data
                            including users, settings, and files. The application
                            will restart after restoration.
                          </AlertDescription>
                        </Alert>
                        <div className="space-y-4">
                          <p className="text-sm text-muted-foreground">
                            Type <strong>RESTORE</strong> to confirm:
                          </p>
                          <Input
                            value={restoreConfirmation}
                            onChange={(e) =>
                              setRestoreConfirmation(e.target.value)
                            }
                            placeholder="Type RESTORE"
                          />
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setRestoreTarget(null);
                              setRestoreConfirmation("");
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={handleRestoreBackup}
                            disabled={
                              isRestoring || restoreConfirmation !== "RESTORE"
                            }
                          >
                            {isRestoring && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Restore Backup
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(backup.filename)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete Backup</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to delete this backup? This
                            action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                          <p className="text-sm">
                            <strong>{backup.filename}</strong>
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatBytes(backup.size)} • {formatDate(backup.created_at)}
                          </p>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setDeleteTarget(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleDeleteBackup(backup.filename)}
                          >
                            Delete
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info */}
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertTitle>Backup Information</AlertTitle>
        <AlertDescription>
          Backups include the database, uploaded files, and application settings.
          We recommend creating regular backups and storing them in a secure
          location. Consider setting up automatic backups via scheduled tasks.
        </AlertDescription>
      </Alert>
    </div>
  );
}
