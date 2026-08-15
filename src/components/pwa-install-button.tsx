"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

// Solo aparece cuando el navegador determina que la app es instalable
// (dispara beforeinstallprompt) y todavía no corre como PWA instalada.
// En la práctica esto es Chrome/Android; Safari/iOS no dispara este evento.
export function PwaInstallButton() {
  const [deferido, setDeferido] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const yaInstalada = window.matchMedia("(display-mode: standalone)").matches;
    if (yaInstalada) return;

    function onBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferido(e as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  if (!deferido) return null;

  async function instalar() {
    if (!deferido) return;
    await deferido.prompt();
    await deferido.userChoice;
    setDeferido(null);
  }

  return (
    <button
      type="button"
      onClick={instalar}
      className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent"
    >
      <Download className="size-5" />
      Descargar la app
    </button>
  );
}
