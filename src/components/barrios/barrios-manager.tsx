"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil, Power, MapPinned } from "lucide-react";
import {
  crearBarrio,
  actualizarBarrio,
  cambiarEstadoBarrio,
} from "@/lib/actions/barrios";
import { toast } from "sonner";

type Barrio = { id: string; nombre: string; activo: boolean };

export function BarriosManager({ barrios }: { barrios: Barrio[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [nombreNuevo, setNombreNuevo] = useState("");
  const [editando, setEditando] = useState<Barrio | null>(null);
  const [nombreEdit, setNombreEdit] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleCrear() {
    setError(null);
    if (!nombreNuevo.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    startTransition(async () => {
      try {
        const resultado = await crearBarrio({ nombre: nombreNuevo });
        if (resultado && "error" in resultado) {
          setError(resultado.error);
          return;
        }
        toast.success("Barrio creado");
        setNombreNuevo("");
        setCreateOpen(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo crear");
      }
    });
  }

  function handleEditar() {
    if (!editando) return;
    setError(null);
    if (!nombreEdit.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    startTransition(async () => {
      try {
        const resultado = await actualizarBarrio(editando.id, { nombre: nombreEdit });
        if (resultado && "error" in resultado) {
          setError(resultado.error);
          return;
        }
        toast.success("Barrio actualizado");
        setEditando(null);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo actualizar");
      }
    });
  }

  function toggleActivo(barrio: Barrio) {
    startTransition(async () => {
      try {
        await cambiarEstadoBarrio(barrio.id, !barrio.activo);
        toast.success(!barrio.activo ? "Barrio activado" : "Barrio desactivado");
        router.refresh();
      } catch {
        toast.error("No se pudo cambiar el estado");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Barrios</h1>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger render={<Button size="sm" className="rounded-full gap-1.5" />}>
            <Plus className="size-4" />
            Nuevo barrio
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Nuevo barrio</DialogTitle>
            </DialogHeader>
            <Input
              className="h-11"
              placeholder="Nombre del barrio"
              value={nombreNuevo}
              onChange={(e) => setNombreNuevo(e.target.value)}
              autoFocus
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button className="h-11 w-full" disabled={pending} onClick={handleCrear}>
                Crear
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {barrios.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
          <MapPinned className="size-10" />
          <p className="font-medium">Todavía no hay barrios cargados</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {barrios.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between gap-3 rounded-2xl border bg-card p-4 shadow-sm"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-medium truncate">{b.nombre}</span>
                <Badge
                  variant="secondary"
                  className={
                    b.activo
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                      : "bg-muted text-muted-foreground"
                  }
                >
                  {b.activo ? "Activo" : "Inactivo"}
                </Badge>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-9"
                  onClick={() => {
                    setEditando(b);
                    setNombreEdit(b.nombre);
                    setError(null);
                  }}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-9"
                  disabled={pending}
                  onClick={() => toggleActivo(b)}
                >
                  <Power className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!editando} onOpenChange={(v) => !v && setEditando(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Editar barrio</DialogTitle>
          </DialogHeader>
          <Input
            className="h-11"
            value={nombreEdit}
            onChange={(e) => setNombreEdit(e.target.value)}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button className="h-11 w-full" disabled={pending} onClick={handleEditar}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
