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
import {
  captureBootError,
  isBootDiagnosticsEnabled,
  markBootStage,
  patchBootState,
} from "../lib/bootDiagnostics";

const logAuth = (...args: unknown[]) => {
  if (!isBootDiagnosticsEnabled()) return;
  console.log("[AUTH]", ...args);
};

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
    logAuth("bootstrap start");
    patchBootState(
      {
        authLoading: true,
      },
      "AUTH_BOOTSTRAP_START",
    );

    const bootstrapTimeout = setTimeout(() => {
      if (!isMounted) return;
      // Fail open so release builds do not stay on splash forever.
      logAuth("bootstrap timeout reached, forcing loading=false");
      markBootStage("AUTH_BOOTSTRAP_TIMEOUT");
      setIsLoading(false);
      patchBootState(
        {
          authLoading: false,
        },
        "AUTH_BOOTSTRAP_TIMEOUT_RELEASE",
      );
    }, 8000);

    const bootstrapSession = async () => {
      try {
        logAuth("getSession begin");
        markBootStage("AUTH_GETSESSION_BEGIN");
        const { data } = await supabase.auth.getSession();
        if (!isMounted) return;
        logAuth("getSession success", {
          hasSession: Boolean(data.session),
          userId: data.session?.user?.id ?? null,
        });
        patchBootState(
          {
            hasSession: Boolean(data.session),
          },
          "AUTH_GETSESSION_SUCCESS",
        );
        setSession(data.session ?? null);
        hadSessionRef.current = Boolean(data.session);
      } catch (error) {
        if (!isMounted) return;
        logAuth("getSession failed");
        captureBootError("supabase.auth.getSession", error);
        setSession(null);
        hadSessionRef.current = false;
        patchBootState(
          {
            hasSession: false,
          },
          "AUTH_GETSESSION_FAILED",
        );
      } finally {
        if (isMounted) {
          clearTimeout(bootstrapTimeout);
          logAuth("bootstrap finish, loading=false");
          setIsLoading(false);
          patchBootState(
            {
              authLoading: false,
            },
            "AUTH_BOOTSTRAP_FINISH",
          );
        }
      }
    };

    void bootstrapSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      logAuth("auth state changed", {
        event,
        hasSession: Boolean(newSession),
      });
      patchBootState(
        {
          hasSession: Boolean(newSession),
        },
        `AUTH_STATE_${event}`,
      );
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
      logAuth("provider unmount");
      markBootStage("AUTH_PROVIDER_UNMOUNT");
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
      } catch (error) {
        // Keep auth/session flow alive even if push registration fails.
        captureBootError("registerForPushNotificationsAsync", error);
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
