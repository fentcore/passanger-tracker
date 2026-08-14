"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy as CopyIcon, Plus, Pencil, Trash2, Search, MessageSquareText } from "lucide-react";
import {
  crearCategoriaCopy,
  crearCopy,
  actualizarCopy,
  eliminarCopy,
} from "@/lib/actions/copys";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Categoria = { id: string; nombre: string };
type CopyItem = {
  id: string;
  titulo: string;
  contenido: string;
  categoriaId: string | null;
  categoria: Categoria | null;
};

export function CopysManager({
  copys,
  categorias,
}: {
  copys: CopyItem[];
  categorias: Categoria[];
}) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState<string>("TODAS");
  const [pending, startTransition] = useTransition();

  const [nuevoOpen, setNuevoOpen] = useState(false);
  const [nuevoTitulo, setNuevoTitulo] = useState("");
  const [nuevoContenido, setNuevoContenido] = useState("");
  const [nuevaCategoria, setNuevaCategoria] = useState("");

  const [catOpen, setCatOpen] = useState(false);
  const [catNombre, setCatNombre] = useState("");

  const [editando, setEditando] = useState<CopyItem | null>(null);
  const [editTitulo, setEditTitulo] = useState("");
  const [editContenido, setEditContenido] = useState("");
  const [editCategoria, setEditCategoria] = useState("");

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return copys.filter((c) => {
      if (categoriaActiva !== "TODAS" && c.categoriaId !== categoriaActiva) return false;
      if (!q) return true;
      return (
        c.titulo.toLowerCase().includes(q) || c.contenido.toLowerCase().includes(q)
      );
    });
  }, [copys, busqueda, categoriaActiva]);

  async function copiar(contenido: string) {
    try {
      await navigator.clipboard.writeText(contenido);
      toast.success("Copiado al portapapeles");
    } catch {
      toast.error("No se pudo copiar");
    }
  }

  function handleCrearCategoria() {
    if (!catNombre.trim()) return;
    startTransition(async () => {
      try {
        await crearCategoriaCopy({ nombre: catNombre });
        toast.success("Categoría creada");
        setCatNombre("");
        setCatOpen(false);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo crear");
      }
    });
  }

  function handleCrearCopy() {
    if (!nuevoTitulo.trim() || !nuevoContenido.trim()) return;
    startTransition(async () => {
      try {
        await crearCopy({
          titulo: nuevoTitulo,
          contenido: nuevoContenido,
          categoriaId: nuevaCategoria === "NINGUNA" ? "" : nuevaCategoria,
        });
        toast.success("Copy creado");
        setNuevoTitulo("");
        setNuevoContenido("");
        setNuevaCategoria("");
        setNuevoOpen(false);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo crear");
      }
    });
  }

  function abrirEdicion(c: CopyItem) {
    setEditando(c);
    setEditTitulo(c.titulo);
    setEditContenido(c.contenido);
    setEditCategoria(c.categoriaId ?? "NINGUNA");
  }

  function handleGuardarEdicion() {
    if (!editando) return;
    startTransition(async () => {
      try {
        await actualizarCopy(editando.id, {
          titulo: editTitulo,
          contenido: editContenido,
          categoriaId: editCategoria === "NINGUNA" ? "" : editCategoria,
        });
        toast.success("Copy actualizado");
        setEditando(null);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo guardar");
      }
    });
  }

  function handleEliminar(id: string) {
    startTransition(async () => {
      try {
        await eliminarCopy(id);
        toast.success("Copy eliminado");
        router.refresh();
      } catch {
        toast.error("No se pudo eliminar");
      }
    });
  }

  const categoriaItems = {
    NINGUNA: "Sin categoría",
    ...Object.fromEntries(categorias.map((c) => [c.id, c.nombre])),
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">Copys</h1>
          <p className="text-sm text-muted-foreground">
            Respuestas rápidas para tus clientes
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={catOpen} onOpenChange={setCatOpen}>
            <DialogTrigger render={<Button size="sm" variant="outline" className="rounded-full" />}>
              Categoría
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Nueva categoría</DialogTitle>
              </DialogHeader>
              <Input
                className="h-11"
                placeholder="Nombre de la categoría"
                value={catNombre}
                onChange={(e) => setCatNombre(e.target.value)}
                autoFocus
              />
              <DialogFooter>
                <Button className="h-11 w-full" disabled={pending} onClick={handleCrearCategoria}>
                  Crear
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={nuevoOpen} onOpenChange={setNuevoOpen}>
            <DialogTrigger render={<Button size="sm" className="rounded-full gap-1.5" />}>
              <Plus className="size-4" />
              Nuevo
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Nuevo copy</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>Título</Label>
                  <Input
                    className="h-11"
                    value={nuevoTitulo}
                    onChange={(e) => setNuevoTitulo(e.target.value)}
                    placeholder="Ej: Confirmación de horario"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Categoría</Label>
                  <Select
                    items={categoriaItems}
                    value={nuevaCategoria || "NINGUNA"}
                    onValueChange={(v) => v && setNuevaCategoria(v)}
                  >
                    <SelectTrigger className="h-11 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NINGUNA">Sin categoría</SelectItem>
                      {categorias.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Mensaje</Label>
                  <Textarea
                    className="min-h-[100px]"
                    value={nuevoContenido}
                    onChange={(e) => setNuevoContenido(e.target.value)}
                    placeholder="Escribí el mensaje completo..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button className="h-11 w-full" disabled={pending} onClick={handleCrearCopy}>
                  Guardar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar copy..."
            className="h-11 pl-9"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
          <Button
            size="sm"
            variant={categoriaActiva === "TODAS" ? "default" : "outline"}
            className="shrink-0 rounded-full h-8"
            onClick={() => setCategoriaActiva("TODAS")}
          >
            Todas
          </Button>
          {categorias.map((c) => (
            <Button
              key={c.id}
              size="sm"
              variant={categoriaActiva === c.id ? "default" : "outline"}
              className="shrink-0 rounded-full h-8"
              onClick={() => setCategoriaActiva(c.id)}
            >
              {c.nombre}
            </Button>
          ))}
        </div>
      </div>

      {filtrados.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
          <MessageSquareText className="size-10" />
          <p className="font-medium">No hay copys para este filtro</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtrados.map((c) => (
            <div key={c.id} className="rounded-2xl border bg-card p-4 shadow-sm flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{c.titulo}</p>
                  {c.categoria && (
                    <Badge variant="secondary" className="mt-1 font-normal">
                      {c.categoria.nombre}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="icon" variant="ghost" className="size-8" onClick={() => abrirEdicion(c)}>
                    <Pencil className="size-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger render={<Button size="icon" variant="ghost" className="size-8 text-destructive" />}>
                      <Trash2 className="size-4" />
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar este copy?</AlertDialogTitle>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleEliminar(c.id)} className="bg-destructive text-white">
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">
                {c.contenido}
              </p>
              <Button
                size="sm"
                variant="outline"
                className="self-start h-9 rounded-full gap-1.5"
                onClick={() => copiar(c.contenido)}
              >
                <CopyIcon className="size-4" />
                Copiar
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!editando} onOpenChange={(v) => !v && setEditando(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar copy</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Título</Label>
              <Input className="h-11" value={editTitulo} onChange={(e) => setEditTitulo(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Categoría</Label>
              <Select
                items={categoriaItems}
                value={editCategoria || "NINGUNA"}
                onValueChange={(v) => v && setEditCategoria(v)}
              >
                <SelectTrigger className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NINGUNA">Sin categoría</SelectItem>
                  {categorias.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Mensaje</Label>
              <Textarea
                className="min-h-[100px]"
                value={editContenido}
                onChange={(e) => setEditContenido(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button className="h-11 w-full" disabled={pending} onClick={handleGuardarEdicion}>
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
