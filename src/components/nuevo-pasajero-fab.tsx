import Link from "next/link";
import { Plus } from "lucide-react";

export function NuevoPasajeroFab() {
  return (
    <Link
      href="/pasajeros/nuevo"
      className="fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full bg-primary text-primary-foreground shadow-lg px-5 py-3.5 font-medium active:scale-95 transition-transform md:bottom-8 md:right-8"
    >
      <Plus className="size-5" />
      <span className="hidden sm:inline">Nuevo pasajero</span>
    </Link>
  );
}
