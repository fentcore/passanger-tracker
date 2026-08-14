import { prisma } from "@/lib/prisma";
import { requireUsuario } from "@/lib/auth-helpers";
import { listarBarrios } from "@/lib/actions/barrios";
import { obtenerConfigAlertas } from "@/lib/actions/alertas";
import { Filtros } from "@/components/agenda/filtros";
import { ServicioCard, ServicioCardData } from "@/components/agenda/servicio-card";
import { DIAS_SEMANA, DIA_LABEL, DiaSemana, diaDeHoy } from "@/lib/constants";
import { horaDeOrden } from "@/lib/utils-servicio";
import { CalendarX2, AlertTriangle } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { NuevoPasajeroFab } from "@/components/nuevo-pasajero-fab";
import Link from "next/link";

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireUsuario();
  const sp = await searchParams;

  const dia = sp.dia ?? diaDeHoy();
  const barrioId = sp.barrio;
  const pasajeroQ = sp.pasajero;
  const estado = sp.estado;
  const tipo = sp.tipo;
  const orden = (sp.orden === "vuelta" ? "vuelta" : "ida") as "ida" | "vuelta";

  const where: Prisma.ServicioWhereInput = {
    archivedAt: null,
    ...(dia !== "TODOS" ? { diaSemana: dia as DiaSemana } : {}),
    ...(barrioId ? { barrioId } : {}),
    ...(estado ? { estado: estado as never } : {}),
    ...(tipo ? { tipoViaje: tipo as never } : {}),
    pasajero: {
      estado: "ACTIVO",
      archivedAt: null,
      ...(pasajeroQ ? { nombre: { contains: pasajeroQ } } : {}),
    },
  };

  const [servicios, barrios, configAlertas] = await Promise.all([
    prisma.servicio.findMany({
      where,
      include: {
        pasajero: { select: { id: true, nombre: true } },
        barrio: { select: { id: true, nombre: true } },
        notasRel: {
          include: { creador: true, revisor: true },
          orderBy: { creadaEn: "desc" },
        },
      },
    }),
    listarBarrios(true),
    obtenerConfigAlertas(),
  ]);

  const pasajerosConAlerta = await prisma.pasajero.count({
    where: {
      estado: "ACTIVO",
      archivedAt: null,
      servicios: {
        some: { estado: { not: "INACTIVO" }, cantidadTramos: { lte: configAlertas.alerta } },
      },
    },
  });

  servicios.sort((a, b) => {
    if (dia === "TODOS") {
      const diffDia = DIAS_SEMANA.indexOf(a.diaSemana) - DIAS_SEMANA.indexOf(b.diaSemana);
      if (diffDia !== 0) return diffDia;
    }
    const ha = horaDeOrden(a.horaIda, a.horaVuelta, orden);
    const hb = horaDeOrden(b.horaIda, b.horaVuelta, orden);
    return ha.localeCompare(hb);
  });

  const grupos: { dia: DiaSemana; items: typeof servicios }[] =
    dia === "TODOS"
      ? DIAS_SEMANA.map((d) => ({
          dia: d,
          items: servicios.filter((s) => s.diaSemana === d),
        })).filter((g) => g.items.length > 0)
      : [{ dia: dia as DiaSemana, items: servicios }];

  return (
    <div className="flex flex-col gap-4">
      {pasajerosConAlerta > 0 && (
        <Link
          href="/pasajeros"
          className="flex items-center gap-2 rounded-xl bg-orange-100 dark:bg-orange-950 px-3.5 py-2.5 text-sm font-medium text-orange-800 dark:text-orange-300"
        >
          <AlertTriangle className="size-4 shrink-0" />
          {pasajerosConAlerta} pasajero{pasajerosConAlerta === 1 ? "" : "s"} con pocos tramos
          restantes
        </Link>
      )}
      <Filtros barrios={barrios} />

      {servicios.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
          <CalendarX2 className="size-10" />
          <p className="font-medium">No hay servicios para este filtro</p>
          <p className="text-sm">Probá cambiar el día o limpiar los filtros.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {grupos.map((g) => (
            <div key={g.dia} className="flex flex-col gap-2.5">
              {dia === "TODOS" && (
                <h2 className="text-sm font-semibold text-muted-foreground px-1">
                  {DIA_LABEL[g.dia]}
                </h2>
              )}
              <div className="flex flex-col gap-2.5">
                {g.items.map((s) => (
                  <ServicioCard
                    key={s.id}
                    servicio={s as unknown as ServicioCardData}
                    configAlertas={configAlertas}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <NuevoPasajeroFab />
    </div>
  );
}
