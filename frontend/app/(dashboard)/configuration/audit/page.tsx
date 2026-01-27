"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Loader2, Search, Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AuditLog {
  id: number;
  user_id: number | null;
  action: string;
  auditable_type: string | null;
  auditable_id: number | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

interface PaginatedResponse {
  data: AuditLog[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    user_id: "",
    action: "",
    date_from: "",
    date_to: "",
  });
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [currentPage, filters]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: "50",
      });

      if (filters.user_id) {
        params.append("user_id", filters.user_id);
      }
      if (filters.action) {
        params.append("action", filters.action);
      }
      if (filters.date_from) {
        params.append("date_from", filters.date_from);
      }
      if (filters.date_to) {
        params.append("date_to", filters.date_to);
      }

      const response = await api.get<PaginatedResponse>(`/audit-logs?${params}`);
      setLogs(response.data.data || []);
      setCurrentPage(response.data.current_page || 1);
      setTotalPages(response.data.last_page || 1);
      setTotal(response.data.total || 0);
    } catch (error: any) {
      toast.error(error.message || "Failed to load audit logs");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (filters.user_id) params.append("user_id", filters.user_id);
      if (filters.action) params.append("action", filters.action);
      if (filters.date_from) params.append("date_from", filters.date_from);
      if (filters.date_to) params.append("date_to", filters.date_to);

      const response = await api.get(`/audit-logs/export?${params}`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `audit_logs_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Audit logs exported successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to export audit logs");
    } finally {
      setIsExporting(false);
    }
  };

  const formatAction = (action: string) => {
    return action.replace(/\./g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Audit Log</h1>
          <p className="text-muted-foreground mt-2">
            Track user actions and system changes
          </p>
        </div>
        <Button onClick={handleExport} disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter audit logs by user, action, or date range</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="action">Action</Label>
              <Input
                id="action"
                placeholder="e.g., user.login"
                value={filters.action}
                onChange={(e) =>
                  setFilters({ ...filters, action: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_from">From Date</Label>
              <Input
                id="date_from"
                type="date"
                value={filters.date_from}
                onChange={(e) =>
                  setFilters({ ...filters, date_from: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_to">To Date</Label>
              <Input
                id="date_to"
                type="date"
                value={filters.date_to}
                onChange={(e) =>
                  setFilters({ ...filters, date_to: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Clear Filters</Label>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setFilters({
                    user_id: "",
                    action: "",
                    date_from: "",
                    date_to: "",
                  });
                  setCurrentPage(1);
                }}
              >
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audit Logs</CardTitle>
          <CardDescription>
            {total} total log{total !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No audit logs found
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          {new Date(log.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {log.user ? (
                            <div>
                              <div className="font-medium">{log.user.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {log.user.email}
                              </div>
                            </div>
                          ) : (
                            <Badge variant="secondary">System</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge>{formatAction(log.action)}</Badge>
                        </TableCell>
                        <TableCell>
                          {log.ip_address || "-"}
                        </TableCell>
                        <TableCell>
                          {log.old_values || log.new_values ? (
                            <details className="text-sm">
                              <summary className="cursor-pointer text-muted-foreground">
                                View changes
                              </summary>
                              <div className="mt-2 space-y-1">
                                {log.old_values && (
                                  <div>
                                    <span className="font-medium">Old:</span>{" "}
                                    <pre className="inline text-xs">
                                      {JSON.stringify(log.old_values, null, 2)}
                                    </pre>
                                  </div>
                                )}
                                {log.new_values && (
                                  <div>
                                    <span className="font-medium">New:</span>{" "}
                                    <pre className="inline text-xs">
                                      {JSON.stringify(log.new_values, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </details>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
