import { type Session } from "@supabase/supabase-js";
import { type ReactNode, useEffect, useState } from "react";

import supabase from "@/lib/supabase";

import { SessionContext } from "./SessionContext";

interface SessionProviderProps {
  children: ReactNode;
}

export const SessionProvider = ({ children }: SessionProviderProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCurrent = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!isCurrent) return;

        setSession(data.session);
        setIsLoading(false);
      })
      .catch(() => {
        if (isCurrent) {
          setIsLoading(false);
        }
      });

    const authStateListener = supabase.auth.onAuthStateChange((_, session) => {
      setSession(session);
      setIsLoading(false);
    });

    return () => {
      isCurrent = false;
      authStateListener.data.subscription.unsubscribe();
    };
  }, []);

  return (
    <SessionContext.Provider value={{ isLoading, session }}>
      {children}
    </SessionContext.Provider>
  );
};
