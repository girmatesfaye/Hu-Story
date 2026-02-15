import { Image, ScrollView, TouchableOpacity, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "../../components/AppText";
import { useTheme } from "../../hooks/useTheme";
import { SafeAreaView } from "react-native-safe-area-context";

const filters = ["All", "Rants", "Events", "Projects"];

export default function NotificationScreen() {
  const { colors, statusBarStyle } = useTheme();

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <View className="flex-1 bg-slate-50 dark:bg-slate-950">
        <StatusBar style={statusBarStyle} />
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pb-28"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-row items-center justify-between pt-6">
            <View className="flex-row items-center gap-3">
              <View className="relative">
                <View className="h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-500/20">
                  <Ionicons
                    name="notifications"
                    size={20}
                    color={colors.accent}
                  />
                </View>
                <View className="absolute right-2 top-2 h-2 w-2 rounded-full bg-emerald-500" />
              </View>
              <AppText className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                Notifications
              </AppText>
            </View>
            <TouchableOpacity accessibilityRole="button">
              <AppText className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                Mark all read
              </AppText>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="mt-5 gap-3"
          >
            {filters.map((filter, index) => {
              const isActive = index === 0;

              return (
                <TouchableOpacity
                  key={filter}
                  className={`rounded-full px-4 py-2 ${
                    isActive
                      ? "bg-emerald-600"
                      : "border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                  }`}
                  accessibilityRole="button"
                >
                  <AppText
                    className={`text-xs font-semibold ${
                      isActive
                        ? "text-white"
                        : "text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {filter}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View className="mt-6">
            <View className="flex-row items-center gap-3">
              <AppText className="text-xs font-semibold tracking-[2px] text-slate-400 dark:text-slate-500">
                TODAY
              </AppText>
              <View className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            </View>

            <View className="mt-4 gap-4">
              <View className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
                <View className="flex-row items-start gap-4">
                  <View className="h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-500/20">
                    <Ionicons name="chatbox" size={18} color={colors.accent} />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between">
                      <AppText className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        New comment on your rant
                      </AppText>
                      <View className="h-2 w-2 rounded-full bg-emerald-500" />
                    </View>
                    <AppText className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                      Alex B. commented: "Seriously, the library hours need to
                      be extended..."
                    </AppText>
                    <AppText className="mt-3 text-xs text-slate-400 dark:text-slate-500">
                      2m ago
                    </AppText>
                  </View>
                </View>
              </View>

              <View className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
                <View className="flex-row items-start gap-4">
                  <View className="h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-500/20">
                    <Ionicons name="rocket" size={18} color="#7C3AED" />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between">
                      <AppText className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Project Update
                      </AppText>
                      <View className="h-2 w-2 rounded-full bg-emerald-500" />
                    </View>
                    <AppText className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                      New milestone added to "CS Study Group". Check out the
                      latest tasks...
                    </AppText>
                    <AppText className="mt-3 text-xs text-slate-400 dark:text-slate-500">
                      3h ago
                    </AppText>
                  </View>
                </View>
              </View>

              <View className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
                <View className="flex-row items-start gap-4">
                  <View className="h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-500/20">
                    <Ionicons name="heart" size={18} color="#E11D48" />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between">
                      <AppText className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Spot trending!
                      </AppText>
                    </View>
                    <AppText className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                      Your photo of the Main Gate just reached 50 likes.
                    </AppText>
                    <View className="mt-3">
                      <Image
                        source={{
                          uri: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=300&q=80",
                        }}
                        className="h-16 w-16 rounded-xl"
                        resizeMode="cover"
                      />
                    </View>
                    <AppText className="mt-3 text-xs text-slate-400 dark:text-slate-500">
                      5h ago
                    </AppText>
                  </View>
                </View>
              </View>
            </View>
          </View>

          <View className="mt-8">
            <View className="flex-row items-center gap-3">
              <AppText className="text-xs font-semibold tracking-[2px] text-slate-400 dark:text-slate-500">
                YESTERDAY
              </AppText>
              <View className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            </View>

            <View className="mt-4 gap-4">
              <View className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
                <View className="flex-row items-start gap-4">
                  <View className="h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 dark:bg-orange-500/20">
                    <Ionicons name="calendar" size={18} color="#F97316" />
                  </View>
                  <View className="flex-1">
                    <AppText className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Event Reminder
                    </AppText>
                    <AppText className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                      "Freshman Welcome Party" was scheduled for yesterday at
                      4:00 PM.
                    </AppText>
                    <AppText className="mt-3 text-xs text-slate-400 dark:text-slate-500">
                      1d ago
                    </AppText>
                  </View>
                </View>
              </View>

              <View className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
                <View className="flex-row items-start gap-4">
                  <View className="h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                    <Ionicons
                      name="alert-circle"
                      size={18}
                      color={colors.mutedText}
                    />
                  </View>
                  <View className="flex-1">
                    <AppText className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      System Maintenance
                    </AppText>
                    <AppText className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                      The app will be undergoing scheduled maintenance this...
                    </AppText>
                    <AppText className="mt-3 text-xs text-slate-400 dark:text-slate-500">
                      1d ago
                    </AppText>
                  </View>
                </View>
              </View>
            </View>
          </View>

          <View className="mt-8 items-center pb-6">
            <View className="h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <Ionicons name="checkmark" size={22} color={colors.mutedStrong} />
            </View>
            <AppText className="mt-3 text-sm text-slate-400 dark:text-slate-500">
              You're all caught up!
            </AppText>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
