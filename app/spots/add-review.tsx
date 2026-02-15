import { ScrollView, TextInput, TouchableOpacity, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { AppText } from "../../components/AppText";
import { useTheme } from "../../hooks/useTheme";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AddReviewScreen() {
  const router = useRouter();
  const { colors, statusBarStyle } = useTheme();
  const [reviewText, setReviewText] = useState("");

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">
      <View className="flex-1 bg-white dark:bg-slate-950">
        <StatusBar style={statusBarStyle} />
        <View className="flex-row items-center justify-between px-5 pb-3 pt-6">
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => router.back()}
          >
            <AppText className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              Cancel
            </AppText>
          </TouchableOpacity>
          <AppText className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Write a Review
          </AppText>
          <View className="w-12" />
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pb-28"
          showsVerticalScrollIndicator={false}
        >
          <View className="mt-4 items-center">
            <AppText className="text-xs font-semibold tracking-[3px] text-slate-400 dark:text-slate-500">
              RATE YOUR EXPERIENCE
            </AppText>
            <View className="mt-6 flex-row items-center gap-3">
              {Array.from({ length: 5 }).map((_, index) => {
                const filled = index < 4;

                return (
                  <Ionicons
                    key={`star-${index}`}
                    name={filled ? "star" : "star-outline"}
                    size={36}
                    color={filled ? colors.accent : colors.mutedStrong}
                  />
                );
              })}
            </View>
            <AppText className="mt-4 text-sm text-slate-400 dark:text-slate-500">
              Tap to rate
            </AppText>
          </View>

          <View className="mt-10">
            <AppText className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Your Review
            </AppText>
            <View className="mt-4 rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <TextInput
                placeholder="Tell others about the vibe, food, or noise level..."
                placeholderTextColor={colors.mutedStrong}
                className="min-h-[220px] text-sm text-slate-900 dark:text-slate-100"
                multiline
                textAlignVertical="top"
                value={reviewText}
                onChangeText={setReviewText}
                maxLength={500}
              />
              <View className="items-end">
                <AppText className="text-xs text-slate-400 dark:text-slate-500">
                  {reviewText.length} / 500
                </AppText>
              </View>
            </View>
          </View>
        </ScrollView>

        <View className="absolute bottom-0 left-0 right-0 bg-white px-5 pb-8 pt-4 shadow-lg dark:bg-slate-950">
          <TouchableOpacity
            className="h-12 w-full items-center justify-center rounded-2xl bg-emerald-600"
            accessibilityRole="button"
          >
            <AppText className="text-base font-semibold text-white">
              Post Review
            </AppText>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
