"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, Users2, AlertTriangle, LayoutList, LayoutGrid } from "lucide-react";
import { DIA_LABEL_CORTO, DIAS_SEMANA, DiaSemana } from "@/lib/constants";
import { nivelAlertaTramos, NIVEL_ALERTA_COLOR, NIVEL_ALERTA_LABEL, ConfigAlertas } from "@/lib/alertas";
import { cn } from "@/lib/utils";

type PasajeroListado = {
  id: string;
  nombre: string;
  whatsapp: string | null;
  estado: "ACTIVO" | "INACTIVO";
  tramos: number;
  servicios: { diaSemana: string; estado: string }[];
};

export function PasajerosManager({
  pasajeros,
  configAlertas,
}: {
  pasajeros: PasajeroListado[];
  configAlertas: ConfigAlertas;
}) {
  const [vista, setVista] = useState<"lista" | "grilla">("lista");

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {pasajeros.length} pasajero{pasajeros.length === 1 ? "" : "s"}
        </p>
        <div className="flex items-center gap-1 rounded-full border p-0.5">
          <Button
            type="button"
            size="icon"
            variant={vista === "lista" ? "default" : "ghost"}
            className="size-8 rounded-full"
            onClick={() => setVista("lista")}
            aria-label="Vista de lista"
          >
            <LayoutList className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant={vista === "grilla" ? "default" : "ghost"}
            className="size-8 rounded-full"
            onClick={() => setVista("grilla")}
            aria-label="Vista de grilla"
          >
            <LayoutGrid className="size-4" />
          </Button>
        </div>
      </div>

      {pasajeros.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
          <Users2 className="size-10" />
          <p className="font-medium">No se encontraron pasajeros</p>
        </div>
      ) : (
        <div className={vista === "lista" ? "flex flex-col gap-2.5" : "grid grid-cols-2 items-start gap-2.5"}>
          {pasajeros.map((p) => {
            const dias = [...p.servicios]
              .sort(
                (a, b) =>
                  DIAS_SEMANA.indexOf(a.diaSemana as DiaSemana) -
                  DIAS_SEMANA.indexOf(b.diaSemana as DiaSemana)
              )
              .map((s) => DIA_LABEL_CORTO[s.diaSemana as DiaSemana]);

            const serviciosActivos = p.servicios.filter((s) => s.estado !== "INACTIVO");
            const minTramos = serviciosActivos.length > 0 ? p.tramos : null;
            const nivel =
              minTramos != null ? nivelAlertaTramos(minTramos, configAlertas) : "normal";

            if (vista === "grilla") {
              return (
                <Link
                  key={p.id}
                  href={`/pasajeros/${p.id}`}
                  className="flex flex-col gap-1.5 rounded-2xl border bg-card p-3 shadow-sm active:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <p className="font-semibold text-sm leading-tight line-clamp-2">{p.nombre}</p>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "shrink-0 text-[10px] px-1.5 py-0",
                        p.estado === "ACTIVO"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {p.estado === "ACTIVO" ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                  {p.whatsapp && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                      <MessageCircle className="size-3 shrink-0" />
                      {p.whatsapp}
                    </span>
                  )}
                  {dias.length > 0 && (
                    <span className="text-xs text-muted-foreground truncate">{dias.join(" · ")}</span>
                  )}
                  {nivel !== "normal" && (
                    <span
                      className={`flex items-center gap-1 self-start rounded-full px-2 py-0.5 text-[10px] font-medium ${NIVEL_ALERTA_COLOR[nivel]}`}
                    >
                      <AlertTriangle className="size-3" />
                      {NIVEL_ALERTA_LABEL[nivel]} ({minTramos})
                    </span>
                  )}
                </Link>
              );
            }

            return (
              <Link
                key={p.id}
                href={`/pasajeros/${p.id}`}
                className="flex items-center justify-between gap-3 rounded-2xl border bg-card p-4 shadow-sm active:bg-accent/50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-semibold truncate">{p.nombre}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {p.whatsapp && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MessageCircle className="size-3" />
                        {p.whatsapp}
                      </span>
                    )}
                    {dias.length > 0 && (
                      <span className="text-xs text-muted-foreground">{dias.join(" · ")}</span>
                    )}
                    {nivel !== "normal" && (
                      <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${NIVEL_ALERTA_COLOR[nivel]}`}>
                        <AlertTriangle className="size-3" />
                        {NIVEL_ALERTA_LABEL[nivel]} ({minTramos})
                      </span>
                    )}
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className={
                    p.estado === "ACTIVO"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                      : "bg-muted text-muted-foreground"
                  }
                >
                  {p.estado === "ACTIVO" ? "Activo" : "Inactivo"}
                </Badge>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
