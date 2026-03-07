import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  LayoutChangeEvent,
  NativeSyntheticEvent,
  NativeScrollEvent,
  RefreshControl,
  ScrollView,
  View,
  Pressable,
  Image,
  ViewToken,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText } from "../../components/AppText";
import { FetchErrorModal } from "../../components/FetchErrorModal";
import { ReportModal } from "../../components/ReportModal";
import { SkeletonBlock } from "../../components/SkeletonBlock";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useSupabase } from "../../providers/SupabaseProvider";
import { RANT_FILTER_CHIPS } from "../../constants/categories";
import { useTheme } from "../../hooks/useTheme";
import { TabHeader } from "../../components/TabHeader";
import { formatTimeAgo } from "../../lib/ui/formatters";

type RantItem = {
  id: string;
  user_id: string | null;
  category: string | null;
  content: string;
  upvotes: number;
  downvotes: number;
  comment_count: number;
  views: number;
  created_at: string;
  is_anonymous: boolean;
  user_vote?: number;
  profile?: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
};

const fallbackAvatar =
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=80&q=80";

function RantCardSkeleton() {
  return (
    <View className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <View className="mb-3 flex-row items-center">
        <SkeletonBlock className="h-9 w-9 rounded-full" />
        <View className="ml-2.5 flex-1">
          <SkeletonBlock className="h-3 w-32 rounded-md" />
          <View className="mt-2 flex-row items-center gap-2">
            <SkeletonBlock className="h-2.5 w-16 rounded-md" />
            <SkeletonBlock className="h-2.5 w-12 rounded-md" />
          </View>
        </View>
      </View>
      <View className="gap-2">
        <SkeletonBlock className="h-3 w-full rounded-md" />
        <SkeletonBlock className="h-3 w-11/12 rounded-md" />
        <SkeletonBlock className="h-3 w-4/5 rounded-md" />
      </View>
      <View className="mt-4 flex-row items-center justify-between">
        <SkeletonBlock className="h-9 w-40 rounded-xl" />
        <SkeletonBlock className="h-4 w-24 rounded-md" />
      </View>
    </View>
  );
}

export default function RantsScreen() {
  const PAGE_SIZE = 15;
  const router = useRouter();
  const { colors } = useTheme();
  const { session } = useSupabase();
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [activeChip, setActiveChip] = useState<string>(RANT_FILTER_CHIPS[0]);
  const [rants, setRants] = useState<RantItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [highestSeenIndex, setHighestSeenIndex] = useState(-1);
  const [unreadCount, setUnreadCount] = useState(0);
  const flatListRef = useRef<FlatList<RantItem>>(null);
  const chipScrollRef = useRef<ScrollView>(null);
  const rantsLengthRef = useRef(0);
  const chipLayoutsRef = useRef<Record<string, { x: number; width: number }>>(
    {},
  );
  const chipScrollXRef = useRef(0);
  const chipViewportWidthRef = useRef(0);
  const nextPageRef = useRef(0);
  const hasMoreRef = useRef(true);
  const isFetchingRef = useRef(false);

  const loadRants = useCallback(
    async (
      reset = false,
      options?: {
        showInitialLoader?: boolean;
      },
    ) => {
      if (isFetchingRef.current) return;
      if (!reset && !hasMoreRef.current) return;

      const showInitialLoader = options?.showInitialLoader ?? reset;

      isFetchingRef.current = true;
      if (reset) {
        nextPageRef.current = 0;
        hasMoreRef.current = true;
        setHasMore(true);
        if (showInitialLoader) {
          setIsLoading(true);
        }
      } else {
        setIsLoadingMore(true);
      }
      setErrorMessage(null);

      const from = nextPageRef.current * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from("rants")
        .select(
          "id, user_id, category, content, upvotes, downvotes, comment_count, views, created_at, is_anonymous",
        )
        .order("created_at", { ascending: false })
        .range(from, to);

      if (activeChip !== "All Rants") {
        query = query.eq("category", activeChip);
      }

      const { data, error } = await query;

      if (error) {
        setErrorMessage(error.message);
        if (reset) {
          setRants([]);
        }
      } else {
        const rows = (data ?? []) as RantItem[];
        const rantIds = rows.map((rant) => rant.id);
        let commentCountMap = new Map<string, number>();

        if (rantIds.length > 0) {
          const { data: commentRows } = await supabase
            .from("rant_comments")
            .select("rant_id")
            .in("rant_id", rantIds);

          commentCountMap = (commentRows ?? []).reduce<Map<string, number>>(
            (acc, row) => {
              const rantId = row.rant_id as string | null;
              if (!rantId) return acc;
              acc.set(rantId, (acc.get(rantId) ?? 0) + 1);
              return acc;
            },
            new Map<string, number>(),
          );
        }

        const userIds = Array.from(
          new Set(
            rows
              .filter((rant) => !rant.is_anonymous && rant.user_id)
              .map((rant) => rant.user_id as string),
          ),
        );

        let profileMap = new Map<string, RantItem["profile"]>();
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, full_name, username, avatar_url")
            .in("user_id", userIds);

          profileMap = new Map(
            (profiles ?? []).map((profile) => [profile.user_id, profile]),
          );
        }

        let voteMap = new Map<string, number>();
        if (session?.user?.id && rantIds.length > 0) {
          const { data: votes } = await supabase
            .from("rant_votes")
            .select("rant_id, vote")
            .in("rant_id", rantIds)
            .eq("user_id", session.user.id);

          voteMap = new Map(
            (votes ?? []).map((vote) => [vote.rant_id, vote.vote]),
          );
        }

        const hydratedRows = rows.map((rant) => ({
          ...rant,
          comment_count:
            commentCountMap.get(rant.id) ?? rant.comment_count ?? 0,
          profile: rant.user_id ? profileMap.get(rant.user_id) : undefined,
          user_vote: voteMap.get(rant.id) ?? 0,
        }));

        setRants((prev) => {
          if (reset) return hydratedRows;

          const existingIds = new Set(prev.map((item) => item.id));
          const nextRows = hydratedRows.filter(
            (item) => !existingIds.has(item.id),
          );
          return [...prev, ...nextRows];
        });

        if (rows.length > 0) {
          nextPageRef.current += 1;
        }
        const nextHasMore = rows.length === PAGE_SIZE;
        hasMoreRef.current = nextHasMore;
        setHasMore(nextHasMore);
      }

      if (reset && showInitialLoader) {
        setIsLoading(false);
      } else if (!reset) {
        setIsLoadingMore(false);
      }
      isFetchingRef.current = false;
    },
    [activeChip, session?.user?.id],
  );

  useEffect(() => {
    void loadRants(true);
  }, [loadRants]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadRants(true, { showInitialLoader: false });
    setIsRefreshing(false);
  }, [loadRants]);

  useEffect(() => {
    rantsLengthRef.current = rants.length;
    const nextUnread =
      highestSeenIndex >= 0
        ? Math.max(rants.length - highestSeenIndex - 1, 0)
        : 0;
    setUnreadCount(nextUnread);
  }, [highestSeenIndex, rants.length]);

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
          rantsLengthRef.current - nextHighestSeenIndex - 1,
          0,
        );
        setUnreadCount(nextUnread);
        return nextHighestSeenIndex;
      });
    },
  );

  const ensureChipVisible = useCallback((chip: string) => {
    const layout = chipLayoutsRef.current[chip];
    const viewportWidth = chipViewportWidthRef.current;
    if (!layout || viewportWidth <= 0 || !chipScrollRef.current) return;

    const currentOffset = chipScrollXRef.current;
    const leftEdge = layout.x;
    const rightEdge = layout.x + layout.width;
    let targetOffset = currentOffset;

    if (leftEdge < currentOffset) {
      targetOffset = Math.max(leftEdge - 8, 0);
    } else if (rightEdge > currentOffset + viewportWidth) {
      targetOffset = Math.max(rightEdge - viewportWidth + 8, 0);
    }

    if (targetOffset !== currentOffset) {
      chipScrollRef.current.scrollTo({ x: targetOffset, animated: true });
    }
  }, []);

  const handleChipBarLayout = useCallback((event: LayoutChangeEvent) => {
    chipViewportWidthRef.current = event.nativeEvent.layout.width;
  }, []);

  const handleChipBarScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      chipScrollXRef.current = event.nativeEvent.contentOffset.x;
    },
    [],
  );

  const handleChipLayout = useCallback(
    (chip: string, event: LayoutChangeEvent) => {
      chipLayoutsRef.current[chip] = {
        x: event.nativeEvent.layout.x,
        width: event.nativeEvent.layout.width,
      };
      if (chip === activeChip) {
        ensureChipVisible(chip);
      }
    },
    [activeChip, ensureChipVisible],
  );

  const handleChipPress = useCallback(
    (chip: string) => {
      if (chip === activeChip) return;
      setActiveChip(chip);
    },
    [activeChip],
  );

  useEffect(() => {
    const id = setTimeout(() => ensureChipVisible(activeChip), 0);
    return () => clearTimeout(id);
  }, [activeChip, ensureChipVisible]);

  const renderFilterChips = useCallback(
    () => (
      <ScrollView
        ref={chipScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 pb-1"
        onLayout={handleChipBarLayout}
        onScroll={handleChipBarScroll}
        scrollEventThrottle={16}
        contentOffset={{ x: chipScrollXRef.current, y: 0 }}
      >
        {RANT_FILTER_CHIPS.map((chip) => {
          const active = chip === activeChip;
          return (
            <Pressable
              key={chip}
              className={`px-4 py-2 rounded-full border ${
                active
                  ? "bg-green-600 border-green-600 dark:bg-green-400 dark:border-green-400"
                  : "bg-slate-100 border-slate-200 dark:bg-slate-900 dark:border-slate-800"
              }`}
              accessibilityRole="button"
              onPress={() => handleChipPress(chip)}
              onLayout={(event) => handleChipLayout(chip, event)}
            >
              <AppText
                className={`text-xs ${
                  active
                    ? "text-white dark:text-slate-950"
                    : "text-slate-600 dark:text-slate-300"
                }`}
              >
                {chip}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>
    ),
    [
      activeChip,
      handleChipBarLayout,
      handleChipBarScroll,
      handleChipLayout,
      handleChipPress,
    ],
  );

  const handleJumpToFirstUnread = useCallback(() => {
    if (!flatListRef.current || unreadCount <= 0) return;

    const targetIndex = Math.min(highestSeenIndex + 1, rants.length - 1);
    if (targetIndex < 0) return;

    flatListRef.current.scrollToIndex({
      index: targetIndex,
      animated: true,
      viewPosition: 0.1,
    });
  }, [highestSeenIndex, rants.length, unreadCount]);

  const handleReportSubmit = async (reason: string, details: string) => {
    if (!session?.user?.id) {
      setErrorMessage("Please log in to report content.");
      return;
    }

    if (!selectedReportId) {
      setErrorMessage("Missing report target.");
      return;
    }

    setErrorMessage(null);

    const { error } = await supabase.from("reports").insert({
      reporter_id: session.user.id,
      target_type: "rants",
      target_id: selectedReportId,
      reason,
      details: details || null,
      status: "pending",
    });

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setSelectedReportId(null);
  };

  const handleVote = async (rantId: string, vote: number) => {
    if (!session?.user?.id) {
      setErrorMessage("Please log in to vote.");
      return;
    }

    let previousVote = 0;
    let previousUpvotes = 0;
    let previousDownvotes = 0;
    let nextVote = vote;

    setRants((prev) =>
      prev.map((rant) => {
        if (rant.id !== rantId) return rant;
        previousVote = rant.user_vote ?? 0;
        previousUpvotes = rant.upvotes;
        previousDownvotes = rant.downvotes;
        nextVote = previousVote === vote ? 0 : vote;

        let upvotes = rant.upvotes;
        let downvotes = rant.downvotes;

        if (previousVote === 1) upvotes = Math.max(upvotes - 1, 0);
        if (previousVote === -1) downvotes = Math.max(downvotes - 1, 0);
        if (nextVote === 1) upvotes += 1;
        if (nextVote === -1) downvotes += 1;

        return {
          ...rant,
          upvotes,
          downvotes,
          user_vote: nextVote,
        };
      }),
    );

    const { data, error } = await supabase.rpc("set_rant_vote", {
      p_rant_id: rantId,
      p_vote: nextVote,
    });

    if (error) {
      setErrorMessage(error.message);
      setRants((prev) =>
        prev.map((rant) =>
          rant.id === rantId
            ? {
                ...rant,
                upvotes: previousUpvotes,
                downvotes: previousDownvotes,
                user_vote: previousVote,
              }
            : rant,
        ),
      );
      return;
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (row) {
      setRants((prev) =>
        prev.map((rant) =>
          rant.id === rantId
            ? {
                ...rant,
                upvotes: row.upvotes ?? rant.upvotes,
                downvotes: row.downvotes ?? rant.downvotes,
                user_vote: row.user_vote ?? rant.user_vote,
              }
            : rant,
        ),
      );
    }
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-white dark:bg-slate-950">
      {isLoading ? (
        <ScrollView contentContainerClassName="px-5 pt-5 pb-20">
          <TabHeader
            title="HU Rants"
            subtitle="Hawassa University Anonymous Feed."
            onPressNotification={() =>
              router.push("/notifications/notification")
            }
          />

          <View className="h-4" />
          {renderFilterChips()}

          <View className="mt-3 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <RantCardSkeleton key={`rant-skeleton-${index}`} />
            ))}
          </View>
        </ScrollView>
      ) : (
        <FlatList
          ref={flatListRef}
          data={rants}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-5 pt-5 pb-20"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.mutedText}
            />
          }
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (!isLoadingMore && hasMore) {
              void loadRants(false);
            }
          }}
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
                title="HU Rants"
                subtitle="Hawassa University Anonymous Feed"
                onPressNotification={() =>
                  router.push("/notifications/notification")
                }
              />

              <View className="h-4" />
              {renderFilterChips()}

              <View className="h-3" />
            </>
          }
          renderItem={({ item: rant }) => (
            <View className="rounded-2xl p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              {/* Card Header */}
              <View className="flex-row items-center mb-3">
                <View className="w-9 h-9 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800">
                  <Image
                    source={{
                      uri: rant.is_anonymous
                        ? "https://placehold.co/40x40/png"
                        : (rant.profile?.avatar_url ?? fallbackAvatar),
                    }}
                    className="w-full h-full"
                  />
                </View>

                <View className="flex-1 ml-2.5">
                  <AppText className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {rant.is_anonymous
                      ? "Anonymous Student"
                      : rant.profile?.full_name ||
                        rant.profile?.username ||
                        "Student"}
                  </AppText>

                  <View className="flex-row items-center mt-0.5">
                    <AppText className="text-[11px] text-slate-500 dark:text-slate-400">
                      {formatTimeAgo(rant.created_at)}
                    </AppText>
                    <View className="w-1 h-1 rounded-full mx-1.5 bg-slate-200 dark:bg-slate-800" />
                    <AppText className="text-[11px] text-green-600 dark:text-green-400">
                      {rant.category ?? "General"}
                    </AppText>
                  </View>
                </View>

                <Pressable
                  className="p-1"
                  onPress={() => {
                    setSelectedReportId(rant.id);
                    setIsReportOpen(true);
                  }}
                >
                  <Ionicons
                    name="ellipsis-horizontal"
                    size={20}
                    color={colors.mutedText}
                  />
                </Pressable>
              </View>

              {/* Content */}
              <AppText className="text-sm leading-5 text-slate-900 dark:text-slate-100">
                {rant.content}
              </AppText>

              {/* Actions */}
              <View className="mt-3.5 flex-row items-center justify-between">
                <View className="flex-row items-center gap-4 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900">
                  <Pressable
                    onPress={() => handleVote(rant.id, 1)}
                    className="flex-row items-center gap-1"
                  >
                    <Ionicons
                      name="arrow-up"
                      size={18}
                      color={
                        rant.user_vote === 1 ? colors.accent : colors.mutedText
                      }
                    />
                    <AppText className="text-[13px] font-semibold text-slate-900 dark:text-slate-100">
                      {rant.upvotes}
                    </AppText>
                  </Pressable>
                  <Pressable
                    onPress={() => handleVote(rant.id, -1)}
                    className="flex-row items-center gap-1"
                  >
                    <Ionicons
                      name="arrow-down"
                      size={18}
                      color={
                        rant.user_vote === -1 ? colors.danger : colors.mutedText
                      }
                    />
                    <AppText className="text-[13px] font-semibold text-slate-900 dark:text-slate-100">
                      {rant.downvotes}
                    </AppText>
                  </Pressable>
                </View>

                <View className="flex-row items-center gap-3">
                  <View className="flex-row items-center gap-1">
                    <Ionicons
                      name="eye-outline"
                      size={15}
                      color={colors.mutedText}
                    />
                    <AppText className="text-xs text-slate-500 dark:text-slate-400">
                      {rant.views}
                    </AppText>
                  </View>

                  <Pressable
                    onPress={() => router.push(`/rants/${rant.id}`)}
                    className="flex-row items-center gap-1.5 px-2 py-1.5 rounded-lg"
                  >
                    <Ionicons
                      name="chatbox-outline"
                      size={16}
                      color={colors.mutedText}
                    />
                    <AppText className="text-xs text-slate-500 dark:text-slate-400">
                      {rant.comment_count} Comments
                    </AppText>
                  </Pressable>
                </View>
              </View>
            </View>
          )}
          ItemSeparatorComponent={() => <View className="h-4" />}
          ListEmptyComponent={
            !isLoading ? (
              <View className="items-center justify-center py-16">
                <AppText className="text-sm text-slate-500 dark:text-slate-400 text-center">
                  No rants in this category yet. Be the first to rant.
                </AppText>
              </View>
            ) : null
          }
          ListFooterComponent={
            isLoadingMore ? (
              <AppText className="text-xs text-center mt-4 text-slate-400 dark:text-slate-500">
                Loading more...
              </AppText>
            ) : !hasMore && rants.length > 0 ? (
              <AppText className="text-xs text-center mt-4 text-slate-400 dark:text-slate-500">
                You are all caught up!
              </AppText>
            ) : null
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
      {/* FAB */}
      <Pressable
        onPress={() => router.push("/rants/create-rants")}
        className="absolute right-6 bottom-6 w-14 h-14 rounded-full items-center justify-center bg-green-600 dark:bg-green-400 shadow-lg"
      >
        <Ionicons name="add" size={26} color={colors.chipActiveText} />
      </Pressable>
      <ReportModal
        visible={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        onSubmit={handleReportSubmit}
      />

      <FetchErrorModal
        visible={Boolean(errorMessage)}
        message={errorMessage}
        onClose={() => setErrorMessage(null)}
        onRetry={() => void loadRants(true)}
      />
    </SafeAreaView>
  );
}
