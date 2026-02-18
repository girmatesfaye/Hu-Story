import React, { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AppText } from "../../components/AppText";
import { useTheme } from "../../hooks/useTheme";
import { supabase } from "../../lib/supabase";

type SpotDetail = {
  id: string;
  name: string;
  category: string | null;
  rating_avg: number;
  location: string | null;
  description: string | null;
  cover_url: string | null;
};

type SpotReview = {
  id: string;
  rating: number;
  content: string | null;
  created_at: string;
  user_id: string | null;
};

const fallbackSpotImage =
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80";
const fallbackMapImage =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80";

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export default function SpotDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { colors } = useTheme();
  const [spot, setSpot] = useState<SpotDetail | null>(null);
  const [reviews, setReviews] = useState<SpotReview[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadSpot = async () => {
      if (!id) return;

      setIsLoading(true);
      setErrorMessage(null);

      const { data: spotData, error: spotError } = await supabase
        .from("spots")
        .select(
          "id, name, category, rating_avg, location, description, cover_url",
        )
        .eq("id", id)
        .maybeSingle();

      if (spotError && isMounted) {
        setErrorMessage(spotError.message);
      }

      const { data: reviewData, error: reviewError } = await supabase
        .from("spot_reviews")
        .select("id, rating, content, created_at, user_id")
        .eq("spot_id", id)
        .order("created_at", { ascending: false });

      if (reviewError && isMounted) {
        setErrorMessage(reviewError.message);
      }

      if (isMounted) {
        setSpot((spotData as SpotDetail) ?? null);
        setReviews((reviewData ?? []) as SpotReview[]);
        setIsLoading(false);
      }
    };

    loadSpot();

    return () => {
      isMounted = false;
    };
  }, [id]);

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
              {spot?.name ?? "Spot Details"}
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
            <Image
              source={{ uri: spot?.cover_url ?? fallbackSpotImage }}
              className="h-[220px] w-[280px] rounded-2xl"
              resizeMode="cover"
            />
          </ScrollView>

          <View className="px-5 pt-4">
            <View className="flex-row items-center gap-3">
              <View className="rounded-full bg-green-100 px-3 py-1 dark:bg-green-400/20">
                <AppText className="text-xs font-semibold text-green-700 dark:text-green-300">
                  {spot?.category ?? "Spot"}
                </AppText>
              </View>
              <View className="flex-row items-center gap-1">
                <Ionicons name="star" size={14} color="#F59E0B" />
                <AppText className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  {spot ? spot.rating_avg.toFixed(1) : "-"}
                </AppText>
              </View>
              <View className="flex-row items-center gap-1">
                <Ionicons
                  name="location-outline"
                  size={14}
                  color={colors.mutedText}
                />
                <AppText className="text-xs text-slate-500 dark:text-slate-400">
                  {spot?.location ?? "Location TBD"}
                </AppText>
              </View>
            </View>

            <AppText className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {isLoading
                ? "Loading details..."
                : (spot?.description ?? "No description yet.")}
            </AppText>

            {errorMessage ? (
              <AppText className="mt-3 text-sm text-red-500">
                {errorMessage}
              </AppText>
            ) : null}

            <View className="mt-5 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
              <Image
                source={{ uri: fallbackMapImage }}
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
                Student Vibes ({reviews.length})
              </AppText>
              <Pressable>
                <AppText className="text-xs font-semibold text-green-600 dark:text-green-400">
                  See All
                </AppText>
              </Pressable>
            </View>

            <View className="mt-4 gap-4">
              {reviews.map((review) => (
                <View
                  key={review.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-3">
                      <View className="h-11 w-11 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800">
                        <AppText className="text-xs font-semibold text-green-600 dark:text-green-400">
                          {review.user_id ? "ST" : "AN"}
                        </AppText>
                      </View>
                      <View>
                        <AppText className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {review.user_id ? "Student" : "Anonymous"}
                        </AppText>
                        <AppText className="text-xs text-slate-400 dark:text-slate-500">
                          {formatTimeAgo(review.created_at)}
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
                    {review.content ?? ""}
                  </AppText>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        <View className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-950">
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/spots/add-review",
                params: { spotId: id },
              })
            }
            className="flex-row items-center justify-center gap-2 rounded-xl bg-green-600 py-3"
          >
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
