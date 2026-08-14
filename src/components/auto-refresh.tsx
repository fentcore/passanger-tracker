"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function AutoRefresh({ intervalMs = 12000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const tick = () => router.refresh();

    const interval = setInterval(tick, intervalMs);

    const onVisibility = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", tick);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", tick);
    };
  }, [router, intervalMs]);

  return null;
}
