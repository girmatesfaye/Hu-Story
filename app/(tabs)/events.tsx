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
import { AppText } from "../../components/AppText";
import { FetchErrorModal } from "../../components/FetchErrorModal";
import { SkeletonBlock } from "../../components/SkeletonBlock";
import { useTheme } from "../../hooks/useTheme";
import { useColorScheme } from "react-native";
import { supabase } from "../../lib/supabase";
import { formatEventDateRange } from "../../lib/eventDateTime";

const buildDateChips = (count: number) =>
  Array.from({ length: count }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    return {
      id: `d${index + 1}`,
      day: date.toLocaleString(undefined, { month: "short" }).toUpperCase(),
      date: date.getDate().toString(),
    };
  });

type EventItem = {
  id: string;
  title: string;
  start_at: string | null;
  end_at: string | null;
  location: string | null;
  cover_url: string | null;
  fee_type: string | null;
  fee_amount: number | null;
  host_name: string | null;
};

const fallbackEventImage =
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=600&q=80";

const resolveEventCoverUrl = (coverUrl: string | null) => {
  const normalized = coverUrl?.trim();
  if (!normalized) return null;
  if (/^https?:\/\//i.test(normalized)) return normalized;
  const { data } = supabase.storage
    .from("event-covers")
    .getPublicUrl(normalized);
  return data.publicUrl;
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

type EventCardProps = {
  title: string;
  time: string;
  location: string;
  price: string;
  image: string;
  badge?: string;
  hasPassed?: boolean;
  dateTag?: string;
  host?: string;
  attendees?: string[];
  extra?: string;
  action?: string;
  soldOut?: boolean;
  iconColor: string;
  onPress?: () => void;
};

function EventCard({
  title,
  time,
  location,
  price,
  image,
  badge,
  hasPassed,
  dateTag,
  host,
  attendees = [],
  extra,
  action,
  soldOut,
  iconColor,
  onPress,
}: EventCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="relative flex-row gap-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      {hasPassed ? (
        <View className="absolute right-2 top-2 rounded-md bg-red-600 px-2 py-1">
          <AppText className="text-[10px] font-semibold text-white">
            Event Passed
          </AppText>
        </View>
      ) : null}

      <View className="relative">
        <Image
          source={{ uri: image }}
          className="h-[86px] w-[86px] rounded-xl"
          resizeMode="cover"
        />
        {badge ? (
          <View className="absolute left-2 top-2 rounded-md bg-white/90 px-2 py-1">
            <AppText className="text-[10px] font-semibold uppercase text-green-700">
              {badge}
            </AppText>
          </View>
        ) : null}
        {dateTag ? (
          <View className="absolute left-2 top-2 rounded-md bg-slate-900/85 px-2 py-1">
            <AppText className="text-[10px] font-semibold uppercase text-white">
              {dateTag}
            </AppText>
          </View>
        ) : null}
        {soldOut ? (
          <View className="absolute inset-0 items-center justify-center rounded-xl bg-black/50">
            <AppText className="text-xs font-semibold uppercase tracking-wider text-white">
              Sold Out
            </AppText>
          </View>
        ) : null}
      </View>

      <View className="flex-1">
        <AppText className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </AppText>

        <View className="mt-2 flex-row items-center gap-2">
          <Ionicons name="time-outline" size={14} color={iconColor} />
          <AppText className="text-xs text-slate-500 dark:text-slate-400">
            {time}
          </AppText>
        </View>

        <View className="mt-1 flex-row items-center gap-2">
          <Ionicons name="location-outline" size={14} color={iconColor} />
          <AppText className="text-xs text-slate-500 dark:text-slate-400">
            {location}
          </AppText>
        </View>

        <View className="mt-2 flex-row items-center justify-between">
          <View className="rounded-md bg-green-100 px-2.5 py-1 dark:bg-green-400/20">
            <AppText className="text-xs font-semibold text-green-700 dark:text-green-300">
              {price}
            </AppText>
          </View>

          {attendees.length > 0 ? (
            <View className="flex-row items-center">
              {attendees.map((initials, index) => (
                <View
                  key={`${initials}-${index}`}
                  className="-ml-2 h-6 w-6 items-center justify-center rounded-full border border-white bg-slate-200 dark:border-slate-900 dark:bg-slate-700"
                >
                  <AppText className="text-[9px] font-semibold text-slate-700 dark:text-slate-200">
                    {initials}
                  </AppText>
                </View>
              ))}
              {extra ? (
                <AppText className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                  {extra}
                </AppText>
              ) : null}
            </View>
          ) : null}

          {host ? (
            <AppText className="text-xs text-slate-400 dark:text-slate-500">
              {host}
            </AppText>
          ) : null}

          {action ? (
            <AppText className="text-xs font-semibold text-green-600 dark:text-green-400">
              {action}
            </AppText>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

function EventCardSkeleton() {
  return (
    <View className="flex-row gap-4 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      <SkeletonBlock className="h-[86px] w-[86px] rounded-xl" />
      <View className="flex-1">
        <SkeletonBlock className="h-4 w-2/3 rounded-md" />
        <View className="mt-3 gap-2">
          <SkeletonBlock className="h-3 w-1/2 rounded-md" />
          <SkeletonBlock className="h-3 w-3/5 rounded-md" />
        </View>
        <View className="mt-3 flex-row items-center justify-between">
          <SkeletonBlock className="h-6 w-16 rounded-md" />
          <SkeletonBlock className="h-3 w-20 rounded-md" />
        </View>
      </View>
    </View>
  );
}

export default function EventTabScreen() {
  const PAGE_SIZE = 15;
  const router = useRouter();
  const { colors } = useTheme();
  const iconColor = colors.mutedStrong;
  const scheme = useColorScheme();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [showPastEvents, setShowPastEvents] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [feeFilter, setFeeFilter] = useState<"All" | "Free" | "Paid">("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [highestSeenIndex, setHighestSeenIndex] = useState(-1);
  const [unreadCount, setUnreadCount] = useState(0);
  const flatListRef = useRef<FlatList<EventItem>>(null);
  const eventsLengthRef = useRef(0);
  const nextPageRef = useRef(0);
  const hasMoreRef = useRef(true);
  const isFetchingRef = useRef(false);

  const iconColors = {
    text: scheme === "dark" ? "#E5E7EB" : "#0F172A",
    muted: scheme === "dark" ? "#94A3B8" : "#64748B",
    accent: scheme === "dark" ? "#4ADE80" : "#16A34A",
    chipText: scheme === "dark" ? "#0B0B0B" : "#FFFFFF",
  };

  const loadEvents = useCallback(async (reset = false) => {
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

    const { data, error } = await supabase
      .from("events")
      .select(
        "id, title, start_at, end_at, location, cover_url, fee_type, fee_amount, host_name",
      )
      .order("start_at", { ascending: true })
      .range(from, to);

    if (error) {
      setErrorMessage(error.message);
      if (reset) {
        setEvents([]);
      }
    } else {
      const rows = (data ?? []) as EventItem[];
      setEvents((prev) => {
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
  }, []);

  useEffect(() => {
    void loadEvents(true);
  }, [loadEvents]);

  const dateChips = useMemo(() => buildDateChips(6), []);
  const selectedDate = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + selectedDateIndex);
    return date;
  }, [selectedDateIndex]);

  const selectedChip = dateChips[selectedDateIndex] ?? dateChips[0];

  const hasEventPassed = useCallback((event: EventItem) => {
    const reference = event.end_at ?? event.start_at;
    if (!reference) return false;

    const referenceDate = new Date(reference);
    if (Number.isNaN(referenceDate.getTime())) return false;

    return referenceDate.getTime() < Date.now();
  }, []);

  const { todayEvents, upcomingWeekEvents, laterEvents, pastEvents } =
    useMemo(() => {
      const todayList: EventItem[] = [];
      const upcomingWeekList: EventItem[] = [];
      const laterList: EventItem[] = [];
      const pastList: EventItem[] = [];
      const msInDay = 24 * 60 * 60 * 1000;
      const startOfSelectedDay = new Date(selectedDate);
      startOfSelectedDay.setHours(0, 0, 0, 0);
      const normalizedSearchQuery = searchQuery.trim().toLowerCase();

      const filteredEvents = events.filter((event) => {
        const matchesFee =
          feeFilter === "All" ||
          (event.fee_type ?? "").toLowerCase() === feeFilter.toLowerCase();

        if (!matchesFee) return false;
        if (!normalizedSearchQuery) return true;

        const searchableText = [event.title, event.location, event.host_name]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(normalizedSearchQuery);
      });

      filteredEvents.forEach((event) => {
        if (hasEventPassed(event)) {
          pastList.push(event);
          return;
        }

        if (!event.start_at) {
          laterList.push(event);
          return;
        }

        const eventDate = new Date(event.start_at);
        if (Number.isNaN(eventDate.getTime())) {
          laterList.push(event);
          return;
        }

        const eventDay = new Date(eventDate);
        eventDay.setHours(0, 0, 0, 0);
        const diffDays = Math.floor(
          (eventDay.getTime() - startOfSelectedDay.getTime()) / msInDay,
        );

        if (isSameDay(eventDay, startOfSelectedDay)) {
          todayList.push(event);
          return;
        }

        if (diffDays >= 1 && diffDays <= 7) {
          upcomingWeekList.push(event);
          return;
        }

        laterList.push(event);
      });

      return {
        todayEvents: todayList,
        upcomingWeekEvents: upcomingWeekList,
        laterEvents: laterList,
        pastEvents: pastList,
      };
    }, [events, feeFilter, hasEventPassed, searchQuery, selectedDate]);

  const visibleEvents = useMemo(
    () =>
      showPastEvents
        ? [...todayEvents, ...upcomingWeekEvents, ...laterEvents, ...pastEvents]
        : [...todayEvents, ...upcomingWeekEvents, ...laterEvents],
    [laterEvents, pastEvents, showPastEvents, todayEvents, upcomingWeekEvents],
  );

  useEffect(() => {
    eventsLengthRef.current = visibleEvents.length;
    const nextUnread =
      highestSeenIndex >= 0
        ? Math.max(visibleEvents.length - highestSeenIndex - 1, 0)
        : 0;
    setUnreadCount(nextUnread);
  }, [highestSeenIndex, visibleEvents.length]);

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
          eventsLengthRef.current - nextHighestSeenIndex - 1,
          0,
        );
        setUnreadCount(nextUnread);
        return nextHighestSeenIndex;
      });
    },
  );

  const handleJumpToFirstUnread = useCallback(() => {
    if (!flatListRef.current || unreadCount <= 0) return;

    const targetIndex = Math.min(
      highestSeenIndex + 1,
      visibleEvents.length - 1,
    );
    if (targetIndex < 0) return;

    flatListRef.current.scrollToIndex({
      index: targetIndex,
      animated: true,
      viewPosition: 0.1,
    });
  }, [highestSeenIndex, unreadCount, visibleEvents.length]);

  return (
    <SafeAreaView
      edges={["top"]}
      className="flex-1 bg-slate-50 dark:bg-slate-950"
    >
      {isLoading ? (
        <ScrollView contentContainerClassName="px-5 pb-28 pt-4">
          <View className="flex-row items-center justify-between">
            <View>
              <AppText className="text-[22px] font-bold text-slate-900 dark:text-slate-100">
                Upcoming Events
              </AppText>
              <AppText className="text-sm text-slate-500  dark:text-green-400">
                Discover what's happening around campus.
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

          <View className="mt-4 flex-row items-center gap-3">
            <View className="flex-1 flex-row items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
              <Ionicons
                name="search-outline"
                size={18}
                color={colors.mutedText}
              />
              <TextInput
                placeholder="Search events, clubs..."
                placeholderTextColor={colors.mutedStrong}
                className="flex-1 text-sm text-slate-900 dark:text-slate-100"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <Pressable
              onPress={() => setShowFilters((prev) => !prev)}
              className="h-12 w-12 items-center justify-center rounded-2xl bg-green-100 dark:bg-green-400/20"
            >
              <Ionicons
                name="options-outline"
                size={20}
                color={colors.accent}
              />
            </Pressable>
          </View>

          {showFilters ? (
            <View className="mt-3 flex-row gap-2">
              {(["All", "Free", "Paid"] as const).map((option) => {
                const isActive = feeFilter === option;
                return (
                  <Pressable
                    key={option}
                    onPress={() => setFeeFilter(option)}
                    className={`rounded-full px-4 py-2 ${
                      isActive
                        ? "bg-green-600"
                        : "bg-slate-100 dark:bg-slate-900"
                    }`}
                  >
                    <AppText
                      className={`text-xs font-semibold ${
                        isActive
                          ? "text-white"
                          : "text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {option}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="mt-5 gap-3"
          >
            {dateChips.map((chip, index) => (
              <Pressable
                key={chip.id}
                onPress={() => setSelectedDateIndex(index)}
                className={`h-16 w-16 items-center justify-center rounded-2xl border ${
                  index === selectedDateIndex
                    ? "border-green-600 bg-green-600"
                    : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                }`}
              >
                <AppText
                  className={`text-[11px] font-semibold ${
                    index === selectedDateIndex
                      ? "text-white"
                      : "text-slate-400 dark:text-slate-500"
                  }`}
                >
                  {chip.day}
                </AppText>
                <AppText
                  className={`text-lg font-semibold ${
                    index === selectedDateIndex
                      ? "text-white"
                      : "text-slate-900 dark:text-slate-100"
                  }`}
                >
                  {chip.date}
                </AppText>
              </Pressable>
            ))}
          </ScrollView>

          <View className="mt-6 flex-row items-center justify-between">
            <AppText className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {selectedChip
                ? `${selectedChip.day} ${selectedChip.date}`
                : "Selected Day"}
            </AppText>
            <AppText className="text-xs font-semibold uppercase tracking-wider text-green-600 dark:text-green-400">
              {todayEvents.length} Today
            </AppText>
          </View>

          <View className="mt-3 gap-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <EventCardSkeleton key={`event-skeleton-${index}`} />
            ))}
          </View>
        </ScrollView>
      ) : (
        <FlatList
          ref={flatListRef}
          data={visibleEvents}
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
              <View className="flex-row items-center justify-between">
                <View>
                  <AppText className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                    Upcoming Events
                  </AppText>
                  <AppText className="text-sm text-slate-500  dark:text-green-400">
                    Discover what's happening around campus
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

              <View className="mt-4 flex-row items-center gap-3">
                <View className="flex-1 flex-row items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                  <Ionicons
                    name="search-outline"
                    size={18}
                    color={colors.mutedText}
                  />
                  <TextInput
                    placeholder="Search events, clubs..."
                    placeholderTextColor={colors.mutedStrong}
                    className="flex-1 text-sm text-slate-900 dark:text-slate-100"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>
                <Pressable
                  onPress={() => setShowFilters((prev) => !prev)}
                  className="h-12 w-12 items-center justify-center rounded-2xl bg-green-100 dark:bg-green-400/20"
                >
                  <Ionicons
                    name="options-outline"
                    size={20}
                    color={colors.accent}
                  />
                </Pressable>
              </View>

              {showFilters ? (
                <View className="mt-3 flex-row gap-2">
                  {(["All", "Free", "Paid"] as const).map((option) => {
                    const isActive = feeFilter === option;
                    return (
                      <Pressable
                        key={option}
                        onPress={() => setFeeFilter(option)}
                        className={`rounded-full px-4 py-2 ${
                          isActive
                            ? "bg-green-600"
                            : "bg-slate-100 dark:bg-slate-900"
                        }`}
                      >
                        <AppText
                          className={`text-xs font-semibold ${
                            isActive
                              ? "text-white"
                              : "text-slate-600 dark:text-slate-300"
                          }`}
                        >
                          {option}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="mt-5 gap-3"
              >
                {dateChips.map((chip, index) => (
                  <Pressable
                    key={chip.id}
                    onPress={() => setSelectedDateIndex(index)}
                    className={`h-16 w-16 items-center justify-center rounded-2xl border ${
                      index === selectedDateIndex
                        ? "border-green-600 bg-green-600"
                        : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                    }`}
                  >
                    <AppText
                      className={`text-[11px] font-semibold ${
                        index === selectedDateIndex
                          ? "text-white"
                          : "text-slate-400 dark:text-slate-500"
                      }`}
                    >
                      {chip.day}
                    </AppText>
                    <AppText
                      className={`text-lg font-semibold ${
                        index === selectedDateIndex
                          ? "text-white"
                          : "text-slate-900 dark:text-slate-100"
                      }`}
                    >
                      {chip.date}
                    </AppText>
                  </Pressable>
                ))}
              </ScrollView>

              <View className="mt-6 flex-row items-center justify-between">
                <AppText className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {selectedChip
                    ? `${selectedChip.day} ${selectedChip.date}`
                    : "Selected Day"}
                </AppText>
                <AppText className="text-xs font-semibold uppercase tracking-wider text-green-600 dark:text-green-400">
                  {todayEvents.length} Today
                </AppText>
              </View>

              <View className="mt-3 flex-row items-center justify-between">
                <AppText className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Past Events
                </AppText>
                <Pressable
                  onPress={() => setShowPastEvents((prev) => !prev)}
                  className="rounded-full bg-slate-100 px-3 py-1.5 dark:bg-slate-900"
                >
                  <AppText className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    {showPastEvents ? "Hide" : `Show (${pastEvents.length})`}
                  </AppText>
                </Pressable>
              </View>
              <View className="h-3" />
            </>
          }
          renderItem={({ item: event, index }) => {
            const hasPassed = hasEventPassed(event);
            const upcomingWeekStartIndex = todayEvents.length;
            const laterStartIndex =
              todayEvents.length + upcomingWeekEvents.length;
            const pastStartIndex =
              todayEvents.length +
              upcomingWeekEvents.length +
              laterEvents.length;

            return (
              <>
                {index === upcomingWeekStartIndex &&
                upcomingWeekEvents.length > 0 ? (
                  <AppText className="mt-8 text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Next 7 Days
                  </AppText>
                ) : null}
                {index === laterStartIndex && laterEvents.length > 0 ? (
                  <AppText className="mt-8 text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Later
                  </AppText>
                ) : null}
                {index === pastStartIndex && pastEvents.length > 0 ? (
                  <AppText className="mt-8 text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Past Events
                  </AppText>
                ) : null}
                <View
                  className={
                    index === upcomingWeekStartIndex ||
                    index === laterStartIndex ||
                    index === pastStartIndex
                      ? "mt-3"
                      : undefined
                  }
                >
                  <EventCard
                    title={event.title}
                    time={formatEventDateRange(event.start_at, event.end_at)}
                    location={event.location ?? "Location TBD"}
                    price={
                      event.fee_type?.toLowerCase() === "paid"
                        ? event.fee_amount
                          ? `${event.fee_amount} ETB`
                          : "Paid"
                        : "Free"
                    }
                    image={
                      resolveEventCoverUrl(event.cover_url) ??
                      fallbackEventImage
                    }
                    badge={index < todayEvents.length ? "Selected" : undefined}
                    hasPassed={hasPassed}
                    host={event.host_name ? `By ${event.host_name}` : undefined}
                    iconColor={iconColor}
                    onPress={() => router.push(`../events/${event.id}`)}
                  />
                </View>
              </>
            );
          }}
          ItemSeparatorComponent={() => <View className="h-4" />}
          onEndReachedThreshold={0.35}
          onEndReached={() => {
            if (!isLoadingMore && hasMore) {
              void loadEvents();
            }
          }}
          ListFooterComponent={
            <>
              {isLoadingMore ? (
                <View className="mt-4">
                  <AppText className="text-center text-xs text-slate-400 dark:text-slate-500">
                    Loading more events...
                  </AppText>
                </View>
              ) : null}
              {!hasMore && visibleEvents.length > 0 ? (
                <View className="mt-4">
                  <AppText className="text-center text-xs text-slate-400 dark:text-slate-500">
                    You are all caught up!
                  </AppText>
                </View>
              ) : null}
              <View className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-900/40">
                <AppText className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Create your own event
                </AppText>
                <AppText className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Promote your club and invite students in minutes.
                </AppText>
              </View>
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

      <Pressable
        onPress={() => router.push("/events/create-events")}
        className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-green-600 shadow-lg dark:bg-green-400"
      >
        <Ionicons name="add" size={26} color={colors.chipActiveText} />
      </Pressable>

      <FetchErrorModal
        visible={Boolean(errorMessage)}
        message={errorMessage}
        onClose={() => setErrorMessage(null)}
        onRetry={() => void loadEvents(true)}
      />
    </SafeAreaView>
  );
}
