"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TrendingUp, Package, Plus, Pencil, Trash2, Power } from "lucide-react";
import { BackButton } from "@/components/back-button";
import {
  actualizarTarifa,
  aplicarPrecioATodosActivos,
  crearPaquete,
  actualizarPaquete,
  cambiarEstadoPaquete,
  eliminarPaquete,
} from "@/lib/actions/tarifas";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type Tarifa = { id: string; nombre: string; precio: number };
type HistorialItem = {
  id: string;
  precioAnterior: number;
  precioNuevo: number;
  porcentaje: number | null;
  creadoEn: Date | string;
  usuario: { nombre: string };
};
type Paquete = {
  id: string;
  nombre: string;
  tramos: number;
  precio: number;
  activo: boolean;
};

const PORCENTAJES_RAPIDOS = [20, 15, 10, 5, -5, -10, -15, -20];

const PAQUETE_VACIO = { nombre: "", tramos: "", precio: "" };

export function PreciosManager({
  tarifa,
  historial,
  paquetes,
}: {
  tarifa: Tarifa;
  historial: HistorialItem[];
  paquetes: Paquete[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [nuevoValor, setNuevoValor] = useState("");
  const [porcentajeCustom, setPorcentajeCustom] = useState("");
  const [precioAplicar, setPrecioAplicar] = useState("");

  const [paqueteOpen, setPaqueteOpen] = useState(false);
  const [paqueteEditando, setPaqueteEditando] = useState<Paquete | null>(null);
  const [paqueteForm, setPaqueteForm] = useState(PAQUETE_VACIO);
  const [paqueteError, setPaqueteError] = useState<string | null>(null);

  function abrirNuevoPaquete() {
    setPaqueteEditando(null);
    setPaqueteForm(PAQUETE_VACIO);
    setPaqueteError(null);
    setPaqueteOpen(true);
  }

  function abrirEditarPaquete(p: Paquete) {
    setPaqueteEditando(p);
    setPaqueteForm({ nombre: p.nombre, tramos: String(p.tramos), precio: String(p.precio) });
    setPaqueteError(null);
    setPaqueteOpen(true);
  }

  function guardarPaquete() {
    setPaqueteError(null);
    if (!paqueteForm.nombre.trim() || !paqueteForm.tramos || !paqueteForm.precio) {
      setPaqueteError("Completá nombre, tramos y precio");
      return;
    }
    startTransition(async () => {
      try {
        const datos = {
          nombre: paqueteForm.nombre,
          tramos: Number(paqueteForm.tramos),
          precio: Number(paqueteForm.precio),
        };
        if (paqueteEditando) {
          await actualizarPaquete(paqueteEditando.id, datos);
        } else {
          await crearPaquete(datos);
        }
        toast.success(paqueteEditando ? "Paquete actualizado" : "Paquete creado");
        setPaqueteOpen(false);
        router.refresh();
      } catch (e) {
        setPaqueteError(e instanceof Error ? e.message : "No se pudo guardar");
      }
    });
  }

  function toggleActivoPaquete(p: Paquete) {
    startTransition(async () => {
      try {
        await cambiarEstadoPaquete(p.id, !p.activo);
        toast.success(!p.activo ? "Paquete activado" : "Paquete desactivado");
        router.refresh();
      } catch {
        toast.error("No se pudo cambiar el estado");
      }
    });
  }

  function borrarPaquete(id: string) {
    startTransition(async () => {
      try {
        await eliminarPaquete(id);
        toast.success("Paquete eliminado");
        router.refresh();
      } catch {
        toast.error("No se pudo eliminar");
      }
    });
  }

  function aplicarPorcentaje(pct: number) {
    startTransition(async () => {
      try {
        await actualizarTarifa({ porcentaje: pct });
        toast.success(`Tarifa actualizada (${pct > 0 ? "+" : ""}${pct}%)`);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo actualizar");
      }
    });
  }

  function aplicarValorFijo() {
    const valor = Number(nuevoValor);
    if (!valor || valor <= 0) {
      toast.error("Ingresá un valor válido");
      return;
    }
    aplicarValor(valor);
    setNuevoValor("");
  }

  function aplicarValor(valor: number) {
    startTransition(async () => {
      try {
        await actualizarTarifa({ precioNuevo: valor });
        toast.success("Tarifa actualizada");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo actualizar");
      }
    });
  }

  function aplicarPorcentajePersonalizado() {
    const pct = Number(porcentajeCustom);
    if (!pct) {
      toast.error("Ingresá un porcentaje válido");
      return;
    }
    aplicarPorcentaje(pct);
    setPorcentajeCustom("");
  }

  function handleAplicarATodos() {
    const valor = Number(precioAplicar || tarifa.precio);
    startTransition(async () => {
      try {
        const r = await aplicarPrecioATodosActivos(valor);
        toast.success(`Precio contratado actualizado en ${r.count} servicios`);
        router.refresh();
      } catch {
        toast.error("No se pudo aplicar");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <BackButton />
        <div>
          <h1 className="text-xl font-bold">Precios y tarifas</h1>
          <p className="text-sm text-muted-foreground">
            Tarifa general vigente: acá NO se modifica el precio ya contratado por cada pasajero.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="size-4" />
            Paquetes
          </CardTitle>
          <Dialog open={paqueteOpen} onOpenChange={setPaqueteOpen}>
            <DialogTrigger
              render={<Button size="sm" variant="outline" className="rounded-full gap-1.5" onClick={abrirNuevoPaquete} />}
            >
              <Plus className="size-4" />
              Nuevo
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>{paqueteEditando ? "Editar paquete" : "Nuevo paquete"}</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>Nombre</Label>
                  <Input
                    className="h-11"
                    value={paqueteForm.nombre}
                    onChange={(e) => setPaqueteForm({ ...paqueteForm, nombre: e.target.value })}
                    placeholder="Ej: Promo 20 tramos"
                    autoFocus
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label>Tramos</Label>
                    <Input
                      type="number"
                      inputMode="numeric"
                      className="h-11"
                      value={paqueteForm.tramos}
                      onChange={(e) => setPaqueteForm({ ...paqueteForm, tramos: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Precio</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      className="h-11"
                      value={paqueteForm.precio}
                      onChange={(e) => setPaqueteForm({ ...paqueteForm, precio: e.target.value })}
                    />
                  </div>
                </div>
                {paqueteError && <p className="text-sm text-destructive">{paqueteError}</p>}
              </div>
              <DialogFooter>
                <Button className="h-11 w-full" disabled={pending} onClick={guardarPaquete}>
                  Guardar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {paquetes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no cargaste paquetes.</p>
          ) : (
            paquetes.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-2 rounded-xl border p-3"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{p.nombre}</p>
                  <p className="text-sm text-muted-foreground">
                    {p.tramos} tramo{p.tramos === 1 ? "" : "s"} · ${p.precio.toLocaleString("es-AR")}
                    {!p.activo && " · Inactivo"}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="icon" variant="ghost" className="size-8" onClick={() => abrirEditarPaquete(p)}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8"
                    disabled={pending}
                    onClick={() => toggleActivoPaquete(p)}
                  >
                    <Power className="size-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger render={<Button size="icon" variant="ghost" className="size-8 text-destructive" />}>
                      <Trash2 className="size-4" />
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar "{p.nombre}"?</AlertDialogTitle>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => borrarPaquete(p.id)} className="bg-destructive text-white">
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="size-4" />
            Tarifa actual: ${tarifa.precio.toLocaleString("es-AR")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="porcentaje">
            <TabsList className="w-full">
              <TabsTrigger value="porcentaje" className="flex-1">Por porcentaje</TabsTrigger>
              <TabsTrigger value="fijo" className="flex-1">Valor fijo</TabsTrigger>
            </TabsList>
            <TabsContent value="porcentaje" className="flex flex-col gap-3 pt-3">
              <div className="flex flex-wrap gap-2">
                {PORCENTAJES_RAPIDOS.map((p) => (
                  <Button
                    key={p}
                    variant="outline"
                    disabled={pending}
                    onClick={() => aplicarPorcentaje(p)}
                    className={`h-11 rounded-full ${p < 0 ? "text-destructive" : ""}`}
                  >
                    {p > 0 ? "+" : ""}
                    {p}%
                  </Button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  inputMode="decimal"
                  className="h-11"
                  placeholder="% personalizado (ej: -5, 12.5)"
                  value={porcentajeCustom}
                  onChange={(e) => setPorcentajeCustom(e.target.value)}
                />
                <Button className="h-11" disabled={pending} onClick={aplicarPorcentajePersonalizado}>
                  Aplicar
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="fijo" className="flex flex-col gap-3 pt-3">
              <div className="flex gap-2">
                <Input
                  type="number"
                  inputMode="decimal"
                  className="h-11"
                  placeholder="Nuevo precio"
                  value={nuevoValor}
                  onChange={(e) => setNuevoValor(e.target.value)}
                />
                <Button className="h-11" disabled={pending} onClick={aplicarValorFijo}>
                  Aplicar
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Aplicar a pasajeros</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Esto SÍ modifica el precio contratado de cada pasajero. Usalo solo cuando quieras
            trasladar el aumento a todos.
          </p>
          <div className="flex gap-2">
            <Input
              type="number"
              inputMode="decimal"
              className="h-11"
              placeholder={`Precio a aplicar (por defecto $${tarifa.precio})`}
              value={precioAplicar}
              onChange={(e) => setPrecioAplicar(e.target.value)}
            />
            <AlertDialog>
              <AlertDialogTrigger render={<Button variant="destructive" className="h-11 shrink-0" />}>
                Aplicar a todos
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Aplicar a todos los pasajeros activos?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Se va a actualizar el precio contratado de todos los servicios activos a $
                    {precioAplicar || tarifa.precio}. Esta acción queda registrada en el historial.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleAplicarATodos}>Confirmar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historial de precios</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {historial.length === 0 && (
            <p className="text-sm text-muted-foreground">Todavía no hay cambios registrados.</p>
          )}
          {historial.map((h) => (
            <div key={h.id} className="flex items-center justify-between gap-2 border-b py-2 text-sm last:border-0">
              <div className="min-w-0">
                <p>
                  ${h.precioAnterior.toLocaleString("es-AR")} → ${h.precioNuevo.toLocaleString("es-AR")}
                  {h.porcentaje != null && (
                    <span className="text-muted-foreground"> ({h.porcentaje > 0 ? "+" : ""}{h.porcentaje}%)</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {h.usuario.nombre} · {format(new Date(h.creadoEn), "d MMM yyyy HH:mm", { locale: es })}
                </p>
              </div>
              {h.precioAnterior !== tarifa.precio && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 shrink-0 rounded-full"
                  disabled={pending}
                  onClick={() => aplicarValor(h.precioAnterior)}
                >
                  Volver a ${h.precioAnterior.toLocaleString("es-AR")}
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
