"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  RefreshCw,
  Trash2,
  Play,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface ScheduledTask {
  command: string;
  schedule: string;
  description: string;
}

interface FailedJob {
  id: number;
  uuid: string;
  connection: string;
  queue: string;
  payload: string;
  exception: string;
  failed_at: string;
}

interface QueueStatus {
  pending: number;
  failed: number;
  queues?: Record<string, number>;
}

export default function JobsPage() {
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([]);
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [failedJobs, setFailedJobs] = useState<FailedJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingScheduled, setIsLoadingScheduled] = useState(false);
  const [isLoadingQueue, setIsLoadingQueue] = useState(false);
  const [isLoadingFailed, setIsLoadingFailed] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setIsLoading(true);
    await Promise.all([
      fetchScheduled(),
      fetchQueueStatus(),
      fetchFailedJobs(),
    ]);
    setIsLoading(false);
  };

  const fetchScheduled = async () => {
    setIsLoadingScheduled(true);
    try {
      const response = await api.get("/jobs/scheduled");
      setScheduledTasks(response.data.tasks || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to load scheduled tasks");
    } finally {
      setIsLoadingScheduled(false);
    }
  };

  const fetchQueueStatus = async () => {
    setIsLoadingQueue(true);
    try {
      const response = await api.get("/jobs/queue");
      setQueueStatus(response.data);
    } catch (error: any) {
      toast.error(error.message || "Failed to load queue status");
    } finally {
      setIsLoadingQueue(false);
    }
  };

  const fetchFailedJobs = async () => {
    setIsLoadingFailed(true);
    try {
      const response = await api.get("/jobs/failed");
      setFailedJobs(response.data.data || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to load failed jobs");
    } finally {
      setIsLoadingFailed(false);
    }
  };

  const handleRetryJob = async (id: number) => {
    try {
      await api.post(`/jobs/failed/${id}/retry`);
      toast.success("Job queued for retry");
      fetchFailedJobs();
    } catch (error: any) {
      toast.error(error.message || "Failed to retry job");
    }
  };

  const handleDeleteJob = async (id: number) => {
    if (!confirm("Are you sure you want to delete this failed job?")) {
      return;
    }

    try {
      await api.delete(`/jobs/failed/${id}`);
      toast.success("Failed job deleted");
      fetchFailedJobs();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete job");
    }
  };

  const handleRetryAll = async () => {
    if (!confirm("Retry all failed jobs?")) {
      return;
    }

    try {
      await api.post("/jobs/failed/retry-all");
      toast.success("All failed jobs queued for retry");
      fetchFailedJobs();
    } catch (error: any) {
      toast.error(error.message || "Failed to retry jobs");
    }
  };

  const handleClearFailed = async () => {
    if (!confirm("Clear all failed jobs? This cannot be undone.")) {
      return;
    }

    try {
      await api.delete("/jobs/failed/clear");
      toast.success("All failed jobs cleared");
      fetchFailedJobs();
    } catch (error: any) {
      toast.error(error.message || "Failed to clear jobs");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Scheduled Jobs</h1>
          <p className="text-muted-foreground mt-2">
            Monitor and manage background jobs and scheduled tasks
          </p>
        </div>
        <Button onClick={fetchAll} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="scheduled" className="space-y-6">
        <TabsList>
          <TabsTrigger value="scheduled">Scheduled Tasks</TabsTrigger>
          <TabsTrigger value="queue">Queue Status</TabsTrigger>
          <TabsTrigger value="failed">Failed Jobs</TabsTrigger>
        </TabsList>

        <TabsContent value="scheduled">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Tasks</CardTitle>
              <CardDescription>
                Tasks configured to run on a schedule
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingScheduled ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : scheduledTasks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No scheduled tasks found
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Command</TableHead>
                        <TableHead>Schedule</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scheduledTasks.map((task, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono text-sm">
                            {task.command}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{task.schedule}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {task.description || "-"}
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

        <TabsContent value="queue">
          <Card>
            <CardHeader>
              <CardTitle>Queue Status</CardTitle>
              <CardDescription>
                Current queue statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingQueue ? (
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : queueStatus ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Pending Jobs</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{queueStatus.pending}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Failed Jobs</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-destructive">
                        {queueStatus.failed}
                      </div>
                    </CardContent>
                  </Card>
                  {queueStatus.queues && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>Queue Breakdown</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {Object.entries(queueStatus.queues).map(([queue, count]) => (
                            <div key={queue} className="flex justify-between">
                              <span className="text-sm">{queue}</span>
                              <Badge>{count}</Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Unable to load queue status
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="failed">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Failed Jobs</CardTitle>
                  <CardDescription>
                    Jobs that failed to execute
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetryAll}
                    disabled={failedJobs.length === 0}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Retry All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearFailed}
                    disabled={failedJobs.length === 0}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingFailed ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : failedJobs.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-muted-foreground">No failed jobs</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {failedJobs.map((job) => (
                    <Card key={job.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="destructive">Failed</Badge>
                              <span className="text-sm text-muted-foreground">
                                {new Date(job.failed_at).toLocaleString()}
                              </span>
                            </div>
                            <div className="font-mono text-sm">
                              Queue: {job.queue}
                            </div>
                            <details className="text-sm">
                              <summary className="cursor-pointer text-muted-foreground">
                                View exception
                              </summary>
                              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                                {job.exception}
                              </pre>
                            </details>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRetryJob(job.id)}
                            >
                              <Play className="mr-2 h-4 w-4" />
                              Retry
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteJob(job.id)}
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
      </Tabs>
    </div>
  );
}
