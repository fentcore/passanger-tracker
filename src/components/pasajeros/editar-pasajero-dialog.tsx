"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PasajeroDraft } from "@/components/pasajeros/types";
import { actualizarPasajero } from "@/lib/actions/pasajeros";
import { toast } from "sonner";
import { ESTADO_PASAJERO_LABEL, ESTADO_PAGO_LABEL, METODO_PAGO_OPTIONS } from "@/lib/constants";

export function EditarPasajeroDialog({
  open,
  onOpenChange,
  pasajeroId,
  inicial,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  pasajeroId: string;
  inicial: PasajeroDraft;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<PasajeroDraft>(inicial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof PasajeroDraft>(key: K, v: PasajeroDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: v }));
  }

  function handleSave() {
    setError(null);
    if (!draft.nombre.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    startTransition(async () => {
      try {
        await actualizarPasajero(pasajeroId, draft);
        toast.success("Datos actualizados");
        onOpenChange(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo guardar");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v) setDraft(inicial);
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar pasajero</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Nombre y apellido *</Label>
            <Input
              className="h-11"
              value={draft.nombre}
              onChange={(e) => set("nombre", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>WhatsApp</Label>
            <Input
              className="h-11"
              value={draft.whatsapp}
              onChange={(e) => set("whatsapp", e.target.value)}
              inputMode="tel"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Email</Label>
            <Input
              type="email"
              className="h-11"
              value={draft.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Información adicional de contacto</Label>
            <Input
              className="h-11"
              value={draft.contactoExtra}
              onChange={(e) => set("contactoExtra", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Empleador</Label>
            <Input
              className="h-11"
              value={draft.empleador}
              onChange={(e) => set("empleador", e.target.value)}
              placeholder="Opcional"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Estado</Label>
            <Select
              items={ESTADO_PASAJERO_LABEL}
              value={draft.estado}
              onValueChange={(v) => set("estado", v as "ACTIVO" | "INACTIVO")}
            >
              <SelectTrigger className="h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVO">Activo</SelectItem>
                <SelectItem value="INACTIVO">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-xl border p-3 flex flex-col gap-3 bg-muted/30">
            <p className="text-sm font-semibold">Pago</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Monto abonado</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  className="h-11"
                  value={draft.montoAbonado}
                  onChange={(e) => set("montoAbonado", e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Estado de pago</Label>
                <Select
                  items={ESTADO_PAGO_LABEL}
                  value={draft.estadoPago}
                  onValueChange={(v) => v && set("estadoPago", v)}
                >
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                    <SelectItem value="PARCIAL">Parcial</SelectItem>
                    <SelectItem value="PAGADO">Pagado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Método de pago</Label>
              <Select
                items={Object.fromEntries(METODO_PAGO_OPTIONS.map((m) => [m, m]))}
                value={draft.metodoPago || undefined}
                onValueChange={(v) => set("metodoPago", v ?? "")}
              >
                <SelectTrigger className="h-11 w-full">
                  <SelectValue placeholder="Seleccionar método" />
                </SelectTrigger>
                <SelectContent>
                  {METODO_PAGO_OPTIONS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Notas de pago</Label>
              <Textarea
                value={draft.notasPago}
                onChange={(e) => set("notasPago", e.target.value)}
                placeholder="Opcional"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Notas generales</Label>
            <Textarea
              value={draft.notasGenerales}
              onChange={(e) => set("notasGenerales", e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button className="h-11 w-full" disabled={pending} onClick={handleSave}>
            {pending ? "Guardando..." : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
