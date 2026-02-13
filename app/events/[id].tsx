import React from "react";
import { Image, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AppText } from "../../components/AppText";
import { useTheme } from "../../hooks/useTheme";
import Feather from "@expo/vector-icons/Feather";
const details = {
  title: "Tech Talk: Future of AI in Ethiopia",
  host: "HU Tech Society",
  date: "NOV",
  day: "12",
  tags: ["Technology", "Seminar"],
  time: "Friday, 4:00 PM - 6:00 PM",
  location: "IoT Campus, Lecture Hall B",
  address: "Main Building, 2nd Floor",
  attendees: ["AD", "NS", "KM"],
  extra: "+42",
  description:
    "Join us for an insightful session regarding the rapid growth of Artificial Intelligence and its specific applications within the Ethiopian context. We will be exploring how local startups are leveraging ML models to solve agricultural and logistical challenges.",
  bullets: [
    "Overview of AI trends in 2023",
    "Case studies from local tech firms",
    "Career guidance for aspiring data scientists",
  ],
  footer:
    "Don't miss out on the chance to connect with like-minded peers and industry professionals!",
  image:
    "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
};

export default function EventDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { colors } = useTheme();

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">
      <View className="flex-1 bg-white dark:bg-slate-950">
        <ScrollView contentContainerClassName="pb-28">
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
            <Pressable
              onPress={() => router.back()}
              className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 items-center justify-center"
            >
              <Feather name="arrow-left" size={24} color="black" />{" "}
            </Pressable>

            <AppText className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Events Details
            </AppText>
            <View className="w-14" />
          </View>

          <View className="relative">
            <Image
              source={{ uri: details.image }}
              className="h-[240px] w-full"
              resizeMode="cover"
            />
            <View className="absolute inset-0 bg-black/30" />

            <View className="absolute left-5 top-5 rounded-2xl bg-white px-3 py-2 shadow dark:bg-slate-900">
              <AppText className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                {details.date}
              </AppText>
              <AppText className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {details.day}
              </AppText>
            </View>

            <View className="absolute bottom-4 left-5 flex-row gap-2">
              {details.tags.map((tag) => (
                <View
                  key={tag}
                  className="rounded-full border border-green-600/30 bg-green-100 px-3 py-1 dark:border-green-400/30 dark:bg-green-400/20"
                >
                  <AppText className="text-[11px] font-semibold text-green-700 dark:text-green-300">
                    {tag}
                  </AppText>
                </View>
              ))}
            </View>
          </View>

          <View className="px-5 pt-4">
            <AppText className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {details.title}
            </AppText>
            <AppText className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Hosted by{" "}
              <AppText className="text-sm font-semibold text-green-700 dark:text-green-300">
                {details.host}
              </AppText>
            </AppText>

            <View className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <View className="flex-row items-start gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-green-100 dark:bg-green-400/20">
                  <Ionicons
                    name="time-outline"
                    size={18}
                    color={colors.accent}
                  />
                </View>
                <View className="flex-1">
                  <AppText className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {details.time}
                  </AppText>
                  <AppText className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Add to calendar
                  </AppText>
                </View>
              </View>

              <View className="my-4 h-px bg-slate-200 dark:bg-slate-800" />

              <View className="flex-row items-start gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-green-100 dark:bg-green-400/20">
                  <Ionicons
                    name="location-outline"
                    size={18}
                    color={colors.accent}
                  />
                </View>
                <View className="flex-1">
                  <AppText className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {details.location}
                  </AppText>
                  <AppText className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {details.address}
                  </AppText>
                </View>
              </View>

              <View className="my-4 h-px bg-slate-200 dark:bg-slate-800" />

              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  {details.attendees.map((initials, index) => (
                    <View
                      key={`${initials}-${index}`}
                      className="-ml-2 h-7 w-7 items-center justify-center rounded-full border border-white bg-slate-200 dark:border-slate-900 dark:bg-slate-700"
                    >
                      <AppText className="text-[9px] font-semibold text-slate-700 dark:text-slate-200">
                        {initials}
                      </AppText>
                    </View>
                  ))}
                  <AppText className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                    {details.extra}
                  </AppText>
                </View>
                <AppText className="text-xs text-slate-500 dark:text-slate-400">
                  students are going
                </AppText>
              </View>
            </View>

            <AppText className="mt-6 text-lg font-semibold text-slate-900 dark:text-slate-100">
              About this event
            </AppText>
            <AppText className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {details.description}
            </AppText>

            <View className="mt-4 gap-2">
              {details.bullets.map((item) => (
                <View key={item} className="flex-row items-start gap-2">
                  <View className="mt-2 h-2 w-2 rounded-full bg-green-600 dark:bg-green-400" />
                  <AppText className="flex-1 text-sm text-slate-600 dark:text-slate-300">
                    {item}
                  </AppText>
                </View>
              ))}
            </View>

            <AppText className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {details.footer}
            </AppText>

            <View className="mt-6 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
              <Image
                source={{
                  uri: "https://images.unsplash.com/photo-1526779259212-939e64788e3c?auto=format&fit=crop&w=1200&q=80",
                }}
                className="h-[160px] w-full"
                resizeMode="cover"
              />
              <View className="absolute inset-0 bg-black/20" />
              <View className="absolute inset-x-0 bottom-4 items-center">
                <Pressable className="flex-row items-center gap-2 rounded-full bg-white px-4 py-2 shadow">
                  <Ionicons name="navigate" size={16} color={colors.accent} />
                  <AppText className="text-sm font-semibold text-slate-900">
                    Get Directions
                  </AppText>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>

        <View className="absolute bottom-0 left-0 right-0 flex-row items-center gap-3 border-t border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-950">
          <Pressable className="flex-1 items-center justify-center rounded-xl bg-green-600 py-3">
            <AppText className="text-sm font-semibold text-white">
              I'm Going
            </AppText>
          </Pressable>
          <Pressable className="h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <Ionicons name="bookmark-outline" size={18} color={colors.text} />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
