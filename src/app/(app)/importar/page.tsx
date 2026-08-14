import { listarPasajeros } from "@/lib/actions/pasajeros";
import { listarBarrios } from "@/lib/actions/barrios";
import { ImportarManager } from "@/components/importar/importar-manager";

export default async function ImportarPage() {
  const [pasajeros, barrios] = await Promise.all([
    listarPasajeros(),
    listarBarrios(true),
  ]);

  return (
    <ImportarManager
      pasajeros={pasajeros.map((p) => ({ id: p.id, nombre: p.nombre }))}
      barrios={barrios}
    />
  );
}
