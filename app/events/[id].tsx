import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AppText } from "../../components/AppText";
import { FetchErrorModal } from "../../components/FetchErrorModal";
import { SkeletonBlock } from "../../components/SkeletonBlock";
import { useTheme } from "../../hooks/useTheme";
import Feather from "@expo/vector-icons/Feather";
import { supabase } from "../../lib/supabase";
import { formatEventDateRange } from "../../lib/eventDateTime";

type EventDetail = {
  id: string;
  title: string;
  description: string | null;
  start_at: string | null;
  end_at: string | null;
  location: string | null;
  address: string | null;
  cover_url: string | null;
  tags: string[] | null;
  attendees_count: number;
  likes: number;
  views: number;
  host_name: string | null;
};

// Detail formatting: normalize raw coordinate text to a clean degree-based display.
const formatLocationLabel = (value: string | null | undefined) => {
  if (!value?.trim()) return "Location TBD";

  const withSuffixMatch = value.match(
    /^(.*)\((-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)\)$/,
  );
  const pureCoordsMatch = value.match(
    /^(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)$/,
  );

  const formatCoords = (latitude: number, longitude: number) => {
    const lat = `${Math.abs(latitude).toFixed(4)}°${latitude >= 0 ? "N" : "S"}`;
    const lng = `${Math.abs(longitude).toFixed(4)}°${longitude >= 0 ? "E" : "W"}`;
    return `${lat}, ${lng}`;
  };

  if (withSuffixMatch) {
    const prefix = withSuffixMatch[1].trim();
    const latitude = Number(withSuffixMatch[2]);
    const longitude = Number(withSuffixMatch[3]);
    if (!Number.isNaN(latitude) && !Number.isNaN(longitude)) {
      return `${prefix} (${formatCoords(latitude, longitude)})`;
    }
  }

  if (pureCoordsMatch) {
    const latitude = Number(pureCoordsMatch[1]);
    const longitude = Number(pureCoordsMatch[2]);
    if (!Number.isNaN(latitude) && !Number.isNaN(longitude)) {
      return formatCoords(latitude, longitude);
    }
  }

  return value;
};

const fallbackEventImage =
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80";

const resolveEventCoverUrl = (coverUrl: string | null) => {
  const normalized = coverUrl?.trim();
  if (!normalized) return null;
  if (/^https?:\/\//i.test(normalized)) return normalized;
  const { data } = supabase.storage
    .from("event-covers")
    .getPublicUrl(normalized);
  return data.publicUrl;
};

export default function EventDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { colors } = useTheme();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isGoing, setIsGoing] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLikeUpdating, setIsLikeUpdating] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const isPastEvent = useMemo(() => {
    const reference = event?.end_at ?? event?.start_at;
    if (!reference) return false;

    const date = new Date(reference);
    if (Number.isNaN(date.getTime())) return false;

    return date.getTime() < Date.now();
  }, [event?.end_at, event?.start_at]);

  const loadEvent = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    setFetchError(null);
    setIsGoing(false);

    const { data, error } = await supabase
      .from("events")
      .select(
        "id, title, description, start_at, end_at, location, address, cover_url, tags, attendees_count, views, host_name",
      )
      .eq("id", id)
      .maybeSingle();

    if (error) {
      setFetchError(error.message);
      setEvent(null);
    } else {
      const { count: likesCount } = await supabase
        .from("event_likes")
        .select("*", { count: "exact", head: true })
        .eq("event_id", id);

      setEvent(
        data
          ? ({
              ...(data as Omit<EventDetail, "likes">),
              likes: likesCount ?? 0,
            } as EventDetail)
          : null,
      );
    }

    setIsLoading(false);
  }, [id]);

  const loadInteractionStatus = useCallback(async () => {
    if (!id) return;

    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError) {
      setUserId(null);
      return;
    }

    const currentUserId = authData?.user?.id ?? null;
    setUserId(currentUserId);

    if (!currentUserId) {
      setIsGoing(false);
      setIsLiked(false);
      return;
    }

    const { data: existing, error: existingError } = await supabase
      .from("event_attendees")
      .select("event_id")
      .eq("event_id", id)
      .eq("user_id", currentUserId)
      .maybeSingle();

    if (!existingError && existing) {
      setIsGoing(true);
    } else {
      setIsGoing(false);
    }

    const { data: existingLike, error: likeError } = await supabase
      .from("event_likes")
      .select("event_id")
      .eq("event_id", id)
      .eq("user_id", currentUserId)
      .maybeSingle();

    if (!likeError && existingLike) {
      setIsLiked(true);
    } else {
      setIsLiked(false);
    }
  }, [id]);

  useEffect(() => {
    void loadEvent();
    void loadInteractionStatus();
  }, [loadEvent, loadInteractionStatus]);

  useEffect(() => {
    if (!id) return;

    let isMounted = true;

    const incrementViews = async () => {
      const { data, error } = await supabase.rpc("increment_event_views", {
        p_event_id: id,
      });

      if (!error && isMounted && typeof data === "number") {
        setEvent((prev) => (prev ? { ...prev, views: data } : prev));
      }
    };

    void incrementViews();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleGoing = async () => {
    if (!event || isUpdating || isGoing) return;

    if (isPastEvent) {
      setErrorMessage("This event has already passed.");
      return;
    }

    setIsUpdating(true);
    setErrorMessage(null);

    const currentUserId =
      userId ?? (await supabase.auth.getUser()).data.user?.id;

    if (!currentUserId) {
      setErrorMessage("Sign in to mark yourself as going.");
      setIsUpdating(false);
      return;
    }

    const { data, error } = await supabase.rpc("add_event_attendee", {
      p_event_id: event.id,
    });

    if (error) {
      setErrorMessage(error.message);
    } else {
      setEvent({
        ...event,
        attendees_count:
          typeof data === "number" ? data : (event.attendees_count ?? 0),
      });
      setIsGoing(true);
    }

    setIsUpdating(false);
  };

  const handleCancelGoing = async () => {
    if (!event || isUpdating || !isGoing) return;

    if (isPastEvent) {
      setErrorMessage("This event has already passed.");
      return;
    }

    setIsUpdating(true);
    setErrorMessage(null);

    const currentUserId =
      userId ?? (await supabase.auth.getUser()).data.user?.id;

    if (!currentUserId) {
      setErrorMessage("Sign in to manage attendance.");
      setIsUpdating(false);
      return;
    }

    const { data, error } = await supabase.rpc("remove_event_attendee", {
      p_event_id: event.id,
    });

    if (error) {
      setErrorMessage(error.message);
    } else {
      setEvent({
        ...event,
        attendees_count:
          typeof data === "number" ? data : (event.attendees_count ?? 0),
      });
      setIsGoing(false);
    }

    setIsUpdating(false);
  };

  const handleToggleLike = async () => {
    if (!event || isLikeUpdating) return;

    if (isPastEvent) {
      setErrorMessage("This event has already passed.");
      return;
    }

    if (!userId) {
      setErrorMessage("Sign in to like events.");
      return;
    }

    setIsLikeUpdating(true);
    setErrorMessage(null);

    const previousLiked = isLiked;
    const previousLikes = event.likes ?? 0;
    const nextLiked = !isLiked;

    setIsLiked(nextLiked);
    setEvent((prev) =>
      prev
        ? {
            ...prev,
            likes: Math.max((prev.likes ?? 0) + (nextLiked ? 1 : -1), 0),
          }
        : prev,
    );

    const { data, error } = await supabase.rpc("set_event_like", {
      p_event_id: event.id,
      p_is_liked: nextLiked,
    });

    if (error) {
      setErrorMessage(error.message);
      setIsLiked(previousLiked);
      setEvent((prev) => (prev ? { ...prev, likes: previousLikes } : prev));
      setIsLikeUpdating(false);
      return;
    }

    if (typeof data === "number") {
      setEvent((prev) => (prev ? { ...prev, likes: data } : prev));
    }

    setIsLikeUpdating(false);
  };

  const dateBadge = useMemo(() => {
    if (!event?.start_at) return { month: "TBD", day: "--" };
    const date = new Date(event.start_at);
    if (Number.isNaN(date.getTime())) return { month: "TBD", day: "--" };
    return {
      month: date.toLocaleString(undefined, { month: "short" }).toUpperCase(),
      day: date.getDate().toString(),
    };
  }, [event?.start_at]);

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
              <Feather name="arrow-left" size={24} color={colors.text} />
            </Pressable>

            <AppText className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Events Details
            </AppText>
            <View className="w-14" />
          </View>

          {isLoading && !event ? (
            <View>
              <SkeletonBlock className="h-[240px] w-full" />
              <View className="px-5 pt-4">
                <SkeletonBlock className="h-8 w-2/3 rounded-md" />
                <SkeletonBlock className="mt-3 h-4 w-1/3 rounded-md" />
                <View className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <SkeletonBlock className="h-4 w-2/3 rounded-md" />
                  <SkeletonBlock className="mt-3 h-4 w-1/2 rounded-md" />
                  <SkeletonBlock className="mt-3 h-4 w-1/3 rounded-md" />
                </View>
                <SkeletonBlock className="mt-6 h-5 w-1/3 rounded-md" />
                <SkeletonBlock className="mt-3 h-4 w-full rounded-md" />
                <SkeletonBlock className="mt-2 h-4 w-5/6 rounded-md" />
              </View>
            </View>
          ) : (
            <>
              <View className="relative">
                <Image
                  source={{
                    uri:
                      resolveEventCoverUrl(event?.cover_url ?? null) ??
                      fallbackEventImage,
                  }}
                  className="h-[240px] w-full"
                  resizeMode="cover"
                />
                <View className="absolute inset-0 bg-black/30" />

                <View className="absolute left-5 top-5 rounded-2xl bg-white px-3 py-2 shadow dark:bg-slate-900">
                  <AppText className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                    {dateBadge.month}
                  </AppText>
                  <AppText className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {dateBadge.day}
                  </AppText>
                </View>

                <View className="absolute bottom-4 left-5 flex-row gap-2">
                  {(event?.tags ?? []).map((tag) => (
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
                  {event?.title ?? "Event"}
                </AppText>
                <AppText className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Hosted by{" "}
                  <AppText className="text-sm font-semibold text-green-700 dark:text-green-300">
                    {event?.host_name ?? "Campus"}
                  </AppText>
                </AppText>

                {errorMessage ? (
                  <AppText className="mt-3 text-sm text-red-500">
                    {errorMessage}
                  </AppText>
                ) : null}

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
                        {formatEventDateRange(
                          event?.start_at ?? null,
                          event?.end_at ?? null,
                          {
                            fallback: "Time TBD",
                          },
                        )}
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
                        {formatLocationLabel(event?.location)}
                      </AppText>
                      <AppText className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {event?.address ?? "Address TBD"}
                      </AppText>
                    </View>
                  </View>

                  <View className="my-4 h-px bg-slate-200 dark:bg-slate-800" />

                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-3">
                      <AppText className="text-xs text-slate-500 dark:text-slate-400">
                        {event?.attendees_count ?? 0} going
                      </AppText>
                      <AppText className="text-xs text-slate-500 dark:text-slate-400">
                        {event?.likes ?? 0} likes
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
                  {event?.description ?? "No description yet."}
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
                      <Ionicons
                        name="navigate"
                        size={16}
                        color={colors.accent}
                      />
                      <AppText className="text-sm font-semibold text-slate-900">
                        Get Directions
                      </AppText>
                    </Pressable>
                  </View>
                </View>
              </View>
            </>
          )}
        </ScrollView>

        <View className="absolute bottom-0 left-0 right-0 flex-row items-center gap-3 border-t border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-950">
          <Pressable
            onPress={isGoing ? handleCancelGoing : handleGoing}
            disabled={isUpdating || isPastEvent}
            className={`flex-1 items-center justify-center rounded-xl py-3 ${
              isGoing ? "bg-slate-200 dark:bg-slate-800" : "bg-green-600"
            } ${isUpdating || isPastEvent ? "opacity-60" : ""}`}
          >
            <AppText
              className={`text-sm font-semibold ${
                isGoing ? "text-slate-900 dark:text-slate-100" : "text-white"
              }`}
            >
              {isPastEvent
                ? "Event Passed"
                : isGoing
                  ? "Cancel Going"
                  : "I'm Going"}
            </AppText>
          </Pressable>
          {/* <Pressable
            onPress={handleToggleLike}
            disabled={isLikeUpdating || isPastEvent}
            className={`h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 ${
              isLikeUpdating || isPastEvent ? "opacity-60" : ""
            }`}
          >
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={18}
              color={isLiked ? "#DC2626" : colors.text}
            />
          </Pressable> */}
        </View>

        <FetchErrorModal
          visible={Boolean(fetchError)}
          message={fetchError}
          onClose={() => setFetchError(null)}
          onRetry={() => {
            void loadEvent();
            void loadInteractionStatus();
          }}
        />
      </View>
    </SafeAreaView>
  );
}
