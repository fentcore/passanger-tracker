import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const email = "qa-flow-test@passengertracker.local";

const { data: userData, error: userError } = await admin.auth.admin.createUser({
  email,
  email_confirm: false,
});
if (userError) {
  console.log("createUser error:", userError.message);
  process.exit(1);
}

const { data, error } = await admin.auth.admin.generateLink({
  type: "invite",
  email,
  options: { redirectTo: "https://passanger-tracker.vercel.app/auth/set-password" },
});
if (error) {
  console.log("generateLink error:", error.message);
} else {
  console.log(data.properties.action_link);
  console.log("USER_ID:" + userData.user.id);
}
