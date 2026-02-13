import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import Feather from "@expo/vector-icons/Feather";
import { AppText } from "../../components/AppText";
import { useTheme } from "../../hooks/useTheme";

const categories = ["Cafe", "Library", "Hangout", "Study", "Food", "Other"];

export default function CreateSpotScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const iconColors = {
    text: scheme === "dark" ? "#E5E7EB" : "#0F172A",
    muted: scheme === "dark" ? "#94A3B8" : "#64748B",
    accent: scheme === "dark" ? "#4ADE80" : "#16A34A",
    chipText: scheme === "dark" ? "#0B0B0B" : "#FFFFFF",
  };
  const { colors } = useTheme();
  const [feeType, setFeeType] = useState<"free" | "paid">("free");

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">
      <View className="flex-1 bg-white dark:bg-slate-950">
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <Pressable
            onPress={() => router.back()}
            className="flex-row items-center"
          >
            <Feather name="x" size={20} color={colors.mutedText} />
            <AppText className="ml-2 text-base text-slate-500 dark:text-slate-300">
              Cancel
            </AppText>
          </Pressable>

          <AppText className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Add New Spot
          </AppText>
          <View className="w-14" />
        </View>

        <ScrollView contentContainerClassName="px-5 pb-32 pt-5">
          <Pressable className="h-40 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800">
              <Ionicons name="camera" size={22} color={colors.mutedText} />
            </View>
            <AppText className="mt-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
              Tap to upload image
            </AppText>
            <AppText className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              JPG, PNG (Max 5MB)
            </AppText>
          </Pressable>

          <AppText className="mt-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Name of the spot
          </AppText>
          <View className="mt-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <TextInput
              placeholder="e.g. Library Cafe"
              placeholderTextColor={colors.mutedStrong}
              className="text-sm text-slate-900 dark:text-slate-100"
            />
          </View>

          <AppText className="mt-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Category
          </AppText>
          <Pressable className="mt-2 flex-row items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <AppText className="text-sm text-slate-900 dark:text-slate-100">
              Select a category
            </AppText>
            <Ionicons name="chevron-down" size={18} color={colors.mutedText} />
          </Pressable>

          <View className="mt-3 flex-row flex-wrap gap-2">
            {categories.map((category) => (
              <View
                key={category}
                className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 dark:border-slate-800 dark:bg-slate-900"
              >
                <AppText className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {category}
                </AppText>
              </View>
            ))}
          </View>

          <AppText className="mt-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Where is it?
          </AppText>
          <View className="mt-2 flex-row items-center gap-3">
            <View className="flex-1 flex-row items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <Ionicons
                name="location-outline"
                size={16}
                color={colors.mutedText}
              />
              <TextInput
                placeholder="e.g. Main Campus"
                placeholderTextColor={colors.mutedStrong}
                className="flex-1 text-sm text-slate-900 dark:text-slate-100"
              />
            </View>
            <Pressable className="h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <Ionicons name="map" size={18} color={colors.accent} />
            </Pressable>
          </View>

          <AppText className="mt-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Fee
          </AppText>
          <View className="mt-2 flex-row rounded-xl bg-slate-100 p-1 dark:bg-slate-900">
            <Pressable
              onPress={() => setFeeType("free")}
              className={`flex-1 items-center justify-center rounded-lg py-2.5 ${
                feeType === "free" ? "bg-green-600" : "bg-transparent"
              }`}
            >
              <AppText
                className={`text-sm font-semibold ${
                  feeType === "free"
                    ? "text-white"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                Free
              </AppText>
            </Pressable>
            <Pressable
              onPress={() => setFeeType("paid")}
              className={`flex-1 items-center justify-center rounded-lg py-2.5 ${
                feeType === "paid"
                  ? "bg-white dark:bg-slate-950"
                  : "bg-transparent"
              }`}
            >
              <AppText
                className={`text-sm font-semibold ${
                  feeType === "paid"
                    ? "text-slate-900 dark:text-slate-100"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                Paid
              </AppText>
            </Pressable>
          </View>

          <View className="mt-6 flex-row items-center gap-2">
            <AppText className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Spot Description
            </AppText>
            <AppText className="text-xs text-slate-400 dark:text-slate-500">
              (optional)
            </AppText>
          </View>
          <View className="mt-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <TextInput
              placeholder="Tell students what makes this place special..."
              placeholderTextColor={colors.mutedStrong}
              className="min-h-[110px] text-sm text-slate-900 dark:text-slate-100"
              multiline
              textAlignVertical="top"
            />
          </View>
        </ScrollView>

        <View className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-950">
          <Pressable className="flex-row items-center justify-center gap-2 rounded-xl bg-green-600 py-3">
            <AppText className="text-sm font-semibold text-white">
              Submit Spot
            </AppText>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
