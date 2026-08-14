"use client";

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
import { Minus, Plus } from "lucide-react";
import { ServicioDraft } from "@/components/pasajeros/types";
import {
  TIPO_VIAJE_LABEL,
  ESTADO_SERVICIO_LABEL,
  ESTADO_PAGO_LABEL,
} from "@/lib/constants";

type Barrio = { id: string; nombre: string };

export function ServicioFields({
  value,
  onChange,
  barrios,
}: {
  value: ServicioDraft;
  onChange: (v: ServicioDraft) => void;
  barrios: Barrio[];
}) {
  function set<K extends keyof ServicioDraft>(key: K, v: ServicioDraft[K]) {
    onChange({ ...value, [key]: v });
  }

  const mostrarIda = value.tipoViaje !== "VUELTA";
  const mostrarVuelta = value.tipoViaje !== "IDA";

  const barrioItems = {
    NINGUNO: "Sin especificar",
    ...Object.fromEntries(barrios.map((b) => [b.id, b.nombre])),
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label>Tipo de viaje</Label>
        <Select
          items={TIPO_VIAJE_LABEL}
          value={value.tipoViaje}
          onValueChange={(v) => set("tipoViaje", v as ServicioDraft["tipoViaje"])}
        >
          <SelectTrigger className="h-11 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="IDA">Solo ida</SelectItem>
            <SelectItem value="VUELTA">Solo vuelta</SelectItem>
            <SelectItem value="IDA_VUELTA">Ida y vuelta</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {mostrarIda && (
          <div className="flex flex-col gap-1.5">
            <Label>Hora de ida</Label>
            <Input
              type="time"
              className="h-11"
              value={value.horaIda}
              onChange={(e) => set("horaIda", e.target.value)}
            />
          </div>
        )}
        {mostrarVuelta && (
          <div className="flex flex-col gap-1.5">
            <Label>Hora de vuelta</Label>
            <Input
              type="time"
              className="h-11"
              value={value.horaVuelta}
              onChange={(e) => set("horaVuelta", e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Barrio</Label>
        <Select
          items={barrioItems}
          value={value.barrioId || "NINGUNO"}
          onValueChange={(v) => set("barrioId", !v || v === "NINGUNO" ? "" : v)}
        >
          <SelectTrigger className="h-11 w-full">
            <SelectValue placeholder="Seleccionar barrio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NINGUNO">Sin especificar</SelectItem>
            {barrios.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Dirección / punto de recogida</Label>
          <Input
            value={value.direccion}
            onChange={(e) => set("direccion", e.target.value)}
            placeholder="Opcional"
            className="h-11"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Destino</Label>
          <Input
            value={value.destino}
            onChange={(e) => set("destino", e.target.value)}
            placeholder="Opcional"
            className="h-11"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Tramos</Label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="size-11 rounded-full"
            disabled={value.cantidadTramos <= 0}
            onClick={() => set("cantidadTramos", Math.max(0, value.cantidadTramos - 1))}
          >
            <Minus className="size-4" />
          </Button>
          <span className="w-10 text-center text-lg font-bold tabular-nums">
            {value.cantidadTramos}
          </span>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="size-11 rounded-full"
            onClick={() => set("cantidadTramos", value.cantidadTramos + 1)}
          >
            <Plus className="size-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Estado del servicio</Label>
        <Select items={ESTADO_SERVICIO_LABEL} value={value.estado} onValueChange={(v) => v && set("estado", v)}>
          <SelectTrigger className="h-11 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ACTIVO">Activo</SelectItem>
            <SelectItem value="INACTIVO">Inactivo</SelectItem>
            <SelectItem value="CONFIRMADO">Confirmado</SelectItem>
            <SelectItem value="PENDIENTE">Pendiente</SelectItem>
            <SelectItem value="CANCELADO">Cancelado</SelectItem>
            <SelectItem value="REALIZADO">Realizado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Fecha de inicio</Label>
          <Input
            type="date"
            className="h-11"
            value={value.fechaInicio}
            onChange={(e) => set("fechaInicio", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Fecha de finalización</Label>
          <Input
            type="date"
            className="h-11"
            value={value.fechaFin}
            onChange={(e) => set("fechaFin", e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-xl border p-3 flex flex-col gap-3 bg-muted/30">
        <p className="text-sm font-semibold">Pago</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Monto abonado</Label>
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              className="h-11"
              value={value.montoAbonado}
              onChange={(e) => set("montoAbonado", e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Estado de pago</Label>
            <Select items={ESTADO_PAGO_LABEL} value={value.estadoPago} onValueChange={(v) => v && set("estadoPago", v)}>
              <SelectTrigger className="h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                <SelectItem value="PARCIAL">Parcial</SelectItem>
                <SelectItem value="PAGADO">Pagado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Método de pago</Label>
            <Input
              value={value.metodoPago}
              onChange={(e) => set("metodoPago", e.target.value)}
              placeholder="Efectivo, transferencia..."
              className="h-11"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Monto pendiente</Label>
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              className="h-11"
              value={value.montoPendiente}
              onChange={(e) => set("montoPendiente", e.target.value)}
              placeholder="0"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Notas de pago</Label>
          <Textarea
            value={value.notasPago}
            onChange={(e) => set("notasPago", e.target.value)}
            placeholder="Opcional"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Notas del servicio</Label>
        <Textarea
          value={value.notas}
          onChange={(e) => set("notas", e.target.value)}
          placeholder="Opcional"
        />
      </div>
    </div>
  );
}
