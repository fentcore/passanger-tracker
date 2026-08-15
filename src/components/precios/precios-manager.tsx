"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { TrendingUp, Package, Plus, Pencil, Trash2, Power, Copy, ArrowRight } from "lucide-react";
import { BackButton } from "@/components/back-button";
import {
  actualizarTarifa,
  actualizarPreciosPaquetes,
  crearPaquete,
  actualizarPaquete,
  cambiarEstadoPaquete,
  eliminarPaquete,
} from "@/lib/actions/tarifas";
import { toast } from "sonner";

type Tarifa = { id: string; nombre: string; precio: number };
type Paquete = {
  id: string;
  nombre: string;
  tramos: number;
  precio: number;
  activo: boolean;
};

const PORCENTAJES_RAPIDOS = [20, 15, 10, 5, -5, -10, -15, -20];

const PAQUETE_VACIO = { nombre: "", tramos: "", precio: "" };

function generarMensajeAviso(precioActual: number, precioNuevo: number) {
  return `Hola! Te contamos que a partir de ahora el valor del viaje va a ser de $${precioNuevo.toLocaleString(
    "es-AR"
  )} (antes $${precioActual.toLocaleString(
    "es-AR"
  )}). Gracias por tu comprensión y por seguir confiando en nosotros. Cualquier consulta, quedamos a disposición. ¡Saludos!`;
}

export function PreciosManager({
  tarifa,
  paquetes,
}: {
  tarifa: Tarifa;
  paquetes: Paquete[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState<"porcentaje" | "fijo">("porcentaje");
  const [nuevoValor, setNuevoValor] = useState("");
  const [porcentajeCustom, setPorcentajeCustom] = useState("");
  const [porcentajeCalc, setPorcentajeCalc] = useState<number | null>(null);

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

  function calcularPersonalizado() {
    const pct = Number(porcentajeCustom);
    if (!porcentajeCustom.trim() || Number.isNaN(pct)) {
      toast.error("Ingresá un porcentaje válido");
      return;
    }
    setPorcentajeCalc(pct);
  }

  function aplicarValorFijo() {
    const valor = Number(nuevoValor);
    if (!valor || valor <= 0) {
      toast.error("Ingresá un valor válido");
      return;
    }
    startTransition(async () => {
      try {
        await actualizarTarifa({ precioNuevo: valor });
        toast.success("Tarifa actualizada");
        setNuevoValor("");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo actualizar");
      }
    });
  }

  // Precio previsto según lo que se esté mirando en la calculadora, sin
  // guardar nada todavía. Solo "Valor fijo" -> Aplicar modifica la tarifa.
  let previsto: { precio: number; porcentaje: number } | null = null;
  if (tab === "porcentaje") {
    if (porcentajeCalc != null && !Number.isNaN(porcentajeCalc)) {
      previsto = {
        precio: Math.round(tarifa.precio * (1 + porcentajeCalc / 100) * 100) / 100,
        porcentaje: porcentajeCalc,
      };
    }
  } else {
    const val = Number(nuevoValor);
    if (nuevoValor.trim() && !Number.isNaN(val) && val > 0) {
      previsto = {
        precio: val,
        porcentaje:
          tarifa.precio > 0 ? Math.round(((val - tarifa.precio) / tarifa.precio) * 10000) / 100 : 0,
      };
    }
  }

  const mensajeAviso = previsto ? generarMensajeAviso(tarifa.precio, previsto.precio) : "";

  function usarValorCalculado() {
    if (!previsto) return;
    setNuevoValor(String(previsto.precio));
    setTab("fijo");
  }

  function copiarMensaje() {
    if (!previsto) return;
    navigator.clipboard.writeText(mensajeAviso);
    toast.success("Mensaje copiado");
  }

  function handleActualizarPaquetes() {
    if (!previsto) return;
    startTransition(async () => {
      try {
        const r = await actualizarPreciosPaquetes(previsto!.porcentaje);
        toast.success(`Paquetes actualizados (${r.count})`);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo actualizar");
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
        <CardContent className="flex flex-col gap-3">
          <Tabs value={tab} onValueChange={(v) => setTab(v as "porcentaje" | "fijo")}>
            <TabsList className="w-full">
              <TabsTrigger value="porcentaje" className="flex-1">Calculadora (%)</TabsTrigger>
              <TabsTrigger value="fijo" className="flex-1">Valor fijo</TabsTrigger>
            </TabsList>
            <TabsContent value="porcentaje" className="flex flex-col gap-3 pt-3">
              <p className="text-xs text-muted-foreground">
                Elegí un porcentaje para ver a cuánto quedaría el precio. Todavía no cambia nada.
              </p>
              <div className="flex flex-wrap gap-2">
                {PORCENTAJES_RAPIDOS.map((p) => (
                  <Button
                    key={p}
                    type="button"
                    variant={porcentajeCalc === p ? "default" : "outline"}
                    onClick={() => setPorcentajeCalc(p)}
                    className={`h-11 rounded-full ${p < 0 && porcentajeCalc !== p ? "text-destructive" : ""}`}
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
                <Button type="button" variant="outline" className="h-11" onClick={calcularPersonalizado}>
                  Calcular
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="fijo" className="flex flex-col gap-3 pt-3">
              <p className="text-xs text-muted-foreground">
                Usalo cuando ya sabés el precio exacto al que vas a actualizar. "Aplicar" sí guarda el cambio.
              </p>
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

          {previsto && (
            <div className="rounded-xl border p-3 flex flex-col gap-3 bg-muted/30">
              <div>
                <p className="text-sm font-semibold">
                  Precio previsto: ${previsto.precio.toLocaleString("es-AR")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {previsto.porcentaje > 0 ? "+" : ""}
                  {previsto.porcentaje}% respecto al actual (${tarifa.precio.toLocaleString("es-AR")})
                </p>
              </div>

              {tab === "porcentaje" && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="self-start rounded-full gap-1.5"
                  onClick={usarValorCalculado}
                >
                  <ArrowRight className="size-3.5" />
                  Usar este valor en &quot;Valor fijo&quot;
                </Button>
              )}

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Mensaje para avisar a los pasajeros</Label>
                <Textarea readOnly value={mensajeAviso} className="text-sm bg-background" rows={5} />
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 self-start rounded-full gap-1.5"
                  onClick={copiarMensaje}
                >
                  <Copy className="size-4" />
                  Copiar mensaje
                </Button>
              </div>

              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button
                      type="button"
                      variant="secondary"
                      className="h-10 self-start rounded-full gap-1.5"
                      disabled={pending}
                    />
                  }
                >
                  <Package className="size-4" />
                  Actualizar paquetes ({previsto.porcentaje > 0 ? "+" : ""}
                  {previsto.porcentaje}%)
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Actualizar el precio de todos los paquetes?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Se le va a aplicar {previsto.porcentaje > 0 ? "+" : ""}
                      {previsto.porcentaje}% al precio de cada paquete cargado.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleActualizarPaquetes}>Confirmar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
