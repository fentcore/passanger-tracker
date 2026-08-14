import { obtenerTarifaActiva, listarHistorialPrecios } from "@/lib/actions/tarifas";
import { PreciosManager } from "@/components/precios/precios-manager";

export default async function PreciosPage() {
  const [tarifa, historial] = await Promise.all([
    obtenerTarifaActiva(),
    listarHistorialPrecios(),
  ]);

  return <PreciosManager tarifa={tarifa} historial={historial} />;
}
