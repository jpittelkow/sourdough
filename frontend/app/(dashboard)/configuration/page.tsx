"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ConfigurationPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/configuration/system");
  }, [router]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}
