"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import {
  DIAS_SEMANA,
  DIA_LABEL_CORTO,
  diaDeHoy,
  TIPO_VIAJE_LABEL,
  ESTADO_SERVICIO_LABEL,
} from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Barrio = { id: string; nombre: string };

export function Filtros({ barrios }: { barrios: Barrio[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const dia = searchParams.get("dia") ?? diaDeHoy();
  const barrioId = searchParams.get("barrio") ?? "";
  const pasajeroQ = searchParams.get("pasajero") ?? "";
  const estado = searchParams.get("estado") ?? "";
  const tipo = searchParams.get("tipo") ?? "";
  const orden = searchParams.get("orden") ?? "ida";

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams]
  );

  const secundariosActivos = [barrioId, pasajeroQ, estado, tipo].filter(
    Boolean
  ).length;

  const barrioItems = {
    TODOS: "Todos los barrios",
    ...Object.fromEntries(barrios.map((b) => [b.id, b.nombre])),
  };
  const tipoItems = { TODOS: "Todos", ...TIPO_VIAJE_LABEL };
  const estadoItems = { TODOS: "Todos", ...ESTADO_SERVICIO_LABEL };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
          <Button
            size="sm"
            variant={dia === diaDeHoy() ? "default" : "outline"}
            className="shrink-0 rounded-full h-9 px-4"
            onClick={() => setParam("dia", diaDeHoy())}
          >
            Hoy
          </Button>
          <Button
            size="sm"
            variant={dia === "TODOS" ? "default" : "outline"}
            className="shrink-0 rounded-full h-9 px-4"
            onClick={() => setParam("dia", "TODOS")}
          >
            Todos
          </Button>
          {DIAS_SEMANA.map((d) => (
            <Button
              key={d}
              size="sm"
              variant={dia === d ? "default" : "outline"}
              className="shrink-0 rounded-full h-9 px-3.5"
              onClick={() => setParam("dia", d)}
            >
              {DIA_LABEL_CORTO[d]}
            </Button>
          ))}
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <Button
                size="icon"
                variant="outline"
                className="relative shrink-0 rounded-full size-9"
              />
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
                <label className="text-sm font-medium">Pasajero</label>
                <Input
                  placeholder="Buscar por nombre..."
                  defaultValue={pasajeroQ}
                  className="h-11"
                  onChange={(e) => setParam("pasajero", e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Barrio</label>
                <Select
                  items={barrioItems}
                  value={barrioId || "TODOS"}
                  onValueChange={(v) => setParam("barrio", v === "TODOS" ? null : v)}
                >
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos los barrios</SelectItem>
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
                  value={tipo || "TODOS"}
                  onValueChange={(v) => setParam("tipo", v === "TODOS" ? null : v)}
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
                <label className="text-sm font-medium">Estado</label>
                <Select
                  items={estadoItems}
                  value={estado || "TODOS"}
                  onValueChange={(v) => setParam("estado", v === "TODOS" ? null : v)}
                >
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos</SelectItem>
                    <SelectItem value="ACTIVO">Activo</SelectItem>
                    <SelectItem value="INACTIVO">Inactivo</SelectItem>
                    <SelectItem value="CONFIRMADO">Confirmado</SelectItem>
                    <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                    <SelectItem value="CANCELADO">Cancelado</SelectItem>
                    <SelectItem value="REALIZADO">Realizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <SheetFooter>
              <SheetClose render={<Button className="h-11" />}>
                Ver resultados
              </SheetClose>
              <Button
                variant="ghost"
                onClick={() => {
                  setParam("barrio", null);
                  setParam("pasajero", null);
                  setParam("estado", null);
                  setParam("tipo", null);
                }}
              >
                Limpiar filtros
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        <Button
          size="icon"
          variant="outline"
          className={cn("shrink-0 rounded-full size-9", orden === "vuelta" && "text-primary border-primary")}
          onClick={() => setParam("orden", orden === "ida" ? "vuelta" : "ida")}
          title={orden === "ida" ? "Ordenando por hora de ida" : "Ordenando por hora de vuelta"}
        >
          <ArrowUpDown className="size-4" />
        </Button>
      </div>
    </div>
  );
}
