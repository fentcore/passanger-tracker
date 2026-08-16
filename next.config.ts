import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Sin esto, el router del cliente puede seguir mostrando una versión en caché
    // de una página dinámica ya visitada (ej. /pasajeros/nuevo) aunque el servidor
    // ya tenga datos nuevos (ej. un barrio recién creado) vía revalidatePath.
    staleTimes: {
      dynamic: 0,
    },
    // Las imágenes de los copys viajan como data URL (base64) en el body de
    // la server action; el límite por defecto (1mb) se queda corto.
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
