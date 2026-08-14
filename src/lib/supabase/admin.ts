import "server-only";
import { createClient } from "@supabase/supabase-js";

// Cliente con la service role key: bypassa RLS y puede administrar usuarios.
// Nunca importar desde código que se ejecute en el navegador.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
