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
import { ESTADO_PASAJERO_LABEL } from "@/lib/constants";

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
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
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
