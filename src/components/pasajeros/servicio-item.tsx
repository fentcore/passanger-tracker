"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Minus,
  Plus,
  Pencil,
  Trash2,
  Archive,
  MessageSquare,
  MapPin,
  ArrowRight,
  ArrowLeft,
  CalendarRange,
  CreditCard,
} from "lucide-react";
import {
  DIA_LABEL,
  ESTADO_SERVICIO_LABEL,
  ESTADO_PAGO_LABEL,
} from "@/lib/constants";
import { cambiarTramos, eliminarServicio, archivarServicio } from "@/lib/actions/servicios";
import { NotaDialog, NotaItem } from "@/components/agenda/nota-dialog";
import { ServicioEditorSheet } from "@/components/pasajeros/servicio-editor-sheet";
import { ServicioDraft } from "@/components/pasajeros/types";
import { DiaSemana } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";

export type ServicioDetalle = {
  id: string;
  pasajeroId: string;
  diaSemana: DiaSemana;
  tipoViaje: "IDA" | "VUELTA" | "IDA_VUELTA";
  horaIda: string | null;
  horaVuelta: string | null;
  cantidadTramos: number;
  estado: string;
  barrioId: string | null;
  barrio: { id: string; nombre: string } | null;
  direccion: string | null;
  destino: string | null;
  fechaInicio: Date | string | null;
  fechaFin: Date | string | null;
  montoAbonado: number;
  estadoPago: string;
  metodoPago: string | null;
  montoPendiente: number | null;
  notasPago: string | null;
  notas: string | null;
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

export function ServicioItem({
  servicio,
  diasDisponibles,
  barrios,
  pasajeroNombre,
}: {
  servicio: ServicioDetalle;
  diasDisponibles: DiaSemana[];
  barrios: { id: string; nombre: string }[];
  pasajeroNombre: string;
}) {
  const router = useRouter();
  const [tramos, setTramos] = useState(servicio.cantidadTramos);
  const [pending, startTransition] = useTransition();
  const [notaOpen, setNotaOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const pendientes = servicio.notasRel.filter((n) => !n.revisada).length;

  function ajustarTramos(delta: 1 | -1) {
    setTramos((prev) => Math.max(0, prev + delta));
    startTransition(async () => {
      try {
        await cambiarTramos(servicio.id, delta);
      } catch {
        setTramos((prev) => Math.max(0, prev - delta));
        toast.error("No se pudo actualizar los tramos");
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await eliminarServicio(servicio.id);
        toast.success("Día eliminado");
        router.refresh();
      } catch {
        toast.error("No se pudo eliminar");
      }
    });
  }

  function handleArchivar() {
    startTransition(async () => {
      try {
        await archivarServicio(servicio.id);
        toast.success("Servicio archivado");
        router.refresh();
      } catch {
        toast.error("No se pudo archivar");
      }
    });
  }

  const draftInicial: ServicioDraft = {
    diaSemana: servicio.diaSemana,
    tipoViaje: servicio.tipoViaje,
    horaIda: servicio.horaIda ?? "",
    horaVuelta: servicio.horaVuelta ?? "",
    barrioId: servicio.barrioId ?? "",
    direccion: servicio.direccion ?? "",
    destino: servicio.destino ?? "",
    cantidadTramos: servicio.cantidadTramos,
    estado: servicio.estado,
    fechaInicio: servicio.fechaInicio
      ? format(new Date(servicio.fechaInicio), "yyyy-MM-dd")
      : "",
    fechaFin: servicio.fechaFin ? format(new Date(servicio.fechaFin), "yyyy-MM-dd") : "",
    montoAbonado: String(servicio.montoAbonado ?? ""),
    estadoPago: servicio.estadoPago,
    metodoPago: servicio.metodoPago ?? "",
    montoPendiente: servicio.montoPendiente != null ? String(servicio.montoPendiente) : "",
    notasPago: servicio.notasPago ?? "",
    notas: servicio.notas ?? "",
  };

  return (
    <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-semibold">
              {DIA_LABEL[servicio.diaSemana]}
            </Badge>
            <Badge className={cn("font-normal", ESTADO_COLOR[servicio.estado])} variant="secondary">
              {ESTADO_SERVICIO_LABEL[servicio.estado]}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="size-8"
              onClick={() => setEditOpen(true)}
              aria-label="Editar servicio"
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="size-8"
              disabled={pending}
              onClick={handleArchivar}
              aria-label="Archivar servicio"
              title="Archivar"
            >
              <Archive className="size-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button size="icon" variant="ghost" className="size-8 text-destructive" aria-label="Eliminar día" />
                }
              >
                <Trash2 className="size-4" />
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar este día de viaje?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Se va a eliminar el servicio del {DIA_LABEL[servicio.diaSemana].toLowerCase()} para{" "}
                    {pasajeroNombre}. Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white">
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">{servicio.barrio?.nombre ?? "Sin barrio"}</span>
          {servicio.direccion && <span className="truncate">· {servicio.direccion}</span>}
        </div>

        <div className="mt-3 flex gap-4 flex-wrap">
          {servicio.tipoViaje !== "VUELTA" && (
            <div className="flex items-center gap-1.5">
              <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ArrowRight className="size-3.5" />
              </span>
              <div className="leading-none">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Ida</p>
                <p className="font-semibold tabular-nums">{servicio.horaIda ?? "—"}</p>
              </div>
            </div>
          )}
          {servicio.tipoViaje !== "IDA" && (
            <div className="flex items-center gap-1.5">
              <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ArrowLeft className="size-3.5" />
              </span>
              <div className="leading-none">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Vuelta</p>
                <p className="font-semibold tabular-nums">{servicio.horaVuelta ?? "—"}</p>
              </div>
            </div>
          )}
        </div>

        {(servicio.fechaInicio || servicio.fechaFin) && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarRange className="size-3.5" />
            {servicio.fechaInicio ? format(new Date(servicio.fechaInicio), "dd/MM/yyyy") : "—"}
            {" → "}
            {servicio.fechaFin ? format(new Date(servicio.fechaFin), "dd/MM/yyyy") : "Sin fecha de fin"}
          </div>
        )}

        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <CreditCard className="size-3.5" />
          <span>
            ${servicio.montoAbonado.toLocaleString("es-AR")} · {ESTADO_PAGO_LABEL[servicio.estadoPago]}
            {servicio.metodoPago ? ` · ${servicio.metodoPago}` : ""}
          </span>
        </div>

        {servicio.notas && (
          <p className="mt-2 text-sm rounded-lg bg-muted/50 p-2 text-muted-foreground">
            {servicio.notas}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t bg-muted/30 px-4 py-2.5">
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-muted-foreground mr-1.5">Tramos</span>
          <Button
            size="icon"
            variant="outline"
            className="size-9 rounded-full"
            disabled={pending || tramos <= 0}
            onClick={() => ajustarTramos(-1)}
          >
            <Minus className="size-4" />
          </Button>
          <span className="w-8 text-center font-bold tabular-nums text-lg">{tramos}</span>
          <Button
            size="icon"
            variant="outline"
            className="size-9 rounded-full"
            disabled={pending}
            onClick={() => ajustarTramos(1)}
          >
            <Plus className="size-4" />
          </Button>
        </div>

        <Button
          size="sm"
          variant={pendientes > 0 ? "default" : "outline"}
          className="h-9 rounded-full gap-1.5"
          onClick={() => setNotaOpen(true)}
        >
          <MessageSquare className="size-4" />
          {pendientes > 0 ? pendientes : "Notas"}
        </Button>
      </div>

      <NotaDialog
        open={notaOpen}
        onOpenChange={setNotaOpen}
        pasajeroNombre={pasajeroNombre}
        diaLabel={DIA_LABEL[servicio.diaSemana]}
        servicioId={servicio.id}
        pasajeroId={servicio.pasajeroId}
        notas={servicio.notasRel}
      />

      <ServicioEditorSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        pasajeroId={servicio.pasajeroId}
        servicioId={servicio.id}
        diasDisponibles={diasDisponibles}
        inicial={draftInicial}
        barrios={barrios}
      />
    </div>
  );
}
