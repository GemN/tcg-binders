import { useApolloClient } from "@apollo/client";
import { useCallback } from "react";
import { useNavigate } from "react-router";

import { handleError } from "@/lib/error.ts";
import supabase from "@/lib/supabase.ts";
import { useUserContext } from "@/providers/UserContextContext.tsx";

export function useLogOut() {
  const client = useApolloClient();
  const navigate = useNavigate();
  const { clearContext } = useUserContext();
  return useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      await client.resetStore();
      clearContext();
    } catch (e) {
      handleError(e);
      // Something went wrong; redirect to /logout to force logout.
      window.location.href = "/logout";
    }
    navigate("/login");
  }, [client, clearContext, navigate]);
}
