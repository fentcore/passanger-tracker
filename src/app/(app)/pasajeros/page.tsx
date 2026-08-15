import Link from "next/link";
import { listarPasajeros } from "@/lib/actions/pasajeros";
import { listarBarrios } from "@/lib/actions/barrios";
import { obtenerConfigAlertas } from "@/lib/actions/alertas";
import { ListaFiltros } from "@/components/pasajeros/lista-filtros";
import { NuevoPasajeroFab } from "@/components/nuevo-pasajero-fab";
import { Badge } from "@/components/ui/badge";
import { DIA_LABEL_CORTO, DIAS_SEMANA, DiaSemana } from "@/lib/constants";
import { MessageCircle, Users2, AlertTriangle } from "lucide-react";
import { nivelAlertaTramos, NIVEL_ALERTA_COLOR, NIVEL_ALERTA_LABEL } from "@/lib/alertas";

export default async function PasajerosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const [pasajeros, configAlertas, barrios] = await Promise.all([
    listarPasajeros({
      busqueda: sp.q,
      estado: sp.estado === "ACTIVO" || sp.estado === "INACTIVO" ? sp.estado : undefined,
      whatsapp: sp.whatsapp,
      barrioId: sp.barrioId,
      tipoViaje: sp.tipoViaje,
      estadoPago: sp.estadoPago,
    }),
    obtenerConfigAlertas(),
    listarBarrios(true),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold">Pasajeros</h1>
        <p className="text-sm text-muted-foreground">
          {pasajeros.length} pasajero{pasajeros.length === 1 ? "" : "s"}
        </p>
      </div>

      <ListaFiltros barrios={barrios} />

      {pasajeros.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
          <Users2 className="size-10" />
          <p className="font-medium">No se encontraron pasajeros</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
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
                      <span className="text-xs text-muted-foreground">
                        {dias.join(" · ")}
                      </span>
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

      <NuevoPasajeroFab />
    </div>
  );
}
