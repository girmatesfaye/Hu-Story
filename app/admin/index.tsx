import React from "react";
import { Image, Pressable, ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import Feather from "@expo/vector-icons/Feather";
import { AppText } from "../../components/AppText";
import { useTheme } from "../../hooks/useTheme";

const moderationTabs = [
  { id: "pending", label: "Pending", count: 12, active: true },
  { id: "history", label: "History", count: 0, active: false },
];

const moderationItems = [
  {
    id: "8291",
    type: "RANT",
    time: "2m ago",
    reason: "Harassment",
    userName: "Anon_Jaguar22",
    userScore: "Low",
    content:
      "This professor is the absolute worst, I hope he gets fired immediately. If I see him on campus I swear I'm going to...",
    note: "User is threatening staff physically. This is the second time this week.",
    actions: ["Keep", "Warn User", "Delete"],
    tagColor: "bg-purple-100 text-purple-700",
    reasonColor: "bg-red-50 text-red-600",
    scoreColor: "text-amber-600",
  },
  {
    id: "8288",
    type: "SPOT",
    time: "15m ago",
    reason: "Inappropriate",
    userName: "DormLife_101",
    userScore: "High",
    content:
      "Check out what someone left in the common room last night... absolutely disgusting...",
    note: "Contains graphic content not suitable for the feed.",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=200&q=80",
    actions: ["Keep", "Warn User", "Delete"],
    tagColor: "bg-emerald-100 text-emerald-700",
    reasonColor: "bg-orange-50 text-orange-600",
    scoreColor: "text-emerald-600",
  },
  {
    id: "8285",
    type: "COMMENT",
    time: "1h ago",
    reason: "Spam",
    userName: "CheapEssays_Bot",
    userScore: "Banned (Pending)",
    content:
      "NEED HELP WITH FINALS?? Visit essay-helper-now[.]com for guaranteed A+ ...",
    note: "Multiple users flagged this as spam. Similar text detected in 15 other comments.",
    actions: ["Keep", "Confirm Ban & Delete"],
    tagColor: "bg-blue-100 text-blue-700",
    reasonColor: "bg-slate-100 text-slate-600",
    scoreColor: "text-red-600",
  },
];

function ModerationCard({
  item,
  iconColor,
}: {
  item: (typeof moderationItems)[number];
  iconColor: string;
}) {
  const hasImage = Boolean(item.image);

  return (
    <View className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <View className={`rounded-full px-2.5 py-1 ${item.tagColor}`}>
            <AppText className="text-[11px] font-semibold">{item.type}</AppText>
          </View>
          <AppText className="text-xs text-slate-400">#{item.id}</AppText>
          <AppText className="text-xs text-slate-400">• {item.time}</AppText>
        </View>
        <View className={`rounded-full px-3 py-1 ${item.reasonColor}`}>
          <AppText className="text-[11px] font-semibold">{item.reason}</AppText>
        </View>
      </View>

      <View className="mt-4 flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
          <AppText className="text-sm font-semibold text-slate-600 dark:text-slate-200">
            {item.userName.split("_")[0].slice(0, 1).toUpperCase()}
            {item.userName.split("_")[1]?.slice(0, 1)?.toUpperCase() ?? ""}
          </AppText>
        </View>
        <View className="flex-1">
          <AppText className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {item.userName}
          </AppText>
          <AppText className={`text-xs ${item.scoreColor}`}>
            User Score: {item.userScore}
          </AppText>
        </View>
      </View>

      <View className="mt-4 flex-row gap-3">
        {hasImage ? (
          <Image
            source={{ uri: item.image as string }}
            className="h-16 w-16 rounded-xl"
          />
        ) : null}
        <View className="flex-1 rounded-xl bg-slate-100 px-3 py-3 dark:bg-slate-800">
          <AppText className="text-xs leading-5 text-slate-600 dark:text-slate-200">
            {item.content}
          </AppText>
        </View>
      </View>

      <View className="mt-3 flex-row items-start gap-2">
        <Feather name="flag" size={14} color={iconColor} />
        <AppText className="flex-1 text-xs text-slate-500 dark:text-slate-400">
          Reporter&apos;s Note: {item.note}
        </AppText>
      </View>

      <View className="mt-4 flex-row gap-3">
        {item.actions.map((action) => {
          const isPrimary = action.includes("Confirm");
          const isWarn = action.includes("Warn");
          const isDelete = action.includes("Delete");
          return (
            <Pressable
              key={action}
              className={`flex-1 items-center justify-center rounded-xl border px-3 py-2 ${
                isPrimary
                  ? "border-emerald-500 bg-emerald-500"
                  : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
              } ${isWarn ? "border-amber-300 bg-amber-50" : ""} ${
                isDelete ? "border-red-200 bg-red-50" : ""
              }`}
            >
              <AppText
                className={`text-xs font-semibold ${
                  isPrimary
                    ? "text-white"
                    : isWarn
                      ? "text-amber-700"
                      : isDelete
                        ? "text-red-600"
                        : "text-slate-700 dark:text-slate-100"
                }`}
              >
                {action}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function AdminScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <View className="px-5 pt-2">
        <View className="flex-row items-center justify-between">
          <View>
            <AppText className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              Moderation Center
            </AppText>
            <AppText className="text-sm text-slate-500 dark:text-slate-400">
              Campus Story (HU)
            </AppText>
          </View>
          <Pressable className="h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <Ionicons
              name="notifications-outline"
              size={20}
              color={colors.text}
            />
          </Pressable>
        </View>

        <View className="mt-4 flex-row rounded-2xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
          {moderationTabs.map((tab) => (
            <Pressable
              key={tab.id}
              className={`flex-1 flex-row items-center justify-center gap-2 rounded-2xl px-3 py-2 ${
                tab.active ? "bg-emerald-50 dark:bg-emerald-500/20" : ""
              }`}
            >
              <AppText
                className={`text-sm font-semibold ${
                  tab.active
                    ? "text-emerald-700 dark:text-emerald-300"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                {tab.label}
              </AppText>
              {tab.count > 0 ? (
                <View className="rounded-full bg-red-100 px-2 py-0.5">
                  <AppText className="text-[11px] font-semibold text-red-600">
                    {tab.count}
                  </AppText>
                </View>
              ) : null}
            </Pressable>
          ))}
        </View>

        <View className="mt-4 flex-row items-center gap-3">
          <View className="flex-1 flex-row items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
            <Ionicons
              name="search-outline"
              size={18}
              color={colors.mutedText}
            />
            <TextInput
              placeholder="Search user ID, keyword, or report ID..."
              placeholderTextColor={colors.mutedStrong}
              className="flex-1 text-sm text-slate-900 dark:text-slate-100"
            />
          </View>
          <Pressable className="h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
            <Ionicons
              name="options-outline"
              size={20}
              color={colors.mutedText}
            />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerClassName="gap-4 px-5 pb-28 pt-5">
        {moderationItems.map((item) => (
          <ModerationCard
            key={item.id}
            item={item}
            iconColor={colors.mutedText}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
