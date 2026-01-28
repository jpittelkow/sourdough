"use client";

import Echo from "laravel-echo";
import Pusher from "pusher-js";

declare global {
  interface Window {
    Pusher?: typeof Pusher;
  }
}

let echoInstance: Echo<"pusher"> | null = null;

function getAuthEndpoint(): string {
  const base = process.env.NEXT_PUBLIC_API_URL || "";
  return base ? `${base.replace(/\/api\/?$/, "")}/broadcasting/auth` : "/broadcasting/auth";
}

/**
 * Returns a configured Laravel Echo instance for real-time notifications, or null
 * when Pusher is not configured (BROADCAST_CONNECTION=null or missing PUSHER_APP_KEY).
 * Use only in browser (e.g. inside useEffect).
 */
export function getEcho(): Echo<"pusher"> | null {
  if (typeof window === "undefined") return null;

  const key = process.env.NEXT_PUBLIC_PUSHER_APP_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER || "mt1";
  if (!key || key === "") return null;

  if (echoInstance) return echoInstance;

  (window as Window).Pusher = Pusher;

  echoInstance = new Echo({
    broadcaster: "pusher",
    key,
    cluster,
    forceTLS: true,
    authEndpoint: getAuthEndpoint(),
    auth: {
      headers: {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
    },
    authorizer: (channel: { name: string }) => ({
      authorize: (
        socketId: string,
        callback: (error: Error | null, authData: { auth: string; channel_data?: string; shared_secret?: string } | null) => void
      ) => {
        fetch(getAuthEndpoint(), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: JSON.stringify({ socket_id: socketId, channel_name: channel.name }),
          credentials: "include",
        })
          .then((r) => {
            if (!r.ok) throw new Error("Auth failed");
            return r.json();
          })
          .then((data) => callback(null, data as { auth: string }))
          .catch((err) =>
            callback(err instanceof Error ? err : new Error("Auth failed"), null)
          );
      },
    }),
  });

  return echoInstance;
}

/**
 * Disconnect and clear the Echo instance (e.g. on logout).
 */
export function disconnectEcho(): void {
  if (echoInstance) {
    try {
      echoInstance.disconnect();
    } catch {
      // ignore
    }
    echoInstance = null;
  }
}
