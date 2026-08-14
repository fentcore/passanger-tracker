import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

const USUARIOS_INICIALES = [
  { email: "fentwave@gmail.com", nombre: "Administrador", rol: "ADMIN" as const },
  { email: "camilavitale9@gmail.com", nombre: "Asistente", rol: "ASISTENTE" as const },
];

async function main() {
  const admin = createAdminClient();

  for (const u of USUARIOS_INICIALES) {
    const existente = await prisma.usuario.findUnique({ where: { email: u.email } });
    if (existente) {
      console.log(`Ya existe perfil para ${u.email}, se omite.`);
      continue;
    }

    const { data, error } = await admin.auth.admin.inviteUserByEmail(u.email, {
      data: { nombre: u.nombre },
    });

    if (error || !data.user) {
      console.error(`No se pudo invitar a ${u.email}:`, error?.message);
      continue;
    }

    // El trigger de Supabase ya pudo haber creado el perfil (rol ASISTENTE
    // por defecto) antes de que esta línea se ejecute, así que forzamos el
    // rol y nombre correctos explícitamente en el update.
    await prisma.usuario.upsert({
      where: { id: data.user.id },
      update: { nombre: u.nombre, rol: u.rol },
      create: {
        id: data.user.id,
        nombre: u.nombre,
        email: u.email,
        rol: u.rol,
      },
    });

    console.log(`Invitación enviada a ${u.email} (rol ${u.rol}).`);
  }

  const tarifaExistente = await prisma.tarifa.findFirst({ where: { activa: true } });
  if (!tarifaExistente) {
    await prisma.tarifa.create({
      data: { nombre: "Tarifa general", precio: 0 },
    });
    console.log("Tarifa general creada con precio $0 (actualizala desde la app).");
  }

  const configExistente = await prisma.configuracionAlertas.findFirst();
  if (!configExistente) {
    await prisma.configuracionAlertas.create({ data: {} });
    console.log("Configuración de alertas de tramos creada con valores por defecto.");
  }

  console.log("Seed completado.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
