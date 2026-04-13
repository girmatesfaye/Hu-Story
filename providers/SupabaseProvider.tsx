import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import {
  canUseRemotePushNotifications,
  registerForPushNotificationsAsync,
} from "../lib/notifications";
import { identifySmartlookUser } from "../lib/smartlook";

type SupabaseContextValue = {
  session: Session | null;
  isLoading: boolean;
  sessionExpiredMessage: string | null;
  dismissSessionExpiredMessage: () => void;
};

const SupabaseContext = createContext<SupabaseContextValue>({
  session: null,
  isLoading: true,
  sessionExpiredMessage: null,
  dismissSessionExpiredMessage: () => undefined,
});

type SupabaseProviderProps = {
  children: React.ReactNode;
};

export function SupabaseProvider({ children }: SupabaseProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState<
    string | null
  >(null);
  const hadSessionRef = useRef(false);

  const dismissSessionExpiredMessage = useCallback(() => {
    setSessionExpiredMessage(null);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const bootstrapTimeout = setTimeout(() => {
      if (!isMounted) return;
      // Fail open so release builds do not stay on splash forever.
      setIsLoading(false);
    }, 8000);

    const bootstrapSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!isMounted) return;
        setSession(data.session ?? null);
        hadSessionRef.current = Boolean(data.session);
      } catch {
        if (!isMounted) return;
        setSession(null);
        hadSessionRef.current = false;
      } finally {
        if (isMounted) {
          clearTimeout(bootstrapTimeout);
          setIsLoading(false);
        }
      }
    };

    void bootstrapSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === "SIGNED_OUT" && hadSessionRef.current) {
        setSessionExpiredMessage("Session expired. Please sign in again.");
      }

      if (newSession) {
        setSessionExpiredMessage(null);
      }

      hadSessionRef.current = Boolean(newSession);
      setSession(newSession);
    });

    return () => {
      isMounted = false;
      clearTimeout(bootstrapTimeout);
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;
    if (!canUseRemotePushNotifications()) return;

    let isMounted = true;

    const registerToken = async () => {
      try {
        const token = await registerForPushNotificationsAsync();
        if (!token || !isMounted) return;

        await supabase.rpc("upsert_push_token", {
          p_token: token,
        });
      } catch {
        // Keep auth/session flow alive even if push registration fails.
      }
    };

    void registerToken();

    return () => {
      isMounted = false;
    };
  }, [session?.user?.id]);

  // Smartlook phase-1 integration: keep Smartlook user identity aligned with auth state.
  useEffect(() => {
    void identifySmartlookUser({
      id: session?.user?.id,
      email: session?.user?.email,
    });
  }, [session?.user?.email, session?.user?.id]);

  return (
    <SupabaseContext.Provider
      value={{
        session,
        isLoading,
        sessionExpiredMessage,
        dismissSessionExpiredMessage,
      }}
    >
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  return useContext(SupabaseContext);
}
