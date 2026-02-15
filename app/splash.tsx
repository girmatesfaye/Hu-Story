import { useEffect } from "react";
import { View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { AppText } from "../components/AppText";
import { useTheme } from "../hooks/useTheme";

export default function SplashScreen() {
  const { colors, statusBarStyle } = useTheme();
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.replace("../(tabs)");
    }, 1600);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <View className="flex-1 items-center justify-center bg-slate-50 px-6 dark:bg-slate-950">
      <StatusBar style={statusBarStyle} />
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

      <AppText className="absolute bottom-10 text-xs tracking-[3px] text-slate-400 dark:text-slate-500">
        V1.0.0 · HAWASSA UNIVERSITY
      </AppText>
    </View>
  );
}
