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
import { TrendingUp } from "lucide-react";
import {
  actualizarTarifa,
  aplicarPrecioATodosActivos,
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

const PORCENTAJES_RAPIDOS = [5, 10, 15, 20];

export function PreciosManager({
  tarifa,
  historial,
}: {
  tarifa: Tarifa;
  historial: HistorialItem[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [nuevoValor, setNuevoValor] = useState("");
  const [porcentajeCustom, setPorcentajeCustom] = useState("");
  const [precioAplicar, setPrecioAplicar] = useState("");

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
      <div>
        <h1 className="text-xl font-bold">Precios y tarifas</h1>
        <p className="text-sm text-muted-foreground">
          Tarifa general vigente: acá NO se modifica el precio ya contratado por cada pasajero.
        </p>
      </div>

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
                    className="h-11 rounded-full"
                  >
                    +{p}%
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
              <div>
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
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
