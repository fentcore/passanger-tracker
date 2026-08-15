export type LatLng = { lat: number; lng: number };

const RADIO_TIERRA_KM = 6371;

export function distanciaKm(a: LatLng, b: LatLng): number {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return RADIO_TIERRA_KM * c;
}

export function distanciaTotalKm(puntos: LatLng[]): number {
  let total = 0;
  for (let i = 0; i < puntos.length - 1; i++) {
    total += distanciaKm(puntos[i], puntos[i + 1]);
  }
  return Math.round(total * 100) / 100;
}

const VELOCIDAD_PROMEDIO_KMH = 28;

export function duracionEstimadaMin(km: number): number {
  return Math.max(1, Math.round((km / VELOCIDAD_PROMEDIO_KMH) * 60));
}

export type RutaCallejera = { coords: LatLng[]; distanciaKm: number; duracionMin: number };

// Usa el servidor demo público de OSRM (sin API key). Si no responde, quien llame
// debe hacer fallback a la línea recta (distanciaTotalKm/duracionEstimadaMin).
export async function rutaCallejera(puntos: LatLng[]): Promise<RutaCallejera | null> {
  if (puntos.length < 2) return null;
  try {
    const coordsStr = puntos.map((p) => `${p.lng},${p.lat}`).join(";");
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const ruta = data?.routes?.[0];
    if (!ruta) return null;
    const coords: LatLng[] = ruta.geometry.coordinates.map(([lng, lat]: [number, number]) => ({
      lat,
      lng,
    }));
    return {
      coords,
      distanciaKm: Math.round((ruta.distance / 1000) * 100) / 100,
      duracionMin: Math.max(1, Math.round(ruta.duration / 60)),
    };
  } catch {
    return null;
  }
}
