"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { crearNota, marcarNotaRevisada } from "@/lib/actions/notas";
import { toast } from "sonner";
import { CheckCircle2, MessageSquarePlus } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export type NotaItem = {
  id: string;
  contenido: string;
  creadaEn: Date | string;
  revisada: boolean;
  revisadaEn: Date | string | null;
  creador: { nombre: string };
  revisor: { nombre: string } | null;
};

export function NotaDialog({
  open,
  onOpenChange,
  pasajeroNombre,
  diaLabel,
  servicioId,
  pasajeroId,
  notas,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  pasajeroNombre: string;
  diaLabel: string;
  servicioId: string;
  pasajeroId: string;
  notas: NotaItem[];
}) {
  const [nuevaNota, setNuevaNota] = useState("");
  const [pending, startTransition] = useTransition();

  function handleRevisar(id: string) {
    startTransition(async () => {
      try {
        await marcarNotaRevisada(id);
        toast.success("Nota marcada como revisada");
      } catch {
        toast.error("No se pudo actualizar la nota");
      }
    });
  }

  function handleCrear() {
    if (!nuevaNota.trim()) return;
    startTransition(async () => {
      try {
        await crearNota({ pasajeroId, servicioId, contenido: nuevaNota });
        setNuevaNota("");
        toast.success("Nota agregada");
      } catch {
        toast.error("No se pudo crear la nota");
      }
    });
  }

  const ordenadas = [...notas].sort(
    (a, b) => new Date(b.creadaEn).getTime() - new Date(a.creadaEn).getTime()
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{pasajeroNombre}</DialogTitle>
          <DialogDescription>Notas · {diaLabel}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 max-h-[45vh] overflow-y-auto pr-1">
          {ordenadas.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay notas todavía.
            </p>
          )}
          {ordenadas.map((n) => (
            <div
              key={n.id}
              className="rounded-xl border p-3 flex flex-col gap-1.5 bg-card"
            >
              <p className="text-sm leading-snug whitespace-pre-wrap">
                {n.contenido}
              </p>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">
                  {n.creador.nombre} ·{" "}
                  {format(new Date(n.creadaEn), "d MMM HH:mm", { locale: es })}
                </span>
                {n.revisada ? (
                  <Badge
                    variant="secondary"
                    className="gap-1 text-emerald-700 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300"
                  >
                    <CheckCircle2 className="size-3" />
                    Revisada
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    disabled={pending}
                    onClick={() => handleRevisar(n.id)}
                  >
                    Marcar como revisada
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Textarea
            placeholder="Escribir una nota..."
            value={nuevaNota}
            onChange={(e) => setNuevaNota(e.target.value)}
            className="min-h-[70px]"
          />
          <Button
            className="w-full h-11"
            disabled={pending || !nuevaNota.trim()}
            onClick={handleCrear}
          >
            <MessageSquarePlus className="size-4" />
            Agregar nota
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
