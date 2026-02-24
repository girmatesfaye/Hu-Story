import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import "react-native-reanimated";
import "../global.css";
import { useTheme } from "../hooks/useTheme";
import { useEffect } from "react";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { SupabaseProvider } from "../providers/SupabaseProvider";
export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const { statusBarStyle } = useTheme();
  const [fontsLoaded] = useFonts({
    LexendRegular: require("../assets/fonts/Lexend-Regular.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);
  if (!fontsLoaded) return null;
  return (
    <SupabaseProvider>
      <View className="flex-1 bg-white dark:bg-slate-950">
        <Stack initialRouteName="splash">
          <Stack.Screen name="splash" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="rants/[id]" options={{ headerShown: false }} />
          <Stack.Screen
            name="rants/create-rants"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="rants/edit/[id]"
            options={{ headerShown: false }}
          />
          <Stack.Screen name="events/[id]" options={{ headerShown: false }} />
          <Stack.Screen
            name="events/create-events"
            options={{ headerShown: false }}
          />
          <Stack.Screen name="spots/[id]" options={{ headerShown: false }} />
          <Stack.Screen
            name="spots/create-spots"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="spots/edit/[id]"
            options={{ headerShown: false }}
          />
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
          <Stack.Screen
            name="(auth)/register"
            options={{ headerShown: false }}
          />
          <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
          <Stack.Screen
            name="profiles/edit-profile"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="profiles/settings"
            options={{ headerShown: false }}
          />
        </Stack>
        <StatusBar style={statusBarStyle} />
      </View>
    </SupabaseProvider>
  );
}
