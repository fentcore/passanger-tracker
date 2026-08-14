import { listarBarrios } from "@/lib/actions/barrios";
import { listarPuntosRuta, listarRecorridos } from "@/lib/actions/mapa";
import { MapaLoader } from "@/components/mapa/mapa-loader";

export default async function MapaPage() {
  const [barrios, puntos, recorridos] = await Promise.all([
    listarBarrios(false),
    listarPuntosRuta(),
    listarRecorridos(),
  ]);

  return <MapaLoader barrios={barrios} puntos={puntos} recorridos={recorridos} />;
}
