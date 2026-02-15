import { ScrollView, TextInput, TouchableOpacity, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { AppText } from "../../components/AppText";
import { useTheme } from "../../hooks/useTheme";

export default function CreateProjectsScreen() {
  const router = useRouter();
  const { colors, statusBarStyle } = useTheme();

  return (
    <View className="flex-1 bg-white dark:bg-slate-950">
      <StatusBar style={statusBarStyle} />
      <View className="flex-row items-center justify-between px-5 pb-3 pt-6">
        <TouchableOpacity
          className="h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20"
          accessibilityRole="button"
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={20} color={colors.accent} />
        </TouchableOpacity>
        <AppText className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Submit Project
        </AppText>
        <View className="h-10 w-10" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-28"
        showsVerticalScrollIndicator={false}
      >
        <View className="mt-2 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-500/30 dark:bg-emerald-900/30">
          <View className="flex-row items-start gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-500/20">
              <Ionicons name="bulb" size={18} color={colors.accent} />
            </View>
            <View className="flex-1">
              <AppText className="text-base font-semibold text-emerald-700 dark:text-emerald-200">
                Share your work
              </AppText>
              <AppText className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Showcase what you have built to fellow students. Great projects
                get featured in the weekly Hawassa digest.
              </AppText>
            </View>
          </View>
        </View>

        <View className="mt-8">
          <AppText className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Project Title
          </AppText>
          <View className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
            <TextInput
              placeholder="e.g., Campus Bus Tracker"
              placeholderTextColor={colors.mutedStrong}
              className="text-sm text-slate-900 dark:text-slate-100"
            />
          </View>
        </View>

        <View className="mt-6">
          <AppText className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            What's it about?
          </AppText>
          <View className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
            <TextInput
              placeholder="Describe the problem you solved and how it helps students..."
              placeholderTextColor={colors.mutedStrong}
              className="min-h-[120px] text-sm text-slate-900 dark:text-slate-100"
              multiline
              textAlignVertical="top"
              maxLength={300}
            />
          </View>
          <View className="mt-2 items-end">
            <AppText className="text-xs text-slate-400 dark:text-slate-500">
              0/300
            </AppText>
          </View>
        </View>

        <View className="mt-6">
          <AppText className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Tech Stack / Skills
          </AppText>
          <View className="mt-3 flex-row flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3 dark:border-slate-800 dark:bg-slate-900">
            <View className="flex-row items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 dark:bg-emerald-500/20">
              <AppText className="text-xs font-semibold text-emerald-700 dark:text-emerald-200">
                React Native
              </AppText>
              <Ionicons name="close" size={12} color={colors.accent} />
            </View>
            <View className="flex-row items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 dark:bg-emerald-500/20">
              <AppText className="text-xs font-semibold text-emerald-700 dark:text-emerald-200">
                Node.js
              </AppText>
              <Ionicons name="close" size={12} color={colors.accent} />
            </View>
            <View className="flex-1">
              <TextInput
                placeholder="Add tags..."
                placeholderTextColor={colors.mutedStrong}
                className="text-sm text-slate-900 dark:text-slate-100"
              />
            </View>
          </View>
          <AppText className="mt-2 text-xs text-slate-400 dark:text-slate-500">
            Press enter or comma to add a tag.
          </AppText>
        </View>

        <View className="mt-6">
          <AppText className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Link (GitHub, Demo, etc.)
          </AppText>
          <View className="mt-3 flex-row items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
            <Ionicons name="link" size={18} color={colors.mutedText} />
            <TextInput
              placeholder="https://"
              placeholderTextColor={colors.mutedStrong}
              className="flex-1 text-sm text-slate-900 dark:text-slate-100"
            />
          </View>
        </View>

        <View className="mt-6">
          <AppText className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Cover Image (Optional)
          </AppText>
          <TouchableOpacity
            className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 dark:border-slate-700 dark:bg-slate-900"
            accessibilityRole="button"
          >
            <View className="items-center">
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-slate-200 dark:bg-slate-800">
                <Ionicons
                  name="image-outline"
                  size={20}
                  color={colors.mutedText}
                />
              </View>
              <AppText className="mt-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
                Upload cover image
              </AppText>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 bg-white px-5 pb-8 pt-4 shadow-lg dark:bg-slate-950">
        <TouchableOpacity
          className="h-12 w-full items-center justify-center rounded-2xl bg-emerald-600"
          accessibilityRole="button"
        >
          <View className="flex-row items-center gap-2">
            <AppText className="text-base font-semibold text-white">
              Post Project
            </AppText>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}
