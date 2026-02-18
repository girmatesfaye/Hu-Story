import React, { useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, TextInput, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { AppText } from "../../components/AppText";
import { useTheme } from "../../hooks/useTheme";
import { useColorScheme } from "react-native";
import { supabase } from "../../lib/supabase";

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

const formatEventTime = (startAt: string | null, endAt: string | null) => {
  if (!startAt) return "Time TBD";
  const startDate = new Date(startAt);
  if (Number.isNaN(startDate.getTime())) return "Time TBD";
  const startLabel = startDate.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  if (!endAt) return startLabel;
  const endDate = new Date(endAt);
  if (Number.isNaN(endDate.getTime())) return startLabel;
  const endLabel = endDate.toLocaleString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${startLabel} - ${endLabel}`;
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
      className="flex-row gap-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
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

export default function EventTabScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const iconColor = colors.mutedStrong;
  const scheme = useColorScheme();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [feeFilter, setFeeFilter] = useState<"All" | "Free" | "Paid">("All");

  const iconColors = {
    text: scheme === "dark" ? "#E5E7EB" : "#0F172A",
    muted: scheme === "dark" ? "#94A3B8" : "#64748B",
    accent: scheme === "dark" ? "#4ADE80" : "#16A34A",
    chipText: scheme === "dark" ? "#0B0B0B" : "#FFFFFF",
  };

  useEffect(() => {
    let isMounted = true;

    const loadEvents = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      const { data, error } = await supabase
        .from("events")
        .select(
          "id, title, start_at, end_at, location, cover_url, fee_type, fee_amount, host_name",
        )
        .order("start_at", { ascending: true });

      if (!isMounted) return;

      if (error) {
        setErrorMessage(error.message);
        setEvents([]);
      } else {
        setEvents((data ?? []) as EventItem[]);
      }

      setIsLoading(false);
    };

    loadEvents();

    return () => {
      isMounted = false;
    };
  }, []);

  const dateChips = useMemo(() => buildDateChips(6), []);

  const { todayEvents, nextWeekEvents } = useMemo(() => {
    const today = new Date();
    const todayList: EventItem[] = [];
    const nextList: EventItem[] = [];
    const filteredEvents = events.filter((event) => {
      if (feeFilter === "All") return true;
      return (event.fee_type ?? "").toLowerCase() === feeFilter.toLowerCase();
    });

    filteredEvents.forEach((event) => {
      if (!event.start_at) {
        nextList.push(event);
        return;
      }
      const eventDate = new Date(event.start_at);
      if (Number.isNaN(eventDate.getTime())) {
        nextList.push(event);
        return;
      }
      if (isSameDay(eventDate, today)) {
        todayList.push(event);
      } else {
        nextList.push(event);
      }
    });

    return { todayEvents: todayList, nextWeekEvents: nextList };
  }, [events, feeFilter]);

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <ScrollView contentContainerClassName="px-5 pb-28 pt-4">
        <View className="flex-row items-center justify-between">
          <View>
            <AppText className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
              Upcoming Events
            </AppText>
            <AppText className="text-sm text-slate-500 dark:text-slate-400">
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
            />
          </View>
          <Pressable
            onPress={() => setShowFilters((prev) => !prev)}
            className="h-12 w-12 items-center justify-center rounded-2xl bg-green-100 dark:bg-green-400/20"
          >
            <Ionicons name="options-outline" size={20} color={colors.accent} />
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
                    isActive ? "bg-green-600" : "bg-slate-100 dark:bg-slate-900"
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
            Today
          </AppText>
          <AppText className="text-xs font-semibold uppercase tracking-wider text-green-600 dark:text-green-400">
            {todayEvents.length} Events
          </AppText>
        </View>

        <View className="mt-3 gap-4">
          {isLoading ? (
            <AppText className="text-sm text-slate-400 dark:text-slate-500">
              Loading events...
            </AppText>
          ) : null}
          {errorMessage ? (
            <AppText className="text-sm text-red-500">{errorMessage}</AppText>
          ) : null}
          {todayEvents.map((event) => (
            <EventCard
              key={event.id}
              title={event.title}
              time={formatEventTime(event.start_at, event.end_at)}
              location={event.location ?? "Location TBD"}
              price={
                event.fee_type?.toLowerCase() === "paid"
                  ? event.fee_amount
                    ? `${event.fee_amount} ETB`
                    : "Paid"
                  : "Free"
              }
              image={event.cover_url ?? fallbackEventImage}
              badge="Today"
              host={event.host_name ? `By ${event.host_name}` : undefined}
              iconColor={iconColor}
              onPress={() => router.push(`../events/${event.id}`)}
            />
          ))}
        </View>

        <AppText className="mt-8 text-lg font-semibold text-slate-900 dark:text-slate-100">
          Next Week
        </AppText>
        <View className="mt-3 gap-4">
          {nextWeekEvents.map((event) => (
            <EventCard
              key={event.id}
              title={event.title}
              time={formatEventTime(event.start_at, event.end_at)}
              location={event.location ?? "Location TBD"}
              price={
                event.fee_type?.toLowerCase() === "paid"
                  ? event.fee_amount
                    ? `${event.fee_amount} ETB`
                    : "Paid"
                  : "Free"
              }
              image={event.cover_url ?? fallbackEventImage}
              host={event.host_name ? `By ${event.host_name}` : undefined}
              iconColor={iconColor}
              onPress={() => router.push(`../events/${event.id}`)}
            />
          ))}
        </View>

        <View className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-900/40">
          <AppText className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Create your own event
          </AppText>
          <AppText className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Promote your club and invite students in minutes.
          </AppText>
        </View>
      </ScrollView>

      <Pressable
        onPress={() => router.push("/events/create-events")}
        className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-green-600 shadow-lg dark:bg-green-400"
      >
        <Ionicons name="add" size={26} color={colors.chipActiveText} />
      </Pressable>
    </View>
  );
}
