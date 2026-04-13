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
import { AppText } from "../components/AppText";
export const unstable_settings = {
  initialRouteName: "splash",
};

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    LexendRegular: require("../assets/fonts/Lexend-Regular.ttf"),
  });
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      setAppReady(true);
      return;
    }

    const timeout = setTimeout(() => {
      // Avoid permanent native splash if font load stalls in release.
      setAppReady(true);
    }, 4000);

    return () => clearTimeout(timeout);
  }, [fontsLoaded, fontError]);

  const onLayoutRootView = useCallback(() => {
    if (!appReady) return;

    void SplashScreen.hideAsync().catch(() => {
      // Ignore hide errors and continue rendering app shell.
    });
  }, [appReady]);

  if (!appReady) {
    return (
      <SafeAreaProvider>
        <View className="flex-1 items-center justify-center bg-slate-50 px-6 dark:bg-slate-950">
          <AppText className="text-base font-semibold text-slate-800 dark:text-slate-100">
            Starting app...
          </AppText>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <View className="flex-1" onLayout={onLayoutRootView}>
        <SupabaseProvider>
          <RootNavigator />
        </SupabaseProvider>
      </View>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const { colors, statusBarStyle } = useTheme();
  const { sessionExpiredMessage, dismissSessionExpiredMessage } = useSupabase();
  const router = useRouter();
  const pathname = usePathname();

  // Smartlook phase-1 integration: initialize recording once app shell is mounted.
  useEffect(() => {
    void initSmartlook().catch(() => {});
  }, []);

  // Smartlook phase-1 integration: track route transitions from Expo Router.
  useEffect(() => {
    void trackSmartlookScreen(pathname).catch(() => {});
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
