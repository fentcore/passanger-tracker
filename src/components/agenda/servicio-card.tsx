"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Minus, Plus, MessageSquare, MapPin, ArrowRight, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cambiarTramos } from "@/lib/actions/pasajeros";
import { DIA_LABEL, ESTADO_SERVICIO_LABEL } from "@/lib/constants";
import { NotaDialog, NotaItem } from "@/components/agenda/nota-dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { nivelAlertaTramos, NIVEL_ALERTA_COLOR, ConfigAlertas } from "@/lib/alertas";

export type ServicioCardData = {
  id: string;
  diaSemana: keyof typeof DIA_LABEL;
  tipoViaje: "IDA" | "VUELTA" | "IDA_VUELTA";
  horaIda: string | null;
  horaVuelta: string | null;
  estado: string;
  pasajero: { id: string; nombre: string; tramos: number };
  barrio: { id: string; nombre: string } | null;
  notasRel: NotaItem[];
};

const ESTADO_COLOR: Record<string, string> = {
  ACTIVO: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  INACTIVO: "bg-muted text-muted-foreground",
  CONFIRMADO: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  PENDIENTE: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  CANCELADO: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  REALIZADO: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
};

export function ServicioCard({
  servicio,
  configAlertas,
}: {
  servicio: ServicioCardData;
  configAlertas?: ConfigAlertas;
}) {
  const [tramos, setTramos] = useState(servicio.pasajero.tramos);
  const [pending, startTransition] = useTransition();
  const [notaOpen, setNotaOpen] = useState(false);

  const pendientes = servicio.notasRel.filter((n) => !n.revisada).length;
  const nivel = configAlertas ? nivelAlertaTramos(tramos, configAlertas) : "normal";

  function ajustarTramos(delta: 1 | -1) {
    setTramos((prev) => Math.max(0, prev + delta));
    startTransition(async () => {
      try {
        await cambiarTramos(servicio.pasajero.id, delta);
      } catch {
        setTramos((prev) => Math.max(0, prev - delta));
        toast.error("No se pudo actualizar los tramos");
      }
    });
  }

  const tieneIda = servicio.tipoViaje !== "VUELTA" && servicio.horaIda;
  const tieneVuelta = servicio.tipoViaje !== "IDA" && servicio.horaVuelta;

  return (
    <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
      <Link
        href={`/pasajeros/${servicio.pasajero.id}`}
        className="block p-4 pb-3 active:bg-accent/50 transition-colors"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-base leading-tight truncate">
              {servicio.pasajero.nombre}
            </p>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
              <MapPin className="size-3.5 shrink-0" />
              <span className="truncate">
                {servicio.barrio?.nombre ?? "Sin barrio"}
              </span>
            </div>
          </div>
          <Badge
            className={cn("shrink-0 font-normal", ESTADO_COLOR[servicio.estado])}
            variant="secondary"
          >
            {ESTADO_SERVICIO_LABEL[servicio.estado]}
          </Badge>
        </div>

        <div className="mt-3 flex gap-4">
          {tieneIda ? (
            <div className="flex items-center gap-1.5">
              <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ArrowRight className="size-3.5" />
              </span>
              <div className="leading-none">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Ida
                </p>
                <p className="font-semibold tabular-nums">{servicio.horaIda}</p>
              </div>
            </div>
          ) : servicio.tipoViaje !== "VUELTA" ? (
            <p className="text-sm text-muted-foreground self-center">Sin ida</p>
          ) : null}

          {tieneVuelta ? (
            <div className="flex items-center gap-1.5">
              <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ArrowLeft className="size-3.5" />
              </span>
              <div className="leading-none">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Vuelta
                </p>
                <p className="font-semibold tabular-nums">{servicio.horaVuelta}</p>
              </div>
            </div>
          ) : servicio.tipoViaje !== "IDA" ? (
            <p className="text-sm text-muted-foreground self-center">Sin vuelta</p>
          ) : null}
        </div>
      </Link>

      <div className="flex items-center justify-between gap-3 border-t bg-muted/30 px-4 py-2.5">
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-muted-foreground mr-1.5">
            Tramos
          </span>
          <Button
            size="icon"
            variant="outline"
            className="size-9 rounded-full"
            disabled={pending || tramos <= 0}
            onClick={() => ajustarTramos(-1)}
            aria-label="Restar tramo"
          >
            <Minus className="size-4" />
          </Button>
          <span
            className={cn(
              "w-8 text-center font-bold tabular-nums text-lg rounded-md",
              nivel !== "normal" && NIVEL_ALERTA_COLOR[nivel]
            )}
          >
            {tramos}
          </span>
          <Button
            size="icon"
            variant="outline"
            className="size-9 rounded-full"
            disabled={pending}
            onClick={() => ajustarTramos(1)}
            aria-label="Sumar tramo"
          >
            <Plus className="size-4" />
          </Button>
        </div>

        <Button
          size="sm"
          variant={pendientes > 0 ? "default" : "outline"}
          className="relative h-9 rounded-full gap-1.5"
          onClick={() => setNotaOpen(true)}
        >
          <MessageSquare className="size-4" />
          {pendientes > 0 ? pendientes : "Notas"}
        </Button>
      </div>

      <NotaDialog
        open={notaOpen}
        onOpenChange={setNotaOpen}
        pasajeroNombre={servicio.pasajero.nombre}
        diaLabel={DIA_LABEL[servicio.diaSemana]}
        servicioId={servicio.id}
        pasajeroId={servicio.pasajero.id}
        notas={servicio.notasRel}
      />
    </div>
  );
}
