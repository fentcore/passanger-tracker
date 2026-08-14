import { listarBarrios } from "@/lib/actions/barrios";
import { PasajeroFormNuevo } from "@/components/pasajeros/pasajero-form-nuevo";
import { requireUsuario } from "@/lib/auth-helpers";

export default async function NuevoPasajeroPage() {
  await requireUsuario();
  const barrios = await listarBarrios(true);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold">Nuevo pasajero</h1>
        <p className="text-sm text-muted-foreground">
          Cargá los datos y los días de viaje. Después vas a poder editar todo.
        </p>
      </div>
      <PasajeroFormNuevo barrios={barrios} />
    </div>
  );
}
