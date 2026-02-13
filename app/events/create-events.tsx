import React from "react";
import { Image, Pressable, ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { AppText } from "../../components/AppText";
import { useTheme } from "../../hooks/useTheme";
import Feather from "@expo/vector-icons/build/Feather";

export default function CreateEventScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">
      <View className="flex-1 bg-white dark:bg-slate-950">
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <Pressable
            onPress={() => router.back()}
            className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 items-center justify-center"
          >
            <Feather name="arrow-left" size={24} color="black" />{" "}
          </Pressable>

          <AppText className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Create Event
          </AppText>
          <View className="w-14" />
        </View>
        <ScrollView contentContainerClassName="px-5 pb-28 pt-5">
          <Pressable className="h-40 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800">
              <Ionicons
                name="image-outline"
                size={22}
                color={colors.mutedText}
              />
            </View>
            <AppText className="mt-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
              Add Event Cover
            </AppText>
          </Pressable>

          <AppText className="mt-6 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Event Title
          </AppText>
          <View className="mt-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <TextInput
              placeholder="e.g., Graduation Party"
              placeholderTextColor={colors.mutedStrong}
              className="text-sm text-slate-900 dark:text-slate-100"
            />
          </View>

          <AppText className="mt-6 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            When
          </AppText>
          <Pressable className="mt-2 flex-row items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <AppText className="text-sm text-slate-900 dark:text-slate-100">
              Select Date & Time
            </AppText>
            <Ionicons
              name="calendar-outline"
              size={18}
              color={colors.mutedText}
            />
          </Pressable>

          <View className="mt-6 flex-row items-center justify-between">
            <AppText className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Where
            </AppText>
            <Pressable className="flex-row items-center gap-2">
              <Ionicons name="map-outline" size={14} color={colors.accent} />
              <AppText className="text-xs font-semibold uppercase tracking-wider text-green-600 dark:text-green-400">
                Select on Map
              </AppText>
            </Pressable>
          </View>
          <View className="mt-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <TextInput
              placeholder="e.g., Main Campus Hall"
              placeholderTextColor={colors.mutedStrong}
              className="text-sm text-slate-900 dark:text-slate-100"
            />
          </View>

          <View className="mt-3 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80",
              }}
              className="h-[140px] w-full"
              resizeMode="cover"
            />
            <View className="absolute inset-0 bg-white/40 dark:bg-slate-950/40" />
            <View className="absolute inset-0 items-center justify-center">
              <View className="flex-row items-center gap-2 rounded-full bg-white px-3 py-1.5 shadow dark:bg-slate-900">
                <Ionicons name="location" size={14} color={colors.accent} />
                <AppText className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Hawassa Main Campus
                </AppText>
              </View>
            </View>
            <View className="absolute bottom-3 right-3 items-center gap-1 rounded-lg bg-white px-2 py-1 shadow dark:bg-slate-900">
              <Ionicons name="add" size={14} color={colors.mutedText} />
              <View className="h-px w-4 bg-slate-200 dark:bg-slate-800" />
              <Ionicons name="remove" size={14} color={colors.mutedText} />
            </View>
          </View>

          <AppText className="mt-6 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Organizer
          </AppText>
          <View className="mt-2 flex-row items-center gap-3">
            <View className="h-11 w-11 items-center justify-center rounded-full bg-green-100 dark:bg-green-400/20">
              <Ionicons name="person" size={18} color={colors.accent} />
            </View>
            <View className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <TextInput
                placeholder="Club or Individual Name"
                placeholderTextColor={colors.mutedStrong}
                className="text-sm text-slate-900 dark:text-slate-100"
              />
            </View>
          </View>

          <AppText className="mt-6 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Entry Fee
          </AppText>
          <View className="mt-2 flex-row rounded-xl bg-slate-100 p-1 dark:bg-slate-900">
            <Pressable className="flex-1 items-center justify-center rounded-lg bg-white py-2.5 shadow-sm dark:bg-slate-950">
              <AppText className="text-sm font-semibold text-green-600 dark:text-green-400">
                Free
              </AppText>
            </Pressable>
            <Pressable className="flex-1 items-center justify-center rounded-lg py-2.5">
              <AppText className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                Paid
              </AppText>
            </Pressable>
          </View>

          <View className="mt-6 flex-row items-center gap-2">
            <AppText className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Details
            </AppText>
            <AppText className="text-xs text-slate-400 dark:text-slate-500">
              (optional)
            </AppText>
          </View>
          <View className="mt-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <TextInput
              placeholder="Tell students what this event is about..."
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
              Post Event
            </AppText>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
