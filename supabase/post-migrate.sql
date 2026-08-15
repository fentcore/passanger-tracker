-- Ejecutar UNA VEZ después de "prisma migrate deploy" / "prisma db push"
-- contra la base de Supabase. Deja la tabla profiles enlazada a auth.users,
-- crea automáticamente un perfil para cualquier usuario nuevo que se cree
-- en Supabase Auth en el futuro, y activa Row Level Security en todas las
-- tablas de la app (el acceso real siempre pasa por el servidor Next.js
-- via Prisma con la connection string, que no está sujeta a RLS; esto es
-- una capa extra para que la API REST/anon de Supabase no pueda leer datos
-- directamente).

-- 1) Enlazar profiles.id a auth.users.id
-- NOTA: esta constraint cruza de esquema (public -> auth), lo que rompe el
-- diffing de "prisma migrate dev" (pide declarar el esquema "auth" con
-- multiSchema). Se probó y se optó por NO mantenerla: el trigger de abajo
-- ya garantiza la fila en profiles, y el borrado de usuarios se hace a mano
-- borrando ambos lados. Si se vuelve a agregar, hay que activar multiSchema
-- en el generator y anotar @@schema en todos los modelos.
-- alter table public.profiles
--   add constraint profiles_id_fkey
--   foreign key (id) references auth.users (id) on delete cascade;

-- 2) Crear perfil automáticamente para usuarios nuevos (rol ASISTENTE por defecto)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nombre, email, rol, activo, "createdAt", "updatedAt")
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)),
    new.email,
    'ASISTENTE',
    true,
    now(),
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3) Row Level Security: bloquear todo acceso vía API pública/anon.
-- El servidor Next.js accede con la connection string directa (rol con
-- privilegios de owner), que no pasa por estas políticas.
alter table public.profiles enable row level security;
alter table public."Barrio" enable row level security;
alter table public."Pasajero" enable row level security;
alter table public."Servicio" enable row level security;
alter table public."Nota" enable row level security;
alter table public."Tarifa" enable row level security;
alter table public."HistorialPrecio" enable row level security;
alter table public."ConfiguracionAlertas" enable row level security;
alter table public."HistorialCambio" enable row level security;
alter table public."CategoriaCopy" enable row level security;
alter table public."Copy" enable row level security;
alter table public."PuntoRuta" enable row level security;
alter table public."Recorrido" enable row level security;
alter table public."PaqueteTarifa" enable row level security;
