import React from "react";
import { Image, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AppText } from "../../components/AppText";
import { useTheme } from "../../hooks/useTheme";

const details = {
  name: "Social Science Cafe",
  category: "Cafe",
  rating: "4.2",
  location: "Block 42",
  description:
    "A popular spot for Social Science students. Great espresso, affordable pastries, and plenty of power outlets. It gets crowded around lunch, but mornings are peaceful.",
  gallery: [
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80",
  ],
  map: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
  reviews: [
    {
      id: "r1",
      name: "Abebe B.",
      initials: "AB",
      time: "2 days ago",
      rating: 4,
      content:
        "Great coffee, but the WiFi is spotty when it rains. Best spot for group projects if you don't need heavy internet.",
    },
    {
      id: "r2",
      name: "Sara M.",
      initials: "SM",
      time: "1 week ago",
      rating: 5,
      content:
        "Absolutely love the outdoor seating! It's so peaceful in the mornings.",
    },
    {
      id: "r3",
      name: "Mussie K.",
      initials: "MK",
      time: "2 weeks ago",
      rating: 3,
      content: "It's okay, but they ran out of samosas by 10am.",
    },
  ],
};

export default function SpotDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { colors } = useTheme();

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">
      <View className="flex-1 bg-white dark:bg-slate-950">
        <ScrollView contentContainerClassName="pb-28">
          <View className="flex-row items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <Pressable
              onPress={() => router.back()}
              className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900"
            >
              <Ionicons name="arrow-back" size={20} color={colors.text} />
            </Pressable>
            <AppText className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {details.name}
            </AppText>
            <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900">
              <Ionicons name="share-outline" size={18} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="px-5 pt-4 gap-4"
          >
            {details.gallery.map((image, index) => (
              <Image
                key={`${image}-${index}`}
                source={{ uri: image }}
                className="h-[220px] w-[280px] rounded-2xl"
                resizeMode="cover"
              />
            ))}
          </ScrollView>

          <View className="px-5 pt-4">
            <View className="flex-row items-center gap-3">
              <View className="rounded-full bg-green-100 px-3 py-1 dark:bg-green-400/20">
                <AppText className="text-xs font-semibold text-green-700 dark:text-green-300">
                  {details.category}
                </AppText>
              </View>
              <View className="flex-row items-center gap-1">
                <Ionicons name="star" size={14} color="#F59E0B" />
                <AppText className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  {details.rating}
                </AppText>
              </View>
              <View className="flex-row items-center gap-1">
                <Ionicons
                  name="location-outline"
                  size={14}
                  color={colors.mutedText}
                />
                <AppText className="text-xs text-slate-500 dark:text-slate-400">
                  {details.location}
                </AppText>
              </View>
            </View>

            <AppText className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {details.description}
            </AppText>

            <View className="mt-5 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
              <Image
                source={{ uri: details.map }}
                className="h-[140px] w-full"
                resizeMode="cover"
              />
              <View className="absolute inset-0 bg-white/35 dark:bg-slate-950/45" />
              <View className="absolute inset-x-0 bottom-4 items-center">
                <Pressable className="flex-row items-center gap-2 rounded-full bg-white px-4 py-2 shadow dark:bg-slate-900">
                  <Ionicons name="navigate" size={16} color={colors.accent} />
                  <AppText className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Get Directions
                  </AppText>
                </Pressable>
              </View>
            </View>

            <View className="mt-6 flex-row items-center justify-between">
              <AppText className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Student Vibes (12)
              </AppText>
              <Pressable>
                <AppText className="text-xs font-semibold text-green-600 dark:text-green-400">
                  See All
                </AppText>
              </Pressable>
            </View>

            <View className="mt-4 gap-4">
              {details.reviews.map((review) => (
                <View
                  key={review.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-3">
                      <View className="h-11 w-11 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800">
                        <AppText className="text-xs font-semibold text-green-600 dark:text-green-400">
                          {review.initials}
                        </AppText>
                      </View>
                      <View>
                        <AppText className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {review.name}
                        </AppText>
                        <AppText className="text-xs text-slate-400 dark:text-slate-500">
                          {review.time}
                        </AppText>
                      </View>
                    </View>
                    <View className="flex-row items-center gap-1">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Ionicons
                          key={`${review.id}-star-${index}`}
                          name={index < review.rating ? "star" : "star-outline"}
                          size={14}
                          color="#F59E0B"
                        />
                      ))}
                    </View>
                  </View>

                  <AppText className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {review.content}
                  </AppText>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        <View className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-950">
          <Pressable className="flex-row items-center justify-center gap-2 rounded-xl bg-green-600 py-3">
            <Ionicons name="create-outline" size={18} color="#FFFFFF" />
            <AppText className="text-sm font-semibold text-white">
              Add Review
            </AppText>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
