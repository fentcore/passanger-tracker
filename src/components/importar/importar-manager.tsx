"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, Upload } from "lucide-react";
import {
  parsearTextoTramos,
  emparejarConDatos,
  filaEsValida,
  FilaImportada,
} from "@/lib/importar-tramos";
import { importarTramosMasivo } from "@/lib/actions/importar";
import { DIA_LABEL, TIPO_VIAJE_LABEL } from "@/lib/constants";
import { toast } from "sonner";

type Pasajero = { id: string; nombre: string };
type Barrio = { id: string; nombre: string };

const EJEMPLO = `María Gómez\tMartes\tVistas\tIda y vuelta\t08:20\t16:40\t2
María Gómez\tJueves\tVistas\tIda\t08:20\t\t1
Juan Pérez\tMartes\tPuertos\tIda y vuelta\t08:00\t16:00\t1`;

export function ImportarManager({
  pasajeros,
  barrios,
}: {
  pasajeros: Pasajero[];
  barrios: Barrio[];
}) {
  const router = useRouter();
  const [texto, setTexto] = useState("");
  const [filas, setFilas] = useState<FilaImportada[] | null>(null);
  const [pending, startTransition] = useTransition();

  function handleAnalizar() {
    const parseadas = parsearTextoTramos(texto);
    const emparejadas = emparejarConDatos(parseadas, pasajeros, barrios);
    setFilas(emparejadas);
  }

  const validas = filas?.filter(filaEsValida) ?? [];

  function handleImportar() {
    if (validas.length === 0) return;
    startTransition(async () => {
      try {
        await importarTramosMasivo(
          validas.map((f) => ({
            pasajeroId: f.pasajeroId!,
            diaSemana: f.diaSemana!,
            barrioId: f.barrioId,
            tipoViaje: f.tipoViaje,
            horaIda: f.horaIda,
            horaVuelta: f.horaVuelta,
            cantidadTramos: f.cantidadTramos,
          }))
        );
        toast.success(`${validas.length} tramo(s) importado(s)`);
        setTexto("");
        setFilas(null);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo importar");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold">Importar tramos</h1>
        <p className="text-sm text-muted-foreground">
          Pegá varias filas y cargalas todas juntas
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">1. Pegá los datos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-xs text-muted-foreground">
            Una fila por tramo, columnas separadas por tabulación (pegado desde Excel/Sheets)
            o coma: <span className="font-mono">Pasajero, Día, Barrio, Tipo, Hora ida, Hora vuelta, Tramos</span>.
            El pasajero tiene que existir ya en la app.
          </p>
          <Textarea
            className="min-h-[160px] font-mono text-xs"
            placeholder={EJEMPLO}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />
          <div className="flex gap-2">
            <Button variant="outline" className="h-10" onClick={() => setTexto(EJEMPLO)}>
              Usar ejemplo
            </Button>
            <Button className="h-10" disabled={!texto.trim()} onClick={handleAnalizar}>
              Analizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {filas && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              2. Verificá antes de guardar ({validas.length} de {filas.length} listas)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <div className="overflow-x-auto">
              <div className="flex flex-col gap-2 min-w-[500px]">
                {filas.map((f) => {
                  const ok = filaEsValida(f);
                  return (
                    <div
                      key={f.linea}
                      className={`rounded-lg border p-2.5 text-sm ${
                        ok ? "border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30" : "border-red-200 bg-red-50 dark:bg-red-950/30"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {ok ? (
                          <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertCircle className="size-4 text-red-600 shrink-0" />
                        )}
                        <span className="font-medium">
                          {f.nombrePasajero || "(sin nombre)"} · {f.diaSemana ? DIA_LABEL[f.diaSemana] : "(día inválido)"}
                        </span>
                        {ok && (
                          <Badge variant="secondary" className="ml-auto font-normal">
                            {TIPO_VIAJE_LABEL[f.tipoViaje]}
                          </Badge>
                        )}
                      </div>
                      {ok && (
                        <p className="mt-1 text-xs text-muted-foreground pl-6">
                          {f.horaIda && `Ida ${f.horaIda}`} {f.horaVuelta && `· Vuelta ${f.horaVuelta}`} ·{" "}
                          {f.cantidadTramos} tramo{f.cantidadTramos === 1 ? "" : "s"}
                          {f.barrioNombre && !f.barrioId ? " · sin barrio (no encontrado)" : ""}
                        </p>
                      )}
                      {f.errores.length > 0 && (
                        <ul className="mt-1 list-disc pl-10 text-xs text-red-700 dark:text-red-400">
                          {f.errores.map((e, i) => (
                            <li key={i}>{e}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <Button
              className="h-12 mt-2 gap-2"
              disabled={pending || validas.length === 0}
              onClick={handleImportar}
            >
              <Upload className="size-4" />
              Importar {validas.length} tramo{validas.length === 1 ? "" : "s"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
