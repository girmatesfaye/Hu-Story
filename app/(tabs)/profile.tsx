import { Image, ScrollView, TouchableOpacity, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "../../components/AppText";
import { useTheme } from "../../hooks/useTheme";

export default function ProfileTabScreen() {
  const { colors, statusBarStyle } = useTheme();

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <StatusBar style={statusBarStyle} />
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-28"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between pt-6">
          <TouchableOpacity
            className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900"
            accessibilityRole="button"
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color={statusBarStyle === "light" ? "#E5E7EB" : "#0F172A"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900"
            accessibilityRole="button"
          >
            <Ionicons
              name="settings-outline"
              size={20}
              color={statusBarStyle === "light" ? "#E5E7EB" : "#0F172A"}
            />
          </TouchableOpacity>
        </View>

        <View className="items-center pt-6">
          <View className="relative">
            <View className="h-28 w-28 items-center justify-center rounded-full border-4 border-white bg-slate-200 shadow-sm dark:border-slate-950 dark:bg-slate-800">
              <Image
                source={{
                  uri: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80",
                }}
                className="h-full w-full rounded-full"
                resizeMode="cover"
              />
            </View>
            <TouchableOpacity
              className="absolute bottom-0 right-0 h-10 w-10 items-center justify-center rounded-full bg-emerald-600 shadow-md"
              accessibilityRole="button"
            >
              <Ionicons name="pencil" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <AppText className="mt-4 text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Abebe Kebede
          </AppText>
          <View className="mt-2 flex-row items-center">
            <Ionicons name="school" size={14} color={colors.accent} />
            <AppText className="ml-2 text-sm text-slate-500 dark:text-slate-400">
              Hawassa University
            </AppText>
          </View>
        </View>

        <View className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-800">
          <View className="flex-row items-center justify-around">
            <View className="items-center">
              <AppText className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                14
              </AppText>
              <AppText className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                SPOTS
              </AppText>
            </View>
            <View className="items-center">
              <AppText className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                8
              </AppText>
              <AppText className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                RANTS
              </AppText>
            </View>
            <View className="items-center">
              <AppText className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                3
              </AppText>
              <AppText className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                PROJECTS
              </AppText>
            </View>
          </View>
        </View>

        <View className="mt-8 border-b border-slate-200 pb-3 dark:border-slate-800">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity className="flex-1 items-center border-b-2 border-emerald-600 pb-3">
              <AppText className="text-sm font-semibold text-emerald-600">
                My Spots
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 items-center pb-3">
              <AppText className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                My Rants
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 items-center pb-3">
              <AppText className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                My Projects
              </AppText>
            </TouchableOpacity>
          </View>
        </View>

        <View className="mt-6 gap-4">
          <View className="flex-row items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=400&q=80",
              }}
              className="h-16 w-16 rounded-xl"
              resizeMode="cover"
            />
            <View className="flex-1">
              <View className="flex-row items-start justify-between">
                <AppText className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Quiet Study Garden
                </AppText>
                <Ionicons
                  name="ellipsis-horizontal"
                  size={16}
                  color={colors.mutedText}
                />
              </View>
              <View className="mt-2 flex-row items-center">
                <Ionicons name="location" size={14} color={colors.accent} />
                <AppText className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                  Main Campus, Block 4
                </AppText>
              </View>
              <View className="mt-2 flex-row items-center gap-4">
                <View className="flex-row items-center gap-1">
                  <Ionicons
                    name="thumbs-up"
                    size={14}
                    color={colors.mutedText}
                  />
                  <AppText className="text-xs text-slate-500 dark:text-slate-400">
                    24
                  </AppText>
                </View>
                <View className="flex-row items-center gap-1">
                  <Ionicons
                    name="chatbubble-ellipses"
                    size={14}
                    color={colors.mutedText}
                  />
                  <AppText className="text-xs text-slate-500 dark:text-slate-400">
                    5
                  </AppText>
                </View>
              </View>
            </View>
          </View>

          <View className="flex-row items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <View className="relative">
              <Image
                source={{
                  uri: "https://images.unsplash.com/photo-1509475826633-fed577a2c71b?auto=format&fit=crop&w=400&q=80",
                }}
                className="h-16 w-16 rounded-xl"
                resizeMode="cover"
              />
              <View className="absolute right-1 top-1 rounded-md bg-white px-1.5 py-0.5 shadow-sm">
                <AppText className="text-[10px] font-semibold text-slate-700">
                  4.8
                </AppText>
              </View>
            </View>
            <View className="flex-1">
              <View className="flex-row items-start justify-between">
                <AppText className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Best Coffee @ Gate 1
                </AppText>
                <Ionicons
                  name="ellipsis-horizontal"
                  size={16}
                  color={colors.mutedText}
                />
              </View>
              <View className="mt-2 flex-row items-center">
                <Ionicons name="location" size={14} color={colors.accent} />
                <AppText className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                  Gate 1 Area
                </AppText>
              </View>
              <View className="mt-2 flex-row items-center gap-4">
                <View className="flex-row items-center gap-1">
                  <Ionicons
                    name="thumbs-up"
                    size={14}
                    color={colors.mutedText}
                  />
                  <AppText className="text-xs text-slate-500 dark:text-slate-400">
                    12
                  </AppText>
                </View>
                <View className="flex-row items-center gap-1">
                  <Ionicons
                    name="chatbubble-ellipses"
                    size={14}
                    color={colors.mutedText}
                  />
                  <AppText className="text-xs text-slate-500 dark:text-slate-400">
                    2
                  </AppText>
                </View>
              </View>
            </View>
          </View>

          <View className="flex-row items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=400&q=80",
              }}
              className="h-16 w-16 rounded-xl"
              resizeMode="cover"
            />
            <View className="flex-1">
              <View className="flex-row items-start justify-between">
                <AppText className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Library 3rd Floor Corner
                </AppText>
                <Ionicons
                  name="ellipsis-horizontal"
                  size={16}
                  color={colors.mutedText}
                />
              </View>
              <View className="mt-2 flex-row items-center">
                <Ionicons name="location" size={14} color={colors.accent} />
                <AppText className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                  Main Library
                </AppText>
              </View>
              <View className="mt-2 flex-row items-center gap-4">
                <View className="flex-row items-center gap-1">
                  <Ionicons
                    name="thumbs-up"
                    size={14}
                    color={colors.mutedText}
                  />
                  <AppText className="text-xs text-slate-500 dark:text-slate-400">
                    18
                  </AppText>
                </View>
                <View className="flex-row items-center gap-1">
                  <Ionicons
                    name="chatbubble-ellipses"
                    size={14}
                    color={colors.mutedText}
                  />
                  <AppText className="text-xs text-slate-500 dark:text-slate-400">
                    3
                  </AppText>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
