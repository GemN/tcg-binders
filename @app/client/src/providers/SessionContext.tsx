import type { Session } from "@supabase/supabase-js";
import { createContext, useContext } from "react";

interface SessionContextValue {
  isLoading: boolean;
  session: Session | null;
}

export const SessionContext = createContext<SessionContextValue>({
  isLoading: true,
  session: null,
});

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};
