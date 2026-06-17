import { createClient } from "@supabase/supabase-js";

if (!process.env.VITE_SUPABASE_URL) {
  throw new Error("VITE_SUPABASE_URL is not defined");
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is not defined");
}

const supabaseClient = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default supabaseClient;
