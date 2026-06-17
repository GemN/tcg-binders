import { createClient } from "@supabase/supabase-js";

import { handleError } from "@/lib/error";
import { getGlobalUserContext } from "@/providers/UserContextContext";

const supabaseClient = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    global: {
      fetch: (input, init = {}) => {
        const headers = new Headers(init.headers || {});
        const context = getGlobalUserContext();
        if (context?.organizationId) {
          headers.set("x-organization-id", context.organizationId);
        }
        return fetch(input, { ...init, headers });
      },
    },
  }
);

export default supabaseClient;

export const isAuthenticated = async () => {
  const {
    data: { session },
    error,
  } = await supabaseClient.auth.getSession();
  if (error) {
    handleError(error);
    return false;
  }
  return !!session;
};
