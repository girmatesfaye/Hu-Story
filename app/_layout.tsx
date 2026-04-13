import "react-native-reanimated";
import { Stack, usePathname, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";
import { useTheme } from "../hooks/useTheme";
import { useCallback, useEffect, useState } from "react";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { SupabaseProvider, useSupabase } from "../providers/SupabaseProvider";
import { FetchErrorModal } from "../components/FetchErrorModal";
import * as Notifications from "expo-notifications";
import {
  canUseRemotePushNotifications,
  getRouteFromNotificationTarget,
} from "../lib/notifications";
import { initSmartlook, trackSmartlookScreen } from "../lib/smartlook";
import { BootErrorBoundary } from "../components/BootErrorBoundary";
import { BootDebugOverlay } from "../components/BootDebugOverlay";
import { AppText } from "../components/AppText";
import {
  captureBootError,
  getBootDiagnosticsState,
  isBootDiagnosticsEnabled,
  markBootStage,
  patchBootState,
} from "../lib/bootDiagnostics";
export const unstable_settings = {
  initialRouteName: "splash",
};

const logBoot = (...args: unknown[]) => {
  if (!isBootDiagnosticsEnabled()) return;
  console.log("[BOOT]", ...args);
};

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    LexendRegular: require("../assets/fonts/Lexend-Regular.ttf"),
  });
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    logBoot("root state", {
      fontsLoaded,
      hasFontError: Boolean(fontError),
      appReady,
    });
    patchBootState(
      {
        appReady,
      },
      "ROOT_STATE",
    );
  }, [appReady, fontError, fontsLoaded]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      logBoot("font phase completed", {
        fontsLoaded,
        hasFontError: Boolean(fontError),
      });
      markBootStage(fontError ? "FONT_ERROR" : "FONTS_READY", {
        hasFontError: Boolean(fontError),
      });
      setAppReady(true);
      return;
    }

    const timeout = setTimeout(() => {
      // Avoid permanent native splash if font load stalls in release.
      logBoot("font timeout reached, forcing appReady");
      markBootStage("FONT_TIMEOUT");
      setAppReady(true);
    }, 4000);

    return () => clearTimeout(timeout);
  }, [fontsLoaded, fontError]);

  const onLayoutRootView = useCallback(() => {
    if (!appReady) return;

    logBoot("root layout mounted, hiding native splash");
    markBootStage("NATIVE_SPLASH_HIDE_ATTEMPT");
    void SplashScreen.hideAsync().catch(() => {
      // Ignore hide errors and continue rendering app shell.
      logBoot("hideAsync failed");
      captureBootError("SplashScreen.hideAsync", "hideAsync failed");
    });
  }, [appReady]);

  if (!appReady) {
    const snapshot = getBootDiagnosticsState();

    return (
      <SafeAreaProvider>
        <View className="flex-1 items-center justify-center bg-slate-50 px-6 dark:bg-slate-950">
          <AppText className="text-base font-semibold text-slate-800 dark:text-slate-100">
            Starting app...
          </AppText>
          <AppText className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
            stage={snapshot.stage} appReady={String(snapshot.appReady)}{" "}
            authLoading=
            {String(snapshot.authLoading)}
          </AppText>
          {isBootDiagnosticsEnabled() ? <BootDebugOverlay /> : null}
        </View>
      </SafeAreaProvider>
    );
  }

  const diagnosticsEnabled = isBootDiagnosticsEnabled();

  return (
    <SafeAreaProvider>
      <View className="flex-1" onLayout={onLayoutRootView}>
        <SupabaseProvider>
          {diagnosticsEnabled ? (
            <BootErrorBoundary>
              <RootNavigator />
            </BootErrorBoundary>
          ) : (
            <RootNavigator />
          )}
        </SupabaseProvider>
        {diagnosticsEnabled ? <BootDebugOverlay /> : null}
      </View>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const { colors, statusBarStyle } = useTheme();
  const { sessionExpiredMessage, dismissSessionExpiredMessage } = useSupabase();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    logBoot("navigator route", pathname ?? "(null)");
    patchBootState(
      {
        routePath: pathname ?? null,
      },
      "ROUTE_PATH",
    );
  }, [pathname]);

  // Smartlook phase-1 integration: initialize recording once app shell is mounted.
  useEffect(() => {
    markBootStage("ROOT_NAVIGATOR_MOUNTED");
    void initSmartlook().catch((error) => {
      captureBootError("initSmartlook", error);
    });
  }, []);

  // Smartlook phase-1 integration: track route transitions from Expo Router.
  useEffect(() => {
    void trackSmartlookScreen(pathname).catch((error) => {
      captureBootError("trackSmartlookScreen", error);
    });
  }, [pathname]);

  useEffect(() => {
    if (!canUseRemotePushNotifications()) return;

    const handleResponse = (
      response: Notifications.NotificationResponse | null,
    ) => {
      if (!response) return;
      const data = response.notification.request.content.data as
        | Record<string, string | undefined>
        | undefined;

      const route = getRouteFromNotificationTarget({
        route: data?.route,
        deep_link: data?.deep_link,
        target_type: data?.target_type,
        target_id: data?.target_id,
      });

      if (route) {
        patchBootState(
          {
            routeTarget: route,
          },
          "PUSH_NOTIFICATION_ROUTE",
        );
        router.push(route as never);
      }
    };

    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        handleResponse(response);
      },
    );

    void Notifications.getLastNotificationResponseAsync().then(handleResponse);

    return () => {
      subscription.remove();
    };
  }, [router]);

  return (
    <View className="flex-1 bg-white dark:bg-slate-950">
      <Stack initialRouteName="splash">
        <Stack.Screen name="splash" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="rants/[id]" options={{ headerShown: false }} />
        <Stack.Screen
          name="rants/create-rants"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="rants/edit/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="events/[id]" options={{ headerShown: false }} />
        <Stack.Screen
          name="events/create-events"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="events/edit/[id]"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="spots/[id]" options={{ headerShown: false }} />
        <Stack.Screen
          name="spots/create-spots"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="spots/edit/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="projects/[id]" options={{ headerShown: false }} />
        <Stack.Screen
          name="projects/create-projects"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="projects/edit/[id]"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="notifications/notification"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="admin/index" options={{ headerShown: false }} />
        <Stack.Screen
          name="spots/add-review"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="(auth)/register" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
        <Stack.Screen
          name="profiles/edit-profile"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="profiles/settings"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="profiles/buy-me-coffee"
          options={{ headerShown: false }}
        />
      </Stack>

      <FetchErrorModal
        visible={Boolean(sessionExpiredMessage)}
        message={sessionExpiredMessage}
        retryLabel="Sign In"
        onClose={dismissSessionExpiredMessage}
        onRetry={() => {
          dismissSessionExpiredMessage();
          router.replace("/(auth)/login");
        }}
      />

      <StatusBar
        style={statusBarStyle}
        backgroundColor={colors.headerBackground}
        translucent={false}
      />
    </View>
  );
}
