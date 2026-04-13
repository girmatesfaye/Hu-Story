import { useEffect } from "react";
import { View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { AppText } from "../components/AppText";
import { useTheme } from "../hooks/useTheme";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSupabase } from "../providers/SupabaseProvider";
import { isAdminUser } from "../constants/admin";
import { hasSupabaseEnv, SUPABASE_CONFIG_ERROR_MESSAGE } from "../lib/supabase";
import {
  captureBootError,
  isBootDiagnosticsEnabled,
  markBootStage,
  patchBootState,
} from "../lib/bootDiagnostics";

const logSplash = (...args: unknown[]) => {
  if (!isBootDiagnosticsEnabled()) return;
  console.log("[SPLASH]", ...args);
};

export default function SplashScreen() {
  const { colors, statusBarStyle } = useTheme();
  const router = useRouter();
  const { session, isLoading } = useSupabase();
  const shouldContinueBoot = !isLoading || !hasSupabaseEnv;

  useEffect(() => {
    logSplash("state", {
      isLoading,
      hasSession: Boolean(session),
      hasSupabaseEnv,
      shouldContinueBoot,
    });
    patchBootState(
      {
        authLoading: isLoading,
        hasSession: Boolean(session),
        hasSupabaseEnv,
      },
      "SPLASH_STATE",
    );
  }, [isLoading, session, shouldContinueBoot]);

  useEffect(() => {
    if (!shouldContinueBoot) {
      logSplash("waiting for bootstrap to continue");
      markBootStage("SPLASH_WAITING_FOR_AUTH");
      return;
    }

    logSplash("boot unlocked, preparing route decision");
    markBootStage("SPLASH_ROUTE_DECISION_START");

    const watchdogTimeout = setTimeout(() => {
      markBootStage("SPLASH_ROUTE_WATCHDOG_TIMEOUT", {
        hasSession: Boolean(session),
      });
    }, 7000);

    const timeout = setTimeout(() => {
      const route = async () => {
        if (session) {
          logSplash("session found, checking admin role");
          try {
            const isAdmin = await Promise.race<boolean>([
              isAdminUser(),
              new Promise<boolean>((resolve) => {
                setTimeout(() => resolve(false), 5000);
              }),
            ]);
            logSplash("routing authenticated user", {
              isAdmin,
            });
            const target = isAdmin ? "/admin" : "/(tabs)/rants";
            patchBootState(
              {
                routeTarget: target,
              },
              "ROUTE_REPLACE_ATTEMPT",
            );
            router.replace(target);
          } catch {
            logSplash("admin lookup failed, fallback route /(tabs)/rants");
            patchBootState(
              {
                routeTarget: "/(tabs)/rants",
              },
              "ROUTE_REPLACE_FALLBACK",
            );
            router.replace("/(tabs)/rants");
          }
          return;
        }

        logSplash("no session, route /(auth)/register");
        patchBootState(
          {
            routeTarget: "/(auth)/register",
          },
          "ROUTE_REPLACE_NO_SESSION",
        );
        router.replace("/(auth)/register");
      };

      void route().catch((error) => {
        captureBootError("SplashScreen.route", error);
      });
    }, 1200);

    return () => {
      clearTimeout(timeout);
      clearTimeout(watchdogTimeout);
    };
  }, [router, session, shouldContinueBoot]);

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <View className="flex-1 items-center justify-center bg-slate-50 px-6 dark:bg-slate-950">
        <StatusBar style={statusBarStyle} translucent={false} />
        <View className="items-center">
          <View className="h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-lg dark:bg-slate-900">
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-500/20">
              <Ionicons name="add" size={28} color={colors.accent} />
            </View>
          </View>

          <View className="mt-8 items-center">
            <View className="flex-row items-center">
              <AppText className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
                Campus Story
              </AppText>
              <AppText className="ml-2 text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                (HU)
              </AppText>
            </View>
            <AppText className="mt-3 text-base text-slate-500 dark:text-slate-400">
              Real campus stories.
            </AppText>
            <AppText className="text-base text-slate-500 dark:text-slate-400">
              Real student places.
            </AppText>
          </View>
        </View>

        <View className="absolute bottom-24 flex-row items-center gap-3">
          <View className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
          <View className="h-2.5 w-2.5 rounded-full bg-emerald-300 dark:bg-emerald-500/50" />
          <View className="h-2.5 w-2.5 rounded-full bg-emerald-200 dark:bg-emerald-500/30" />
        </View>

        {!hasSupabaseEnv ? (
          <AppText className="absolute bottom-20 px-8 text-center text-xs text-red-500 dark:text-red-400">
            {SUPABASE_CONFIG_ERROR_MESSAGE}
          </AppText>
        ) : null}

        <AppText className="absolute bottom-10 text-xs tracking-[3px] text-slate-400 dark:text-slate-500">
          V1.0.0 | HAWASSA UNIVERSITY
        </AppText>

        {isBootDiagnosticsEnabled() ? (
          <AppText className="absolute bottom-4 px-6 text-center text-[10px] text-emerald-700 dark:text-emerald-400">
            DEBUG boot: loading={String(isLoading)} session=
            {String(Boolean(session))} env={String(hasSupabaseEnv)}
          </AppText>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
