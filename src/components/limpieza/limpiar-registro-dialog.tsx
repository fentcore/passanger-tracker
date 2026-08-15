"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

const OPCIONES = [
  { label: "Más de 1 día", dias: 1 },
  { label: "Más de 1 semana", dias: 7 },
  { label: "Más de 1 mes", dias: 30 },
] as const;

function fechaLimite(dias: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d;
}

type Resultado = { count: number } | { pasajeros: number; servicios: number };

export function LimpiarRegistroDialog({
  titulo,
  descripcion,
  accion,
  onLimpio,
}: {
  titulo: string;
  descripcion: string;
  accion: (antes?: Date) => Promise<Resultado>;
  onLimpio?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function ejecutar(antes?: Date) {
    startTransition(async () => {
      try {
        const resultado = await accion(antes);
        const total = "count" in resultado ? resultado.count : resultado.pasajeros + resultado.servicios;
        toast.success(total > 0 ? `Se limpiaron ${total} registro(s)` : "No había nada para limpiar");
        setOpen(false);
        onLimpio?.();
      } catch {
        toast.error("No se pudo limpiar");
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button size="sm" variant="outline" className="rounded-full gap-1.5" />}>
        <Trash2 className="size-4" />
        Limpiar
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{titulo}</AlertDialogTitle>
          <AlertDialogDescription>{descripcion}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-2">
          {OPCIONES.map((o) => (
            <Button
              key={o.dias}
              variant="outline"
              className="h-11 justify-start"
              disabled={pending}
              onClick={() => ejecutar(fechaLimite(o.dias))}
            >
              {o.label}
            </Button>
          ))}
          <Button
            variant="outline"
            className="h-11 justify-start text-destructive hover:text-destructive"
            disabled={pending}
            onClick={() => ejecutar(undefined)}
          >
            Limpiar todo (no se puede deshacer)
          </Button>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
