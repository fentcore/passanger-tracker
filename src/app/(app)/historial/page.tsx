import { listarHistorial } from "@/lib/actions/historial";
import { HistorialViewer } from "@/components/historial/historial-viewer";

export default async function HistorialPage() {
  const items = await listarHistorial();
  return <HistorialViewer items={items} />;
}
