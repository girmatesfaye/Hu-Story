import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  TextInput,
  View,
  ViewToken,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { AppText } from "../../components/AppText";
import { FetchErrorModal } from "../../components/FetchErrorModal";
import { SkeletonBlock } from "../../components/SkeletonBlock";
import { TabHeader } from "../../components/TabHeader";
import { useTheme } from "../../hooks/useTheme";
import { supabase } from "../../lib/supabase";
import { SPOT_FILTER_CATEGORIES } from "../../constants/categories";
import { formatCompactCampusLocation } from "../../lib/ui/formatters";

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

export default function SpotsTabScreen() {
  const PAGE_SIZE = 15;
  const router = useRouter();
  const { colors } = useTheme();
  const [activeCategory, setActiveCategory] = useState<string>(
    SPOT_FILTER_CATEGORIES[0],
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [spots, setSpots] = useState<SpotItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [highestSeenIndex, setHighestSeenIndex] = useState(-1);
  const [unreadCount, setUnreadCount] = useState(0);
  const flatListRef = useRef<FlatList<SpotItem>>(null);
  const spotsLengthRef = useRef(0);
  const nextPageRef = useRef(0);
  const hasMoreRef = useRef(true);
  const isFetchingRef = useRef(false);

  const loadSpots = useCallback(
    async (reset = false) => {
      if (isFetchingRef.current) return;
      if (!reset && !hasMoreRef.current) return;

      isFetchingRef.current = true;
      if (reset) {
        nextPageRef.current = 0;
        hasMoreRef.current = true;
        setHasMore(true);
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setErrorMessage(null);

      const from = nextPageRef.current * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from("spots")
        .select(
          "id, name, category, location, rating_avg, review_count, price_type, cover_url",
        )
        .order("created_at", { ascending: false })
        .range(from, to);

      if (activeCategory !== "All") {
        query = query.eq("category", activeCategory);
      }

      const { data, error } = await query;

      if (error) {
        setErrorMessage(error.message);
        if (reset) {
          setSpots([]);
        }
      } else {
        const rows = (data ?? []) as SpotItem[];
        setSpots((prev) => {
          if (reset) return rows;

          const existingIds = new Set(prev.map((item) => item.id));
          const nextRows = rows.filter((item) => !existingIds.has(item.id));
          return [...prev, ...nextRows];
        });

        if (rows.length > 0) {
          nextPageRef.current += 1;
        }
        const nextHasMore = rows.length === PAGE_SIZE;
        hasMoreRef.current = nextHasMore;
        setHasMore(nextHasMore);
      }

      if (reset) {
        setIsLoading(false);
      } else {
        setIsLoadingMore(false);
      }
      isFetchingRef.current = false;
    },
    [activeCategory],
  );

  useEffect(() => {
    void loadSpots(true);
  }, [loadSpots]);

  useFocusEffect(
    useCallback(() => {
      void loadSpots(true);
      return undefined;
    }, [loadSpots]),
  );

  const visibleSpots = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return spots;

    return spots.filter((spot) => {
      const name = spot.name.toLowerCase();
      const category = (spot.category ?? "").toLowerCase();
      const location = (spot.location ?? "").toLowerCase();

      return (
        name.includes(normalizedQuery) ||
        category.includes(normalizedQuery) ||
        location.includes(normalizedQuery)
      );
    });
  }, [searchQuery, spots]);

  useEffect(() => {
    spotsLengthRef.current = visibleSpots.length;
    const nextUnread =
      highestSeenIndex >= 0
        ? Math.max(visibleSpots.length - highestSeenIndex - 1, 0)
        : 0;
    setUnreadCount(nextUnread);
  }, [highestSeenIndex, visibleSpots.length]);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  });

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const indexes = viewableItems
        .map((item) => item.index)
        .filter((index): index is number => typeof index === "number");

      if (indexes.length === 0) return;

      const nextVisibleMaxIndex = Math.max(...indexes);
      setHighestSeenIndex((previousHighestSeenIndex) => {
        const nextHighestSeenIndex = Math.max(
          previousHighestSeenIndex,
          nextVisibleMaxIndex,
        );
        const nextUnread = Math.max(
          spotsLengthRef.current - nextHighestSeenIndex - 1,
          0,
        );
        setUnreadCount(nextUnread);
        return nextHighestSeenIndex;
      });
    },
  );

  const handleJumpToFirstUnread = useCallback(() => {
    if (!flatListRef.current || unreadCount <= 0) return;

    const targetIndex = Math.min(highestSeenIndex + 1, visibleSpots.length - 1);
    if (targetIndex < 0) return;

    flatListRef.current.scrollToIndex({
      index: targetIndex,
      animated: true,
      viewPosition: 0.1,
    });
  }, [highestSeenIndex, unreadCount, visibleSpots.length]);

  const tagToneStyles: Record<string, { container: string; text: string }> = {
    food: { container: "bg-orange-100", text: "text-orange-700" },
    hangout: { container: "bg-purple-100", text: "text-purple-700" },
    game: { container: "bg-red-100", text: "text-red-700" },
    study: { container: "bg-blue-100", text: "text-blue-700" },
  };

  return (
    <SafeAreaView
      edges={["top"]}
      className="flex-1 bg-slate-50 dark:bg-slate-950"
    >
      {isLoading ? (
        <ScrollView contentContainerClassName="px-5 pb-28 pt-4">
          <TabHeader
            title="Campus Spots"
            subtitle="Find and share the best places around campus."
            onPressNotification={() =>
              router.push("/notifications/notification")
            }
          />

          <View className="mt-5 flex-row items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
            <Ionicons
              name="search-outline"
              size={18}
              color={colors.mutedText}
            />
            <TextInput
              placeholder="Find coffee, library, lunch..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={colors.mutedStrong}
              className="flex-1 text-sm text-slate-900 dark:text-slate-100"
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="mt-4 gap-3"
          >
            {SPOT_FILTER_CATEGORIES.map((category) => {
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
            {Array.from({ length: 4 }).map((_, index) => (
              <View
                key={`spot-skeleton-${index}`}
                className="flex-row gap-4 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
              >
                <SkeletonBlock className="h-[90px] w-[90px] rounded-xl" />
                <View className="flex-1">
                  <SkeletonBlock className="h-4 w-2/3 rounded-md" />
                  <View className="mt-2 flex-row items-center gap-2">
                    <SkeletonBlock className="h-5 w-16 rounded-md" />
                    <SkeletonBlock className="h-3 w-1/3 rounded-md" />
                  </View>
                  <View className="mt-3 flex-row items-center justify-between">
                    <SkeletonBlock className="h-3 w-24 rounded-md" />
                    <SkeletonBlock className="h-5 w-14 rounded-md" />
                  </View>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        <FlatList
          ref={flatListRef}
          data={visibleSpots}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-5 pb-28 pt-4"
          viewabilityConfig={viewabilityConfig.current}
          onViewableItemsChanged={onViewableItemsChanged.current}
          onScrollToIndexFailed={({ index, averageItemLength }) => {
            const offset = Math.max(index * averageItemLength, 0);
            flatListRef.current?.scrollToOffset({ offset, animated: true });
            setTimeout(() => {
              flatListRef.current?.scrollToIndex({ index, animated: true });
            }, 120);
          }}
          ListHeaderComponent={
            <>
              <TabHeader
                title="Campus Spots"
                subtitle="Find and share the best places around campus."
                onPressNotification={() =>
                  router.push("/notifications/notification")
                }
              />

              <View className="mt-5 flex-row items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                <Ionicons
                  name="search-outline"
                  size={18}
                  color={colors.mutedText}
                />
                <TextInput
                  placeholder="Find coffee, library, lunch..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholderTextColor={colors.mutedStrong}
                  className="flex-1 text-sm text-slate-900 dark:text-slate-100"
                />
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="mt-4 gap-3"
              >
                {SPOT_FILTER_CATEGORIES.map((category) => {
                  const isActive = category === activeCategory;
                  return (
                    <Pressable
                      key={category}
                      className={`rounded-full px-4 py-2 ${
                        isActive
                          ? "bg-green-600"
                          : "bg-slate-100 dark:bg-slate-900"
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
              <View className="h-5" />
            </>
          }
          renderItem={({ item: spot }) => {
            const tone =
              tagToneStyles[(spot.category ?? "").toLowerCase()] ??
              ({
                container: "bg-blue-100",
                text: "text-blue-700",
              } as const);

            return (
              <Pressable
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
                    <AppText
                      numberOfLines={1}
                      className="flex-1 text-xs text-slate-500 dark:text-slate-400"
                    >
                      {formatCompactCampusLocation(spot.location)}
                    </AppText>
                  </View>

                  <View className="mt-2 flex-row items-center justify-between">
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="star" size={14} color={colors.warning} />
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
          }}
          ItemSeparatorComponent={() => <View className="h-4" />}
          onEndReachedThreshold={0.35}
          onEndReached={() => {
            if (!isLoadingMore && hasMore) {
              void loadSpots();
            }
          }}
          ListFooterComponent={
            <>
              {isLoadingMore ? (
                <View className="mt-3">
                  <AppText className="text-center text-xs text-slate-400 dark:text-slate-500">
                    Loading more spots...
                  </AppText>
                </View>
              ) : null}
              {!hasMore && visibleSpots.length > 0 ? (
                <View className="mt-3">
                  <AppText className="text-center text-xs text-slate-400 dark:text-slate-500">
                    You are all caught up!
                  </AppText>
                </View>
              ) : null}
            </>
          }
        />
      )}

      {unreadCount > 0 ? (
        <Pressable
          onPress={handleJumpToFirstUnread}
          className="absolute right-8 bottom-24 min-h-10 px-3 rounded-full items-center justify-center bg-slate-900 dark:bg-slate-100"
        >
          <AppText className="text-sm font-semibold text-white dark:text-slate-900">
            ⬇ {unreadCount}
          </AppText>
        </Pressable>
      ) : null}
      {/* Floating Action Button */}
      <Pressable
        onPress={() => router.push("/spots/create-spots")}
        className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-green-600 shadow-lg dark:bg-green-400"
      >
        <Ionicons name="add" size={26} color={colors.chipActiveText} />
      </Pressable>

      <FetchErrorModal
        visible={Boolean(errorMessage)}
        message={errorMessage}
        onClose={() => setErrorMessage(null)}
        onRetry={() => void loadSpots(true)}
      />
    </SafeAreaView>
  );
}
