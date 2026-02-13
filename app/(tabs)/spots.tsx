import React from "react";
import { Image, Pressable, ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { AppText } from "../../components/AppText";
import { useTheme } from "../../hooks/useTheme";

const categories = [
  { id: "c1", label: "All", active: true },
  { id: "c2", label: "Food" },
  { id: "c3", label: "Hangout" },
  { id: "c4", label: "Game" },
  { id: "c5", label: "Study" },
];

const spots = [
  {
    id: "s1",
    title: "Main Campus Library",
    tag: "Study",
    tagTone: "blue",
    location: "Main Gate Area",
    rating: "4.8",
    reviews: "124",
    price: "Free",
    image:
      "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "s2",
    title: "Blue Nile Lounge",
    tag: "Food",
    tagTone: "orange",
    location: "Piazza Area",
    rating: "4.2",
    reviews: "85",
    price: "$$$",
    image:
      "https://images.unsplash.com/photo-1504753793650-d4a2b783c15e?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "s3",
    title: "Tech Park Garden",
    tag: "Hangout",
    tagTone: "purple",
    location: "IoT Campus",
    rating: "4.9",
    reviews: "42",
    price: "Free",
    image:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "s4",
    title: "Level Up Zone",
    tag: "Game",
    tagTone: "red",
    location: "Student Union",
    rating: "4.5",
    reviews: "210",
    price: "$$",
    image:
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "s5",
    title: "Mama's Kitchen",
    tag: "Food",
    tagTone: "orange",
    location: "Near Dorms",
    rating: "4.7",
    reviews: "312",
    price: "$$",
    image:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80",
  },
];

const tagToneStyles: Record<string, { container: string; text: string }> = {
  blue: { container: "bg-blue-100", text: "text-blue-700" },
  orange: { container: "bg-orange-100", text: "text-orange-700" },
  purple: { container: "bg-purple-100", text: "text-purple-700" },
  red: { container: "bg-red-100", text: "text-red-700" },
};

export default function SpotsTabScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <View className="flex-1 bg-slate-50 dark:bg-slate-950">
        <ScrollView contentContainerClassName="px-5 pb-28 pt-4">
          <View className="flex-row items-center justify-between">
            <View>
              <AppText className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                Campus Spots
              </AppText>
              <AppText className="mt-1 text-xs font-semibold uppercase tracking-wider text-green-600 dark:text-green-400">
                Hawassa University
              </AppText>
            </View>
            <Pressable className="h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-400/20">
              <Ionicons name="person" size={20} color={colors.accent} />
            </Pressable>
          </View>

          <View className="mt-5 flex-row items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
            <Ionicons
              name="search-outline"
              size={18}
              color={colors.mutedText}
            />
            <TextInput
              placeholder="Find coffee, library, lunch..."
              placeholderTextColor={colors.mutedStrong}
              className="flex-1 text-sm text-slate-900 dark:text-slate-100"
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="mt-4 gap-3"
          >
            {categories.map((category) => (
              <Pressable
                key={category.id}
                className={`rounded-full px-4 py-2 ${
                  category.active
                    ? "bg-green-600"
                    : "bg-slate-100 dark:bg-slate-900"
                }`}
              >
                <AppText
                  className={`text-xs font-semibold ${
                    category.active
                      ? "text-white"
                      : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {category.label}
                </AppText>
              </Pressable>
            ))}
          </ScrollView>

          <View className="mt-5 gap-4">
            {spots.map((spot) => {
              const tone = tagToneStyles[spot.tagTone] ?? tagToneStyles.blue;

              return (
                <Pressable
                  key={spot.id}
                  onPress={() => router.push(`../spots/${spot.id}`)}
                  className="flex-row gap-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <Image
                    source={{ uri: spot.image }}
                    className="h-[90px] w-[90px] rounded-xl"
                    resizeMode="cover"
                  />

                  <View className="flex-1">
                    <AppText className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">
                      {spot.title}
                    </AppText>
                    <View className="mt-2 flex-row items-center gap-2">
                      <View
                        className={`rounded-md px-2 py-0.5 ${tone.container} dark:bg-opacity-20`}
                      >
                        <AppText
                          className={`text-[11px] font-semibold ${tone.text}`}
                        >
                          {spot.tag}
                        </AppText>
                      </View>
                      <AppText className="text-xs text-slate-500 dark:text-slate-400">
                        {spot.location}
                      </AppText>
                    </View>

                    <View className="mt-2 flex-row items-center justify-between">
                      <View className="flex-row items-center gap-1">
                        <Ionicons name="star" size={14} color="#F59E0B" />
                        <AppText className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                          {spot.rating}
                        </AppText>
                        <AppText className="text-xs text-slate-400 dark:text-slate-500">
                          ({spot.reviews})
                        </AppText>
                      </View>

                      {spot.price === "Free" ? (
                        <View className="rounded-md bg-green-100 px-2 py-1 dark:bg-green-400/20">
                          <AppText className="text-xs font-semibold text-green-700 dark:text-green-300">
                            {spot.price}
                          </AppText>
                        </View>
                      ) : (
                        <AppText className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                          {spot.price}
                        </AppText>
                      )}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <Pressable className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-green-600 shadow-lg dark:bg-green-400">
          <Ionicons name="add" size={26} color={colors.chipActiveText} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
