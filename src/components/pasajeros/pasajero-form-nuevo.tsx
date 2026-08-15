"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, X, Users } from "lucide-react";
import { DIAS_SEMANA, DIA_LABEL_CORTO, DiaSemana } from "@/lib/constants";
import { ServicioFields } from "@/components/pasajeros/servicio-fields";
import {
  PasajeroDraft,
  pasajeroDraftVacio,
  ServicioDraft,
  servicioDraftVacio,
} from "@/components/pasajeros/types";
import { crearPasajeroConServicios } from "@/lib/actions/pasajeros";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Barrio = { id: string; nombre: string };

export function PasajeroFormNuevo({ barrios }: { barrios: Barrio[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [pasajero, setPasajero] = useState<PasajeroDraft>(pasajeroDraftVacio());
  const [dias, setDias] = useState<Record<DiaSemana, ServicioDraft | null>>(
    () =>
      Object.fromEntries(DIAS_SEMANA.map((d) => [d, null])) as Record<
        DiaSemana,
        ServicioDraft | null
      >
  );
  const [tabActivo, setTabActivo] = useState<DiaSemana | null>(null);
  const [tramosIniciales, setTramosIniciales] = useState("");
  const [otrosPasajeros, setOtrosPasajeros] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const diasSeleccionados = DIAS_SEMANA.filter((d) => dias[d] !== null);

  function toggleDia(dia: DiaSemana, checked: boolean) {
    setDias((prev) => {
      const next = { ...prev, [dia]: checked ? servicioDraftVacio(dia) : null };
      return next;
    });
    if (checked) setTabActivo(dia);
    else if (tabActivo === dia) setTabActivo(null);
  }

  function actualizarServicio(dia: DiaSemana, v: ServicioDraft) {
    setDias((prev) => ({ ...prev, [dia]: v }));
  }

  function setPasajeroField<K extends keyof PasajeroDraft>(key: K, v: PasajeroDraft[K]) {
    setPasajero((prev) => ({ ...prev, [key]: v }));
  }

  function handleSubmit() {
    setError(null);
    if (!pasajero.nombre.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    if (diasSeleccionados.length === 0) {
      setError("Seleccioná al menos un día de viaje");
      return;
    }

    const servicios = diasSeleccionados.map((d) => {
      const s = dias[d]!;
      return {
        diaSemana: s.diaSemana,
        tipoViaje: s.tipoViaje,
        horaIda: s.horaIda,
        horaVuelta: s.horaVuelta,
        barrioId: s.barrioId,
        direccion: s.direccion,
        destino: s.destino,
        estado: s.estado,
        fechaInicio: s.fechaInicio,
        fechaFin: s.fechaFin,
        montoAbonado: s.montoAbonado === "" ? undefined : Number(s.montoAbonado),
        estadoPago: s.estadoPago,
        metodoPago: s.metodoPago,
        montoPendiente: s.montoPendiente === "" ? undefined : Number(s.montoPendiente),
        notasPago: s.notasPago,
        notas: s.notas,
      };
    });

    startTransition(async () => {
      try {
        const creado = await crearPasajeroConServicios({
          pasajero,
          servicios,
          tramos: tramosIniciales === "" ? 0 : Number(tramosIniciales),
          otrosPasajeros: otrosPasajeros.map((n) => n.trim()).filter(Boolean),
        });
        toast.success("Pasajero creado");
        router.push(`/pasajeros/${creado.id}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo crear el pasajero");
      }
    });
  }

  function agregarOtroPasajero() {
    setOtrosPasajeros((prev) => [...prev, ""]);
  }

  function actualizarOtroPasajero(i: number, valor: string) {
    setOtrosPasajeros((prev) => prev.map((v, idx) => (idx === i ? valor : v)));
  }

  function quitarOtroPasajero(i: number) {
    setOtrosPasajeros((prev) => prev.filter((_, idx) => idx !== i));
  }

  return (
    <div className="flex flex-col gap-4 pb-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del pasajero</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Nombre y apellido *</Label>
            <Input
              className="h-11"
              value={pasajero.nombre}
              onChange={(e) => setPasajeroField("nombre", e.target.value)}
              placeholder="María Gómez"
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>WhatsApp</Label>
            <Input
              className="h-11"
              value={pasajero.whatsapp}
              onChange={(e) => setPasajeroField("whatsapp", e.target.value)}
              inputMode="tel"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Email</Label>
            <Input
              className="h-11"
              type="email"
              value={pasajero.email}
              onChange={(e) => setPasajeroField("email", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Información adicional de contacto</Label>
            <Input
              className="h-11"
              value={pasajero.contactoExtra}
              onChange={(e) => setPasajeroField("contactoExtra", e.target.value)}
              placeholder="Opcional"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Empleador</Label>
            <Input
              className="h-11"
              value={pasajero.empleador}
              onChange={(e) => setPasajeroField("empleador", e.target.value)}
              placeholder="Opcional"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Notas generales</Label>
            <Textarea
              value={pasajero.notasGenerales}
              onChange={(e) => setPasajeroField("notasGenerales", e.target.value)}
              placeholder="Opcional"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tramos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Tramos iniciales</Label>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              className="h-11"
              value={tramosIniciales}
              onChange={(e) => setTramosIniciales(e.target.value)}
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground">
              Los tramos son compartidos entre todos los días de viaje del pasajero (y entre los
              pasajeros de abajo, si agregás alguno).
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5">
                <Users className="size-4" />
                Otros pasajeros de este contacto
              </Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 rounded-full gap-1"
                onClick={agregarOtroPasajero}
              >
                <Plus className="size-3.5" />
                Agregar
              </Button>
            </div>
            {otrosPasajeros.length > 0 && (
              <div className="flex flex-col gap-2">
                {otrosPasajeros.map((nombre, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      className="h-11"
                      value={nombre}
                      onChange={(e) => actualizarOtroPasajero(i, e.target.value)}
                      placeholder="Nombre y apellido"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-9 shrink-0 text-destructive"
                      onClick={() => quitarOtroPasajero(i)}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">
                  Van a compartir el WhatsApp, email y tramos con {pasajero.nombre || "este contacto"}.
                  Podés cargarles sus días de viaje después, desde su propia ficha.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Días de viaje</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
            {DIAS_SEMANA.map((d) => (
              <label
                key={d}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border p-2.5 cursor-pointer select-none transition-colors",
                  dias[d] ? "border-primary bg-primary/5" : "border-border"
                )}
              >
                <Checkbox
                  checked={!!dias[d]}
                  onCheckedChange={(checked) => toggleDia(d, checked === true)}
                />
                <span className="text-xs font-medium">{DIA_LABEL_CORTO[d]}</span>
              </label>
            ))}
          </div>

          {diasSeleccionados.length > 0 && (
            <Tabs
              value={tabActivo ?? diasSeleccionados[0]}
              onValueChange={(v) => setTabActivo(v as DiaSemana)}
            >
              <TabsList className="w-full flex-wrap h-auto">
                {diasSeleccionados.map((d) => (
                  <TabsTrigger key={d} value={d} className="flex-1">
                    {DIA_LABEL_CORTO[d]}
                  </TabsTrigger>
                ))}
              </TabsList>
              {diasSeleccionados.map((d) => (
                <TabsContent key={d} value={d} className="pt-2">
                  <ServicioFields
                    value={dias[d]!}
                    onChange={(v) => actualizarServicio(d, v)}
                    barrios={barrios}
                  />
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive text-center">{error}</p>}

      <Button className="h-12 text-base" disabled={pending} onClick={handleSubmit}>
        {pending ? "Guardando..." : "Guardar pasajero"}
      </Button>
    </div>
  );
}
