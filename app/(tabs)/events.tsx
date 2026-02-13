import React from "react";
import { Image, Pressable, ScrollView, TextInput, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { AppText } from "../../components/AppText";
import { useTheme } from "../../hooks/useTheme";

const dateChips = [
  { id: "d1", day: "OCT", date: "12", active: true },
  { id: "d2", day: "OCT", date: "13" },
  { id: "d3", day: "OCT", date: "14" },
  { id: "d4", day: "OCT", date: "15" },
  { id: "d5", day: "OCT", date: "16" },
  { id: "d6", day: "OCT", date: "17" },
];

const todayEvents = [
  {
    id: "t1",
    title: "Freshman Welcome Party",
    time: "6:00 PM - 10:00 PM",
    location: "Main Campus Hall",
    price: "Free",
    image:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=600&q=80",
    attendees: ["JD", "MK"],
    extra: "+12",
    badge: "Today",
  },
  {
    id: "t2",
    title: "Intro to Python Workshop",
    time: "2:00 PM - 4:00 PM",
    location: "Tech Block B, Lab 3",
    price: "50 ETB",
    image:
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=600&q=80",
    host: "By CS Club",
  },
];

const nextWeekEvents = [
  {
    id: "n1",
    title: "Hawassa Charity Run",
    time: "7:00 AM Start",
    location: "Stadium Entrance",
    price: "Free",
    image:
      "https://images.unsplash.com/photo-1483721310020-03333e577078?auto=format&fit=crop&w=600&q=80",
    dateTag: "OCT 20",
    action: "Details",
  },
  {
    id: "n2",
    title: "Architecture Showcase",
    time: "Oct 22 • 4:00 PM",
    location: "Design Studio A",
    price: "Closed",
    image:
      "https://images.unsplash.com/photo-1479839672679-a46483c0e7c8?auto=format&fit=crop&w=600&q=80",
    soldOut: true,
  },
];

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

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <ScrollView contentContainerClassName="px-5 pb-28 pt-4">
        <View className="flex-row items-center justify-between">
          <View>
            <AppText className="text-sm text-slate-500 dark:text-slate-400">
              Hawassa University
            </AppText>
            <AppText className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
              Upcoming Events
            </AppText>
          </View>

          <Pressable className="h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <Ionicons
              name="notifications-outline"
              size={20}
              color={colors.text}
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
          <Pressable className="h-12 w-12 items-center justify-center rounded-2xl bg-green-100 dark:bg-green-400/20">
            <Ionicons name="options-outline" size={20} color={colors.accent} />
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="mt-5 gap-3"
        >
          {dateChips.map((chip) => (
            <Pressable
              key={chip.id}
              className={`h-16 w-16 items-center justify-center rounded-2xl border ${
                chip.active
                  ? "border-green-600 bg-green-600"
                  : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
              }`}
            >
              <AppText
                className={`text-[11px] font-semibold ${
                  chip.active
                    ? "text-white"
                    : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {chip.day}
              </AppText>
              <AppText
                className={`text-lg font-semibold ${
                  chip.active
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
            3 Events
          </AppText>
        </View>

        <View className="mt-3 gap-4">
          {todayEvents.map((event) => (
            <EventCard
              key={event.id}
              {...event}
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
              {...event}
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
