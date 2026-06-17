import { type Session } from "@supabase/supabase-js";
import { useEffect, useState, type ReactNode } from "react";

import { Loading } from "@/components/Loading";
import supabase from "@/lib/supabase";

import { SessionContext } from "./SessionContext";

interface SessionProviderProps {
  children: ReactNode;
}

export const SessionProvider = ({ children }: SessionProviderProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsLoading(false);
    });

    const authStateListener = supabase.auth.onAuthStateChange(
      async (_, session) => {
        setSession(session);
        setIsLoading(false);
      }
    );

    return () => {
      authStateListener.data.subscription.unsubscribe();
    };
  }, []);

  return (
    <SessionContext.Provider value={{ session }}>
      {isLoading ? <Loading /> : children}
    </SessionContext.Provider>
  );
};
