"use client";

import { useMemo, useRef, useState, useTransition, type ChangeEvent } from "react";
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
import {
  Copy as CopyIcon,
  Plus,
  Pencil,
  PencilLine,
  Trash2,
  Search,
  MessageSquareText,
  Check,
  LayoutList,
  LayoutGrid,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { BackButton } from "@/components/back-button";
import { PALETA_COLORES } from "@/components/barrios/barrios-manager";
import {
  crearCategoriaCopy,
  actualizarCategoriaCopy,
  crearCopy,
  actualizarCopy,
  eliminarCopy,
} from "@/lib/actions/copys";
import { coincideBusqueda } from "@/lib/busqueda";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Categoria = { id: string; nombre: string; color: string | null };
type CopyItem = {
  id: string;
  titulo: string;
  contenido: string;
  imagenUrl: string | null;
  categoriaId: string | null;
  categoria: Categoria | null;
};

// Redimensiona/comprime la imagen en el navegador antes de guardarla como
// data URL, para no mandar fotos de varios MB tal cual al servidor.
function comprimirImagen(file: File, maxDim = 1280, calidad = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("No se pudo procesar la imagen"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", calidad));
      };
      img.onerror = () => reject(new Error("No se pudo leer la imagen"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
    reader.readAsDataURL(file);
  });
}

// El Clipboard API de Chrome solo admite escribir image/png (no jpeg), así
// que reconvertimos acá justo antes de copiar. Guardamos jpeg en la base
// porque pesa bastante menos.
function blobAPng(blob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("No se pudo procesar la imagen"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((pngBlob) => {
        URL.revokeObjectURL(url);
        if (pngBlob) resolve(pngBlob);
        else reject(new Error("No se pudo convertir la imagen"));
      }, "image/png");
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la imagen"));
    };
    img.src = url;
  });
}

function ImagenCopyField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [procesando, setProcesando] = useState(false);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Elegí un archivo de imagen");
      return;
    }
    setProcesando(true);
    try {
      const dataUrl = await comprimirImagen(file);
      onChange(dataUrl);
    } catch {
      toast.error("No se pudo procesar la imagen");
    } finally {
      setProcesando(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label>Imagen (opcional)</Label>
      {value ? (
        <div className="relative w-fit">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="max-h-40 rounded-lg border object-contain" />
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="absolute -right-2 -top-2 size-6 rounded-full"
            onClick={() => onChange("")}
            aria-label="Quitar imagen"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="h-11 w-fit gap-1.5"
          disabled={procesando}
          onClick={() => inputRef.current?.click()}
        >
          <ImageIcon className="size-4" />
          {procesando ? "Procesando..." : "Subir imagen"}
        </Button>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

function SelectorColorMini({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {PALETA_COLORES.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={cn(
            "flex size-7 items-center justify-center rounded-full border-2 transition-transform",
            value === c ? "border-foreground scale-110" : "border-transparent"
          )}
          style={{ backgroundColor: c }}
          aria-label={c}
        >
          {value === c && <Check className="size-3.5 text-white drop-shadow" />}
        </button>
      ))}
    </div>
  );
}

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
  const [vista, setVista] = useState<"lista" | "grilla">("lista");
  const [pending, startTransition] = useTransition();

  const [nuevoOpen, setNuevoOpen] = useState(false);
  const [nuevoTitulo, setNuevoTitulo] = useState("");
  const [nuevoContenido, setNuevoContenido] = useState("");
  const [nuevaCategoria, setNuevaCategoria] = useState("");
  const [nuevaImagen, setNuevaImagen] = useState("");

  const [catOpen, setCatOpen] = useState(false);
  const [catEditandoId, setCatEditandoId] = useState<string | null>(null);
  const [catNombre, setCatNombre] = useState("");
  const [catColor, setCatColor] = useState(PALETA_COLORES[0]);
  const [catError, setCatError] = useState<string | null>(null);

  const [editando, setEditando] = useState<CopyItem | null>(null);
  const [editTitulo, setEditTitulo] = useState("");
  const [editContenido, setEditContenido] = useState("");
  const [editCategoria, setEditCategoria] = useState("");
  const [editImagen, setEditImagen] = useState("");

  const [personalizando, setPersonalizando] = useState<CopyItem | null>(null);
  const [textoPersonalizado, setTextoPersonalizado] = useState("");
  const [imagenPersonalizada, setImagenPersonalizada] = useState("");

  const filtrados = useMemo(() => {
    const q = busqueda.trim();
    return copys.filter((c) => {
      if (categoriaActiva !== "TODAS" && c.categoriaId !== categoriaActiva) return false;
      if (!q) return true;
      return coincideBusqueda(`${c.titulo} ${c.contenido}`, q);
    });
  }, [copys, busqueda, categoriaActiva]);

  async function copiar(contenido: string) {
    try {
      await navigator.clipboard.writeText(contenido);
      toast.success("Mensaje copiado");
    } catch {
      toast.error("No se pudo copiar");
    }
  }

  // WhatsApp (como casi cualquier app) al recibir un pegado con imagen
  // SIEMPRE adjunta la foto y descarta el texto que venga en el mismo
  // portapapeles: no hay forma de que un solo Ctrl+V deje la foto adjunta
  // Y el texto como descripción a la vez. Por eso van separados: copiás la
  // imagen, la pegás (se adjunta y abre el cuadro de descripción), y después
  // copiás el mensaje y lo pegás ahí.
  async function copiarImagen(imagenUrl: string) {
    try {
      const blobOriginal = await (await fetch(imagenUrl)).blob();
      const blobPng = blobOriginal.type === "image/png" ? blobOriginal : await blobAPng(blobOriginal);
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blobPng })]);
      toast.success("Imagen copiada. Pegala en WhatsApp para adjuntarla.");
    } catch {
      toast.error("No se pudo copiar la imagen");
    }
  }

  function abrirPersonalizar(c: CopyItem) {
    setPersonalizando(c);
    setTextoPersonalizado(c.contenido);
    setImagenPersonalizada(c.imagenUrl ?? "");
  }

  async function copiarPersonalizado() {
    await copiar(textoPersonalizado);
    setPersonalizando(null);
  }

  function abrirNuevaCategoria() {
    setCatEditandoId(null);
    setCatNombre("");
    setCatColor(PALETA_COLORES[0]);
    setCatError(null);
  }

  function abrirEditarCategoria(c: Categoria) {
    setCatEditandoId(c.id);
    setCatNombre(c.nombre);
    setCatColor(c.color ?? PALETA_COLORES[0]);
    setCatError(null);
  }

  function handleGuardarCategoria() {
    if (!catNombre.trim()) return;
    setCatError(null);
    startTransition(async () => {
      try {
        const resultado = catEditandoId
          ? await actualizarCategoriaCopy(catEditandoId, { nombre: catNombre, color: catColor })
          : await crearCategoriaCopy({ nombre: catNombre, color: catColor });
        if (resultado && "error" in resultado) {
          setCatError(resultado.error);
          return;
        }
        toast.success(catEditandoId ? "Categoría actualizada" : "Categoría creada");
        abrirNuevaCategoria();
        router.refresh();
      } catch (e) {
        setCatError(e instanceof Error ? e.message : "No se pudo guardar");
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
          imagenUrl: nuevaImagen,
        });
        toast.success("Copy creado");
        setNuevoTitulo("");
        setNuevoContenido("");
        setNuevaCategoria("");
        setNuevaImagen("");
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
    setEditImagen(c.imagenUrl ?? "");
  }

  function handleGuardarEdicion() {
    if (!editando) return;
    startTransition(async () => {
      try {
        await actualizarCopy(editando.id, {
          titulo: editTitulo,
          contenido: editContenido,
          categoriaId: editCategoria === "NINGUNA" ? "" : editCategoria,
          imagenUrl: editImagen,
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
        <div className="flex items-center gap-2">
          <BackButton />
          <div>
            <h1 className="text-xl font-bold">Copys</h1>
            <p className="text-sm text-muted-foreground">
              Respuestas rápidas para tus clientes
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog
            open={catOpen}
            onOpenChange={(v) => {
              setCatOpen(v);
              if (v) abrirNuevaCategoria();
            }}
          >
            <DialogTrigger render={<Button size="sm" variant="outline" className="rounded-full" />}>
              Categorías
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Categorías</DialogTitle>
              </DialogHeader>
              {categorias.length > 0 && (
                <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                  {categorias.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => abrirEditarCategoria(c)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                        catEditandoId === c.id ? "bg-primary/10" : "hover:bg-accent"
                      )}
                    >
                      <span
                        className="size-3.5 shrink-0 rounded-full border"
                        style={{ backgroundColor: c.color ?? "#d4d4d8" }}
                      />
                      <span className="truncate">{c.nombre}</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="flex flex-col gap-3 border-t pt-3">
                <Input
                  className="h-11"
                  placeholder="Nombre de la categoría"
                  value={catNombre}
                  onChange={(e) => setCatNombre(e.target.value)}
                  autoFocus
                />
                <SelectorColorMini value={catColor} onChange={setCatColor} />
              </div>
              {catError && <p className="text-sm text-destructive">{catError}</p>}
              <DialogFooter>
                {catEditandoId && (
                  <Button variant="ghost" className="h-11" onClick={abrirNuevaCategoria}>
                    Cancelar edición
                  </Button>
                )}
                <Button className="h-11 flex-1" disabled={pending} onClick={handleGuardarCategoria}>
                  {catEditandoId ? "Guardar cambios" : "Crear"}
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
                <ImagenCopyField value={nuevaImagen} onChange={setNuevaImagen} />
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
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar copy..."
              className="h-11 pl-9"
            />
          </div>
          <div className="flex shrink-0 items-center rounded-full border p-0.5">
            <Button
              size="icon"
              variant={vista === "lista" ? "default" : "ghost"}
              className="size-9 rounded-full"
              onClick={() => setVista("lista")}
              aria-label="Ver en lista"
              title="Ver en lista"
            >
              <LayoutList className="size-4" />
            </Button>
            <Button
              size="icon"
              variant={vista === "grilla" ? "default" : "ghost"}
              className="size-9 rounded-full"
              onClick={() => setVista("grilla")}
              aria-label="Ver en grilla"
              title="Ver en grilla"
            >
              <LayoutGrid className="size-4" />
            </Button>
          </div>
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
              variant="outline"
              className={cn(
                "shrink-0 rounded-full h-8 gap-1.5 border-2",
                categoriaActiva === c.id && "bg-accent"
              )}
              style={{ borderColor: c.color ?? undefined }}
              onClick={() => setCategoriaActiva(c.id)}
            >
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: c.color ?? "#a1a1aa" }}
              />
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
        <div
          className={
            vista === "lista"
              ? "flex flex-col gap-2.5"
              : "grid grid-cols-2 items-start gap-2.5"
          }
        >
          {filtrados.map((c) => (
            <div
              key={c.id}
              className="rounded-2xl border bg-card p-4 shadow-sm flex flex-col gap-2"
              style={c.categoria?.color ? { borderColor: c.categoria.color } : undefined}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{c.titulo}</p>
                  {c.categoria && (
                    <Badge
                      variant="secondary"
                      className="mt-1 font-normal text-white"
                      style={c.categoria.color ? { backgroundColor: c.categoria.color } : undefined}
                    >
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
              {c.imagenUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.imagenUrl}
                  alt=""
                  className="max-h-32 w-fit cursor-pointer rounded-lg border object-contain"
                  onClick={() => copiarImagen(c.imagenUrl!)}
                  title="Tocar para copiar la imagen"
                />
              )}
              <p
                className={cn(
                  "text-sm text-muted-foreground whitespace-pre-wrap",
                  vista === "grilla" ? "line-clamp-6" : "line-clamp-3"
                )}
              >
                {c.contenido}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 rounded-full gap-1.5"
                  onClick={() => copiar(c.contenido)}
                >
                  <CopyIcon className="size-4" />
                  Copiar
                </Button>
                {c.imagenUrl && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 rounded-full gap-1.5"
                    onClick={() => copiarImagen(c.imagenUrl!)}
                  >
                    <ImageIcon className="size-4" />
                    Copiar imagen
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 rounded-full gap-1.5"
                  onClick={() => abrirPersonalizar(c)}
                >
                  <PencilLine className="size-4" />
                  Editar y copiar
                </Button>
              </div>
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
            <ImagenCopyField value={editImagen} onChange={setEditImagen} />
          </div>
          <DialogFooter>
            <Button className="h-11 w-full" disabled={pending} onClick={handleGuardarEdicion}>
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!personalizando} onOpenChange={(v) => !v && setPersonalizando(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar antes de copiar</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Cambiá lo que necesites solo para esta vez — el copy original ({personalizando?.titulo})
            no se modifica.
          </p>
          <div className="flex flex-col gap-3">
            <Textarea
              className="min-h-[140px]"
              value={textoPersonalizado}
              onChange={(e) => setTextoPersonalizado(e.target.value)}
            />
            <ImagenCopyField value={imagenPersonalizada} onChange={setImagenPersonalizada} />
            {imagenPersonalizada && (
              <p className="text-xs text-muted-foreground">
                Copiá primero la imagen y pegala en WhatsApp (se adjunta y abre la descripción);
                después copiá el mensaje y pegalo ahí.
              </p>
            )}
          </div>
          <DialogFooter>
            {imagenPersonalizada && (
              <Button
                variant="outline"
                className="h-11 gap-1.5"
                onClick={() => copiarImagen(imagenPersonalizada)}
              >
                <ImageIcon className="size-4" />
                Copiar imagen
              </Button>
            )}
            <Button className="h-11 flex-1 gap-1.5" onClick={copiarPersonalizado}>
              <CopyIcon className="size-4" />
              Copiar mensaje
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
