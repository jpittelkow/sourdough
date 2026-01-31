"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SettingsPageSkeleton } from "@/components/ui/settings-page-skeleton";
import { ChevronRight } from "lucide-react";

interface NotificationTemplateSummary {
  id: number;
  type: string;
  channel_group: string;
  title: string;
  is_system: boolean;
  is_active: boolean;
  updated_at: string;
}

const channelGroupLabel: Record<string, string> = {
  push: "Push",
  inapp: "In-App",
  chat: "Chat",
};

export default function NotificationTemplatesListPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [templates, setTemplates] = useState<NotificationTemplateSummary[]>([]);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/notification-templates");
      const data = response.data?.data ?? response.data;
      setTemplates(Array.isArray(data) ? data : []);
    } catch (error: unknown) {
      const message =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : "Failed to load notification templates";
      toast.error(message || "Failed to load notification templates");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return <SettingsPageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Notification Templates</h1>
        <p className="text-muted-foreground mt-2">
          Customize per-type notification messages for push, in-app, and chat
          channels
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Templates</CardTitle>
          <CardDescription>
            Click a template to edit its title and body
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-8"
                  >
                    No notification templates found
                  </TableCell>
                </TableRow>
              ) : (
                templates.map((template) => (
                  <TableRow
                    key={`${template.type}-${template.channel_group}`}
                    className="cursor-pointer"
                    onClick={() =>
                      router.push(
                        `/configuration/notification-templates/${template.id}`
                      )
                    }
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {template.type}
                        {template.is_system && (
                          <Badge variant="secondary" className="text-xs">
                            System
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {channelGroupLabel[template.channel_group] ??
                          template.channel_group}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-md truncate">
                      {template.title || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={template.is_active ? "default" : "secondary"}
                      >
                        {template.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(template.updated_at)}
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
