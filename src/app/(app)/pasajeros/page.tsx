import { listarPasajeros } from "@/lib/actions/pasajeros";
import { listarBarrios } from "@/lib/actions/barrios";
import { obtenerConfigAlertas } from "@/lib/actions/alertas";
import { ListaFiltros } from "@/components/pasajeros/lista-filtros";
import { PasajerosManager } from "@/components/pasajeros/pasajeros-manager";
import { NuevoPasajeroFab } from "@/components/nuevo-pasajero-fab";

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
      </div>

      <ListaFiltros barrios={barrios} />

      <PasajerosManager pasajeros={pasajeros} configAlertas={configAlertas} />

      <NuevoPasajeroFab />
    </div>
  );
}
