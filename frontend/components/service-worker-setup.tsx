"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  registerServiceWorker,
  activateWaitingServiceWorker,
} from "@/lib/service-worker";

/**
 * Registers the service worker on mount and shows a toast when an update is available.
 * Follows the ErrorHandlerSetup pattern - mounts once in app root, runs silently.
 */
export function ServiceWorkerSetup() {
  const hasShownUpdateRef = useRef(false);

  useEffect(() => {
    let unregister: (() => void) | undefined;
    registerServiceWorker(
      (registration) => {
        // New version available - show toast with refresh option
        if (hasShownUpdateRef.current) return;
        hasShownUpdateRef.current = true;

        toast.info("New version available", {
          action: {
            label: "Refresh",
            onClick: async () => {
              await activateWaitingServiceWorker();
            },
          },
          duration: Infinity,
        });
      },
      () => {
        // New SW has taken control - reload to get fresh assets
        window.location.reload();
      }
    ).then((result) => {
      unregister = result?.unregister;
    });

    return () => {
      unregister?.();
    };
  }, []);

  return null;
}
