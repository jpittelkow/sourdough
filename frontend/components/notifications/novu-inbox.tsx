"use client";

import { useAuth } from "@/lib/auth";
import { useAppConfig } from "@/lib/app-config";
import { api } from "@/lib/api";
import { useState, useEffect } from "react";

type InboxProps = {
  applicationIdentifier: string;
  subscriberId: string;
  subscriberHash?: string;
  backendUrl?: string;
  socketUrl?: string;
};

/**
 * Renders @novu/react Inbox when Novu is enabled.
 * Subscriber ID must match backend: user_{id}.
 * Fetches subscriberHash from backend when HMAC is enabled in Novu dashboard.
 */
export function NovuInboxBell() {
  const { user } = useAuth();
  const { novu } = useAppConfig();
  const [Inbox, setInbox] = useState<React.ComponentType<InboxProps> | null>(null);
  const [subscriberHash, setSubscriberHash] = useState<string | null>(null);

  useEffect(() => {
    if (!novu?.enabled || !novu?.app_identifier) return;
    import("@novu/react")
      .then((mod) => {
        if (mod.Inbox) setInbox(() => mod.Inbox as React.ComponentType<InboxProps>);
      })
      .catch(() => {});
  }, [novu?.enabled, novu?.app_identifier]);

  useEffect(() => {
    if (!user?.id || !novu?.enabled) return;
    api
      .get<{ subscriber_hash?: string }>("/novu/subscriber-hash")
      .then((res) => {
        const hash = res.data?.subscriber_hash;
        if (hash) setSubscriberHash(hash);
      })
      .catch(() => {});
  }, [user?.id, novu?.enabled]);

  if (!user || !novu?.enabled || !novu?.app_identifier || !Inbox) {
    return null;
  }

  const subscriberId = `user_${user.id}`;

  return (
    <Inbox
      applicationIdentifier={novu.app_identifier}
      subscriberId={subscriberId}
      {...(subscriberHash ? { subscriberHash } : {})}
      backendUrl={novu.api_url}
      socketUrl={novu.socket_url}
    />
  );
}
