import { listarPasajerosArchivados } from "@/lib/actions/pasajeros";
import { listarServiciosArchivados } from "@/lib/actions/servicios";
import { ArchivadosManager } from "@/components/archivados/archivados-manager";

export default async function ArchivadosPage() {
  const [pasajeros, servicios] = await Promise.all([
    listarPasajerosArchivados(),
    listarServiciosArchivados(),
  ]);

  return <ArchivadosManager pasajeros={pasajeros} servicios={servicios} />;
}
