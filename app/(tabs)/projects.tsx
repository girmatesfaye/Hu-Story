import { ScrollView, TouchableOpacity, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { AppText } from "../../components/AppText";
import { useTheme } from "../../hooks/useTheme";
import { Pressable } from "react-native";
import { useColorScheme } from "react-native";

export default function ProjectsTabScreen() {
  const { statusBarStyle } = useTheme();
  const router = useRouter();
  const scheme = useColorScheme();
  const iconColors = {
    text: scheme === "dark" ? "#E5E7EB" : "#0F172A",
    muted: scheme === "dark" ? "#94A3B8" : "#64748B",
    accent: scheme === "dark" ? "#4ADE80" : "#16A34A",
    chipText: scheme === "dark" ? "#0B0B0B" : "#FFFFFF",
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <StatusBar style={statusBarStyle} />
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pt-6 pb-28"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-4">
            <AppText className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              Campus Projects
            </AppText>
            <AppText className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Discover what peers are building
            </AppText>
          </View>
          <TouchableOpacity
            className="h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-slate-900"
            accessibilityRole="button"
          >
            <Ionicons
              name="options-outline"
              size={20}
              color={statusBarStyle === "light" ? "#E5E7EB" : "#0F172A"}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          className="mt-6 rounded-3xl bg-white shadow-sm dark:bg-slate-900"
          accessibilityRole="button"
          onPress={() => router.push("../projects/1")}
        >
          <View className="h-44 rounded-t-3xl bg-emerald-50 dark:bg-emerald-900/30" />
          <View className="px-5 pb-5 pt-4">
            <View className="flex-row items-center justify-between">
              <AppText className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Campus Bus Tracker
              </AppText>
              <AppText className="text-sm text-slate-400 dark:text-slate-500">
                2h ago
              </AppText>
            </View>
            <AppText className="mt-2 text-sm leading-5 text-slate-500 dark:text-slate-400">
              An app to track the real-time location of university shuttles
              using GPS modules...
            </AppText>
            <View className="mt-4 flex-row flex-wrap gap-2">
              <View className="rounded-lg bg-emerald-100 px-3 py-1 dark:bg-emerald-500/20">
                <AppText className="text-xs font-medium text-emerald-700 dark:text-emerald-200">
                  Flutter
                </AppText>
              </View>
              <View className="rounded-lg bg-emerald-100 px-3 py-1 dark:bg-emerald-500/20">
                <AppText className="text-xs font-medium text-emerald-700 dark:text-emerald-200">
                  Maps API
                </AppText>
              </View>
              <View className="rounded-lg bg-emerald-100 px-3 py-1 dark:bg-emerald-500/20">
                <AppText className="text-xs font-medium text-emerald-700 dark:text-emerald-200">
                  IoT
                </AppText>
              </View>
            </View>
            <View className="mt-4 flex-row items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
              <View className="flex-row items-center">
                <View className="h-9 w-9 items-center justify-center rounded-full bg-emerald-200 dark:bg-emerald-700">
                  <AppText className="text-xs font-semibold text-emerald-900 dark:text-emerald-50">
                    DA
                  </AppText>
                </View>
                <AppText className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                  Dawit A.
                </AppText>
              </View>
              <View className="flex-row items-center gap-4">
                <View className="flex-row items-center">
                  <Ionicons
                    name="eye-outline"
                    size={18}
                    color={statusBarStyle === "light" ? "#94A3B8" : "#64748B"}
                  />
                  <AppText className="ml-2 text-sm text-slate-400 dark:text-slate-500">
                    24
                  </AppText>
                </View>
                <View className="flex-row items-center">
                  <Ionicons
                    name="heart-outline"
                    size={18}
                    color={statusBarStyle === "light" ? "#94A3B8" : "#64748B"}
                  />
                  <AppText className="ml-2 text-sm text-slate-400 dark:text-slate-500">
                    24
                  </AppText>
                </View>
              </View>
            </View>
          </View>
          <View className="absolute right-5 top-4 rounded-full bg-white px-3 py-1 shadow-sm dark:bg-slate-900">
            <AppText className="text-xs font-semibold text-emerald-600 dark:text-emerald-300">
              Featured
            </AppText>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          className="mt-6 rounded-3xl bg-white shadow-sm dark:bg-slate-900"
          accessibilityRole="button"
          onPress={() => router.push("../projects/2")}
        >
          <View className="h-44 rounded-t-3xl bg-emerald-50 dark:bg-emerald-900/30" />
          <View className="px-5 pb-5 pt-4">
            <View className="flex-row items-center justify-between">
              <AppText className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Campus Bus Tracker
              </AppText>
              <AppText className="text-sm text-slate-400 dark:text-slate-500">
                2h ago
              </AppText>
            </View>
            <AppText className="mt-2 text-sm leading-5 text-slate-500 dark:text-slate-400">
              An app to track the real-time location of university shuttles
              using GPS modules...
            </AppText>
            <View className="mt-4 flex-row flex-wrap gap-2">
              <View className="rounded-lg bg-emerald-100 px-3 py-1 dark:bg-emerald-500/20">
                <AppText className="text-xs font-medium text-emerald-700 dark:text-emerald-200">
                  Flutter
                </AppText>
              </View>
              <View className="rounded-lg bg-emerald-100 px-3 py-1 dark:bg-emerald-500/20">
                <AppText className="text-xs font-medium text-emerald-700 dark:text-emerald-200">
                  Maps API
                </AppText>
              </View>
              <View className="rounded-lg bg-emerald-100 px-3 py-1 dark:bg-emerald-500/20">
                <AppText className="text-xs font-medium text-emerald-700 dark:text-emerald-200">
                  IoT
                </AppText>
              </View>
            </View>
            <View className="mt-4 flex-row items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
              <View className="flex-row items-center">
                <View className="h-9 w-9 items-center justify-center rounded-full bg-emerald-200 dark:bg-emerald-700">
                  <AppText className="text-xs font-semibold text-emerald-900 dark:text-emerald-50">
                    DA
                  </AppText>
                </View>
                <AppText className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                  Dawit A.
                </AppText>
              </View>
              <View className="flex-row items-center gap-4">
                <View className="flex-row items-center">
                  <Ionicons
                    name="eye-outline"
                    size={18}
                    color={statusBarStyle === "light" ? "#94A3B8" : "#64748B"}
                  />
                  <AppText className="ml-2 text-sm text-slate-400 dark:text-slate-500">
                    24
                  </AppText>
                </View>
                <View className="flex-row items-center">
                  <Ionicons
                    name="heart-outline"
                    size={18}
                    color={statusBarStyle === "light" ? "#94A3B8" : "#64748B"}
                  />
                  <AppText className="ml-2 text-sm text-slate-400 dark:text-slate-500">
                    24
                  </AppText>
                </View>
              </View>
            </View>
          </View>
          <View className="absolute right-5 top-4 rounded-full bg-white px-3 py-1 shadow-sm dark:bg-slate-900">
            <AppText className="text-xs font-semibold text-emerald-600 dark:text-emerald-300">
              Featured
            </AppText>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          className="mt-6 rounded-3xl bg-white shadow-sm dark:bg-slate-900"
          accessibilityRole="button"
          onPress={() => router.push("../projects/3")}
        >
          <View className="h-44 rounded-t-3xl bg-emerald-50 dark:bg-emerald-900/30" />
          <View className="px-5 pb-5 pt-4">
            <View className="flex-row items-center justify-between">
              <AppText className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Campus Bus Tracker
              </AppText>
              <AppText className="text-sm text-slate-400 dark:text-slate-500">
                2h ago
              </AppText>
            </View>
            <AppText className="mt-2 text-sm leading-5 text-slate-500 dark:text-slate-400">
              An app to track the real-time location of university shuttles
              using GPS modules...
            </AppText>
            <View className="mt-4 flex-row flex-wrap gap-2">
              <View className="rounded-lg bg-emerald-100 px-3 py-1 dark:bg-emerald-500/20">
                <AppText className="text-xs font-medium text-emerald-700 dark:text-emerald-200">
                  Flutter
                </AppText>
              </View>
              <View className="rounded-lg bg-emerald-100 px-3 py-1 dark:bg-emerald-500/20">
                <AppText className="text-xs font-medium text-emerald-700 dark:text-emerald-200">
                  Maps API
                </AppText>
              </View>
              <View className="rounded-lg bg-emerald-100 px-3 py-1 dark:bg-emerald-500/20">
                <AppText className="text-xs font-medium text-emerald-700 dark:text-emerald-200">
                  IoT
                </AppText>
              </View>
            </View>
            <View className="mt-4 flex-row items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
              <View className="flex-row items-center">
                <View className="h-9 w-9 items-center justify-center rounded-full bg-emerald-200 dark:bg-emerald-700">
                  <AppText className="text-xs font-semibold text-emerald-900 dark:text-emerald-50">
                    DA
                  </AppText>
                </View>
                <AppText className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                  Dawit A.
                </AppText>
              </View>
              <View className="flex-row items-center gap-4">
                <View className="flex-row items-center">
                  <Ionicons
                    name="eye-outline"
                    size={18}
                    color={statusBarStyle === "light" ? "#94A3B8" : "#64748B"}
                  />
                  <AppText className="ml-2 text-sm text-slate-400 dark:text-slate-500">
                    24
                  </AppText>
                </View>
                <View className="flex-row items-center">
                  <Ionicons
                    name="heart-outline"
                    size={18}
                    color={statusBarStyle === "light" ? "#94A3B8" : "#64748B"}
                  />
                  <AppText className="ml-2 text-sm text-slate-400 dark:text-slate-500">
                    24
                  </AppText>
                </View>
              </View>
            </View>
          </View>
          <View className="absolute right-5 top-4 rounded-full bg-white px-3 py-1 shadow-sm dark:bg-slate-900">
            <AppText className="text-xs font-semibold text-emerald-600 dark:text-emerald-300">
              Featured
            </AppText>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={() => router.push("/projects/create-projects")}
        className="absolute right-5 bottom-5 w-14 h-14 rounded-full items-center justify-center bg-green-600 dark:bg-green-400 shadow-lg"
      >
        <Ionicons name="add" size={26} color={iconColors.chipText} />
      </Pressable>
    </View>
  );
}
