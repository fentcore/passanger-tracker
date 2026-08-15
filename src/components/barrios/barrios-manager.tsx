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
import { Plus, Pencil, Power, Trash2, MapPinned, Check } from "lucide-react";
import { BackButton } from "@/components/back-button";
import {
  crearBarrio,
  actualizarBarrio,
  cambiarEstadoBarrio,
  eliminarBarrio,
} from "@/lib/actions/barrios";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Barrio = { id: string; nombre: string; activo: boolean; color: string | null };

export const PALETA_COLORES = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#10b981",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#d946ef",
  "#ec4899",
];

function SelectorColor({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">Color</span>
      <div className="flex flex-wrap gap-2">
        {PALETA_COLORES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className={cn(
              "flex size-8 items-center justify-center rounded-full border-2 transition-transform",
              value === c ? "border-foreground scale-110" : "border-transparent"
            )}
            style={{ backgroundColor: c }}
            aria-label={c}
          >
            {value === c && <Check className="size-4 text-white drop-shadow" />}
          </button>
        ))}
      </div>
    </div>
  );
}

export function BarriosManager({ barrios }: { barrios: Barrio[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [nombreNuevo, setNombreNuevo] = useState("");
  const [colorNuevo, setColorNuevo] = useState(PALETA_COLORES[0]);
  const [editando, setEditando] = useState<Barrio | null>(null);
  const [nombreEdit, setNombreEdit] = useState("");
  const [colorEdit, setColorEdit] = useState(PALETA_COLORES[0]);
  const [error, setError] = useState<string | null>(null);

  function handleCrear() {
    setError(null);
    if (!nombreNuevo.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    startTransition(async () => {
      try {
        const resultado = await crearBarrio({ nombre: nombreNuevo, color: colorNuevo });
        if (resultado && "error" in resultado) {
          setError(resultado.error);
          return;
        }
        toast.success("Barrio creado");
        setNombreNuevo("");
        setColorNuevo(PALETA_COLORES[0]);
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
        const resultado = await actualizarBarrio(editando.id, {
          nombre: nombreEdit,
          color: colorEdit,
        });
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

  function handleEliminar(barrio: Barrio) {
    startTransition(async () => {
      try {
        const resultado = await eliminarBarrio(barrio.id);
        if (resultado && "error" in resultado) {
          toast.error(resultado.error);
          return;
        }
        toast.success("Barrio eliminado");
        router.refresh();
      } catch {
        toast.error("No se pudo eliminar el barrio");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BackButton />
          <h1 className="text-xl font-bold">Barrios</h1>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger render={<Button size="sm" className="rounded-full gap-1.5" />}>
            <Plus className="size-4" />
            Nuevo barrio
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Nuevo barrio</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <Input
                className="h-11"
                placeholder="Nombre del barrio"
                value={nombreNuevo}
                onChange={(e) => setNombreNuevo(e.target.value)}
                autoFocus
              />
              <SelectorColor value={colorNuevo} onChange={setColorNuevo} />
            </div>
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
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="size-4 shrink-0 rounded-full border"
                  style={{ backgroundColor: b.color ?? "#d4d4d8" }}
                />
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
                    setColorEdit(b.color ?? PALETA_COLORES[0]);
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
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button size="icon" variant="ghost" className="size-9 text-destructive" aria-label="Eliminar barrio" />
                    }
                  >
                    <Trash2 className="size-4" />
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar "{b.nombre}"?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Si el barrio tiene servicios o puntos del
                        mapa asociados, no se va a poder eliminar — desactivalo en ese caso.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleEliminar(b)}
                        className="bg-destructive text-white"
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
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
          <div className="flex flex-col gap-4">
            <Input
              className="h-11"
              value={nombreEdit}
              onChange={(e) => setNombreEdit(e.target.value)}
            />
            <SelectorColor value={colorEdit} onChange={setColorEdit} />
          </div>
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
