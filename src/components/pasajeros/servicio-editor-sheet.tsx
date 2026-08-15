"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ServicioFields } from "@/components/pasajeros/servicio-fields";
import { ServicioDraft } from "@/components/pasajeros/types";
import { DIA_LABEL, DiaSemana } from "@/lib/constants";
import { crearServicio, actualizarServicio } from "@/lib/actions/servicios";
import { toast } from "sonner";

type Barrio = { id: string; nombre: string };

export function ServicioEditorSheet({
  open,
  onOpenChange,
  pasajeroId,
  servicioId,
  diasDisponibles,
  inicial,
  barrios,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  pasajeroId: string;
  servicioId?: string;
  diasDisponibles: DiaSemana[];
  inicial: ServicioDraft;
  barrios: Barrio[];
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<ServicioDraft>(inicial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const esEdicion = !!servicioId;

  function handleSave() {
    setError(null);
    if (!draft.horaIda && !draft.horaVuelta) {
      setError("Ingresá al menos un horario (ida o vuelta)");
      return;
    }

    const payload = {
      diaSemana: draft.diaSemana,
      tipoViaje: draft.tipoViaje,
      horaIda: draft.horaIda,
      horaVuelta: draft.horaVuelta,
      barrioId: draft.barrioId,
      direccion: draft.direccion,
      destino: draft.destino,
      estado: draft.estado,
      fechaInicio: draft.fechaInicio,
      fechaFin: draft.fechaFin,
      montoAbonado: draft.montoAbonado === "" ? undefined : Number(draft.montoAbonado),
      estadoPago: draft.estadoPago,
      metodoPago: draft.metodoPago,
      montoPendiente: draft.montoPendiente === "" ? undefined : Number(draft.montoPendiente),
      notasPago: draft.notasPago,
      notas: draft.notas,
    };

    startTransition(async () => {
      try {
        if (esEdicion) {
          await actualizarServicio(servicioId!, payload);
          toast.success("Servicio actualizado");
        } else {
          await crearServicio(pasajeroId, payload);
          toast.success("Día agregado");
        }
        onOpenChange(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo guardar");
      }
    });
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (v) setDraft(inicial);
        onOpenChange(v);
      }}
    >
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{esEdicion ? "Editar servicio" : "Agregar día de viaje"}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4">
          <div className="flex flex-col gap-1.5">
            <Label>Día</Label>
            <Select
              items={
                esEdicion
                  ? { [inicial.diaSemana]: DIA_LABEL[inicial.diaSemana], ...Object.fromEntries(diasDisponibles.map((d) => [d, DIA_LABEL[d]])) }
                  : Object.fromEntries(diasDisponibles.map((d) => [d, DIA_LABEL[d]]))
              }
              value={draft.diaSemana}
              onValueChange={(v) => setDraft({ ...draft, diaSemana: v as DiaSemana })}
            >
              <SelectTrigger className="h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {esEdicion && (
                  <SelectItem value={inicial.diaSemana}>
                    {DIA_LABEL[inicial.diaSemana]}
                  </SelectItem>
                )}
                {diasDisponibles.map((d) => (
                  <SelectItem key={d} value={d}>
                    {DIA_LABEL[d]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ServicioFields value={draft} onChange={setDraft} barrios={barrios} />

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <SheetFooter>
          <Button className="h-11" disabled={pending} onClick={handleSave}>
            {pending ? "Guardando..." : "Guardar"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
