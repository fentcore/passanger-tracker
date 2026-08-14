import { notFound } from "next/navigation";
import { obtenerPasajero } from "@/lib/actions/pasajeros";
import { listarBarrios } from "@/lib/actions/barrios";
import { PasajeroDetail } from "@/components/pasajeros/pasajero-detail";

export default async function PasajeroDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [pasajero, barrios] = await Promise.all([
    obtenerPasajero(id),
    listarBarrios(true),
  ]);

  if (!pasajero) notFound();

  return (
    <PasajeroDetail
      pasajero={pasajero as never}
      barrios={barrios}
    />
  );
}
