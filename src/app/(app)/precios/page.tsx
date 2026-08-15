import { obtenerTarifaActiva, listarHistorialPrecios, listarPaquetes } from "@/lib/actions/tarifas";
import { PreciosManager } from "@/components/precios/precios-manager";

export default async function PreciosPage() {
  const [tarifa, historial, paquetes] = await Promise.all([
    obtenerTarifaActiva(),
    listarHistorialPrecios(),
    listarPaquetes(),
  ]);

  return <PreciosManager tarifa={tarifa} historial={historial} paquetes={paquetes} />;
}
