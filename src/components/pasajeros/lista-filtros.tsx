"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { TIPO_VIAJE_LABEL, ESTADO_PAGO_LABEL } from "@/lib/constants";

type Barrio = { id: string; nombre: string };

export function ListaFiltros({ barrios = [] }: { barrios?: Barrio[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const busqueda = searchParams.get("q") ?? "";
  const estado = searchParams.get("estado") ?? "";
  const whatsapp = searchParams.get("whatsapp") ?? "";
  const barrioId = searchParams.get("barrioId") ?? "";
  const tipoViaje = searchParams.get("tipoViaje") ?? "";
  const estadoPago = searchParams.get("estadoPago") ?? "";

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value) params.delete(key);
    else params.set(key, value);
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  const secundariosActivos = [whatsapp, barrioId, tipoViaje, estadoPago].filter(Boolean).length;

  const barrioItems = { TODOS: "Todos", ...Object.fromEntries(barrios.map((b) => [b.id, b.nombre])) };
  const tipoItems = { TODOS: "Todos", ...TIPO_VIAJE_LABEL };
  const pagoItems = { TODOS: "Todos", ...ESTADO_PAGO_LABEL };

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            defaultValue={busqueda}
            onChange={(e) => setParam("q", e.target.value)}
            placeholder="Buscar pasajero..."
            className="h-11 pl-9"
          />
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <Button size="icon" variant="outline" className="relative h-11 w-11 shrink-0 rounded-full" />
            }
          >
            <SlidersHorizontal className="size-4" />
            {secundariosActivos > 0 && (
              <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {secundariosActivos}
              </span>
            )}
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl">
            <SheetHeader>
              <SheetTitle>Filtros</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-4 px-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">WhatsApp</label>
                <Input
                  defaultValue={whatsapp}
                  onChange={(e) => setParam("whatsapp", e.target.value)}
                  placeholder="Buscar por WhatsApp..."
                  className="h-11"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Barrio</label>
                <Select
                  items={barrioItems}
                  value={barrioId || "TODOS"}
                  onValueChange={(v) => setParam("barrioId", v === "TODOS" ? null : v)}
                >
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos</SelectItem>
                    {barrios.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Tipo de viaje</label>
                <Select
                  items={tipoItems}
                  value={tipoViaje || "TODOS"}
                  onValueChange={(v) => setParam("tipoViaje", v === "TODOS" ? null : v)}
                >
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos</SelectItem>
                    <SelectItem value="IDA">Solo ida</SelectItem>
                    <SelectItem value="VUELTA">Solo vuelta</SelectItem>
                    <SelectItem value="IDA_VUELTA">Ida y vuelta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Estado de pago</label>
                <Select
                  items={pagoItems}
                  value={estadoPago || "TODOS"}
                  onValueChange={(v) => setParam("estadoPago", v === "TODOS" ? null : v)}
                >
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos</SelectItem>
                    <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                    <SelectItem value="PARCIAL">Parcial</SelectItem>
                    <SelectItem value="PAGADO">Pagado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <SheetFooter>
              <SheetClose render={<Button className="h-11" />}>Ver resultados</SheetClose>
              <Button
                variant="ghost"
                onClick={() => {
                  setParam("whatsapp", null);
                  setParam("barrioId", null);
                  setParam("tipoViaje", null);
                  setParam("estadoPago", null);
                }}
              >
                Limpiar filtros
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
      <div className="flex gap-1.5">
        {[
          { v: "", label: "Todos" },
          { v: "ACTIVO", label: "Activos" },
          { v: "INACTIVO", label: "Inactivos" },
        ].map((opt) => (
          <Button
            key={opt.v}
            size="sm"
            variant={estado === opt.v ? "default" : "outline"}
            className={cn("rounded-full h-8")}
            onClick={() => setParam("estado", opt.v || null)}
          >
            {opt.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
