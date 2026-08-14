import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const redirectTo = "https://passanger-tracker.vercel.app/auth/set-password";

const targets = [
  { email: "fentwave@gmail.com", type: "invite" },
  { email: "camilavitale9@gmail.com", type: "recovery" },
];

for (const { email, type } of targets) {
  const { data, error } = await admin.auth.admin.generateLink({
    type,
    email,
    options: { redirectTo },
  });
  if (error) {
    console.log(email, "ERROR:", error.message);
  } else {
    console.log(email, "->", data.properties.action_link);
  }
}
