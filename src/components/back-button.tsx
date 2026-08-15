"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function BackButton({ fallbackHref = "/" }: { fallbackHref?: string }) {
  const router = useRouter();

  function volver() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  }

  return (
    <Button
      size="icon"
      variant="ghost"
      className="size-9 shrink-0 rounded-full"
      onClick={volver}
      aria-label="Volver"
    >
      <ArrowLeft className="size-5" />
    </Button>
  );
}
