"use client";

import dynamic from "next/dynamic";

const MapaView = dynamic(() => import("@/components/mapa/mapa-view").then((m) => m.MapaView), {
  ssr: false,
  loading: () => (
    <div className="flex h-[50vh] min-h-[320px] items-center justify-center rounded-2xl border text-sm text-muted-foreground">
      Cargando mapa...
    </div>
  ),
});

type Props = React.ComponentProps<typeof MapaView>;

export function MapaLoader(props: Props) {
  return <MapaView {...props} />;
}
