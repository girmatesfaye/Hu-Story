import React, { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { AppText } from "../../components/AppText";
import { useTheme } from "../../hooks/useTheme";
import { useColorScheme } from "react-native";
import { supabase } from "../../lib/supabase";

const categories = ["All", "Food", "Hangout", "Game", "Study"];

type SpotItem = {
  id: string;
  name: string;
  category: string | null;
  location: string | null;
  rating_avg: number;
  review_count: number;
  price_type: string | null;
  cover_url: string | null;
};

const fallbackSpotImage =
  "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=800&q=80";

const tagToneStyles: Record<string, { container: string; text: string }> = {
  blue: { container: "bg-blue-100", text: "text-blue-700" },
  orange: { container: "bg-orange-100", text: "text-orange-700" },
  purple: { container: "bg-purple-100", text: "text-purple-700" },
  red: { container: "bg-red-100", text: "text-red-700" },
};

export default function SpotsTabScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const scheme = useColorScheme();
  const [activeCategory, setActiveCategory] = useState(categories[0]);
  const [spots, setSpots] = useState<SpotItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const iconColors = {
    text: scheme === "dark" ? "#E5E7EB" : "#0F172A",
    muted: scheme === "dark" ? "#94A3B8" : "#64748B",
    accent: scheme === "dark" ? "#4ADE80" : "#16A34A",
    chipText: scheme === "dark" ? "#0B0B0B" : "#FFFFFF",
  };

  useEffect(() => {
    let isMounted = true;

    const loadSpots = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      let query = supabase
        .from("spots")
        .select(
          "id, name, category, location, rating_avg, review_count, price_type, cover_url",
        )
        .order("created_at", { ascending: false });

      if (activeCategory !== "All") {
        query = query.eq("category", activeCategory);
      }

      const { data, error } = await query;

      if (!isMounted) return;

      if (error) {
        setErrorMessage(error.message);
        setSpots([]);
      } else {
        setSpots((data ?? []) as SpotItem[]);
      }

      setIsLoading(false);
    };

    loadSpots();

    return () => {
      isMounted = false;
    };
  }, [activeCategory]);

  const tagToneStyles: Record<string, { container: string; text: string }> = {
    food: { container: "bg-orange-100", text: "text-orange-700" },
    hangout: { container: "bg-purple-100", text: "text-purple-700" },
    game: { container: "bg-red-100", text: "text-red-700" },
    study: { container: "bg-blue-100", text: "text-blue-700" },
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <ScrollView contentContainerClassName="px-5 pb-28 pt-4">
        <View className="flex-row items-center justify-between">
          <View>
            <AppText className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              Campus Spots
            </AppText>
            <AppText className="mt-1 text-sm font-semibold text-slate-500 stracking-wider dark:text-green-400">
              Find and share the best places around campus.
            </AppText>
          </View>
          <Pressable
            onPress={() => router.push("../notifications/notification")}
            className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 items-center justify-center"
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color={iconColors.text}
            />
          </Pressable>
        </View>

        <View className="mt-5 flex-row items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
          <Ionicons name="search-outline" size={18} color={colors.mutedText} />
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
          {categories.map((category) => {
            const isActive = category === activeCategory;
            return (
              <Pressable
                key={category}
                className={`rounded-full px-4 py-2 ${
                  isActive ? "bg-green-600" : "bg-slate-100 dark:bg-slate-900"
                }`}
                onPress={() => setActiveCategory(category)}
              >
                <AppText
                  className={`text-xs font-semibold ${
                    isActive
                      ? "text-white"
                      : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {category}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>

        <View className="mt-5 gap-4">
          {isLoading ? (
            <AppText className="text-sm text-slate-400 dark:text-slate-500">
              Loading spots...
            </AppText>
          ) : null}
          {errorMessage ? (
            <AppText className="text-sm text-red-500">{errorMessage}</AppText>
          ) : null}
          {spots.map((spot) => {
            const tone =
              tagToneStyles[(spot.category ?? "").toLowerCase()] ??
              ({ container: "bg-blue-100", text: "text-blue-700" } as const);

            return (
              <Pressable
                key={spot.id}
                onPress={() => router.push(`../spots/${spot.id}`)}
                className="flex-row gap-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <Image
                  source={{ uri: spot.cover_url ?? fallbackSpotImage }}
                  className="h-[90px] w-[90px] rounded-xl"
                  resizeMode="cover"
                />

                <View className="flex-1">
                  <AppText className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">
                    {spot.name}
                  </AppText>
                  <View className="mt-2 flex-row items-center gap-2">
                    <View
                      className={`rounded-md px-2 py-0.5 ${tone.container} dark:bg-opacity-20`}
                    >
                      <AppText
                        className={`text-[11px] font-semibold ${tone.text}`}
                      >
                        {spot.category ?? "Other"}
                      </AppText>
                    </View>
                    <AppText className="text-xs text-slate-500 dark:text-slate-400">
                      {spot.location ?? "Location TBD"}
                    </AppText>
                  </View>

                  <View className="mt-2 flex-row items-center justify-between">
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="star" size={14} color="#F59E0B" />
                      <AppText className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {spot.rating_avg.toFixed(1)}
                      </AppText>
                      <AppText className="text-xs text-slate-400 dark:text-slate-500">
                        ({spot.review_count})
                      </AppText>
                    </View>

                    {spot.price_type?.toLowerCase() === "free" ? (
                      <View className="rounded-md bg-green-100 px-2 py-1 dark:bg-green-400/20">
                        <AppText className="text-xs font-semibold text-green-700 dark:text-green-300">
                          Free
                        </AppText>
                      </View>
                    ) : (
                      <AppText className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                        {spot.price_type ?? "Paid"}
                      </AppText>
                    )}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      {/* Floating Action Button */}
      <Pressable
        onPress={() => router.push("/spots/create-spots")}
        className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-green-600 shadow-lg dark:bg-green-400"
      >
        <Ionicons name="add" size={26} color={colors.chipActiveText} />
      </Pressable>
    </View>
  );
}
