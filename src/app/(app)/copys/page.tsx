import { listarCopys, listarCategoriasCopy } from "@/lib/actions/copys";
import { CopysManager } from "@/components/copys/copys-manager";

export default async function CopysPage() {
  const [copys, categorias] = await Promise.all([
    listarCopys(),
    listarCategoriasCopy(),
  ]);

  return <CopysManager copys={copys} categorias={categorias} />;
}
