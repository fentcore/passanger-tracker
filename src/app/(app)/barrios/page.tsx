import { listarBarrios } from "@/lib/actions/barrios";
import { BarriosManager } from "@/components/barrios/barrios-manager";
import { requireUsuario } from "@/lib/auth-helpers";

export default async function BarriosPage() {
  await requireUsuario();
  const barrios = await listarBarrios(false);

  return <BarriosManager barrios={barrios} />;
}
