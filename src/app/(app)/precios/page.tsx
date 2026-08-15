import { obtenerTarifaActiva, listarPaquetes } from "@/lib/actions/tarifas";
import { PreciosManager } from "@/components/precios/precios-manager";

export default async function PreciosPage() {
  const [tarifa, paquetes] = await Promise.all([obtenerTarifaActiva(), listarPaquetes()]);

  return <PreciosManager tarifa={tarifa} paquetes={paquetes} />;
}
