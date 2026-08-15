import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Sin esto, el router del cliente puede seguir mostrando una versión en caché
    // de una página dinámica ya visitada (ej. /pasajeros/nuevo) aunque el servidor
    // ya tenga datos nuevos (ej. un barrio recién creado) vía revalidatePath.
    staleTimes: {
      dynamic: 0,
    },
  },
};

export default nextConfig;
