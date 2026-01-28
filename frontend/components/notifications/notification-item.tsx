"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Notification } from "@/lib/notifications";

function formatRelative(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export interface NotificationItemProps {
  notification: Notification;
  onMarkRead?: (id: string) => void;
  onClick?: (notification: Notification) => void;
  compact?: boolean;
  showMarkRead?: boolean;
}

export function NotificationItem({
  notification,
  onMarkRead,
  onClick,
  compact = false,
  showMarkRead = true,
}: NotificationItemProps) {
  const isUnread = !notification.read_at;

  const handleClick = () => {
    onClick?.(notification);
  };

  const handleMarkRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isUnread) onMarkRead?.(notification.id);
  };

  const content = (
    <div className="flex gap-3 w-full text-left">
      <div
        className={cn(
          "flex-1 min-w-0",
          compact ? "space-y-0.5" : "space-y-1"
        )}
      >
        <p
          className={cn(
            "font-medium leading-tight truncate",
            isUnread ? "text-foreground" : "text-muted-foreground",
            compact ? "text-sm" : "text-base"
          )}
        >
          {notification.title}
        </p>
        <p
          className={cn(
            "text-muted-foreground truncate",
            compact ? "text-xs" : "text-sm"
          )}
        >
          {notification.message}
        </p>
        <p className={cn("text-muted-foreground", compact ? "text-xs" : "text-sm")}>
          {formatRelative(new Date(notification.created_at))}
        </p>
      </div>
      {showMarkRead && isUnread && onMarkRead && (
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 h-8 w-8"
          onClick={handleMarkRead}
          title="Mark as read"
          aria-label="Mark as read"
        >
          <Check className="h-4 w-4" />
        </Button>
      )}
    </div>
  );

  const baseClass = cn(
    "rounded-lg transition-colors border",
    compact ? "px-3 py-2" : "px-4 py-3",
    isUnread && "bg-muted/50 border-muted",
    onClick && "cursor-pointer hover:bg-muted/50"
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={cn(baseClass, "w-full")}
        onClick={handleClick}
      >
        {content}
      </button>
    );
  }

  return <div className={baseClass}>{content}</div>;
}
