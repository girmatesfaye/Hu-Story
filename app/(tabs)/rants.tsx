import React, { useCallback, useEffect, useState } from "react";
import {
  ScrollView,
  View,
  Pressable,
  Image,
  useColorScheme,
} from "react-native";
import { AppText } from "../../components/AppText";
import { ReportModal } from "../../components/ReportModal";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../../lib/supabase";
import { useSupabase } from "../../providers/SupabaseProvider";

const chips = ["All Rants", "Academics", "Dorms", "Cafeteria", "Spots"];

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

export default function RantsScreen() {
  const router = useRouter();
  const { session } = useSupabase();
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [activeChip, setActiveChip] = useState(chips[0]);
  const [rants, setRants] = useState<RantItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const scheme = useColorScheme();
  const iconColors = {
    text: scheme === "dark" ? "#E5E7EB" : "#0F172A",
    muted: scheme === "dark" ? "#94A3B8" : "#64748B",
    accent: scheme === "dark" ? "#4ADE80" : "#16A34A",
    danger: scheme === "dark" ? "#F87171" : "#DC2626",
    chipText: scheme === "dark" ? "#0B0B0B" : "#FFFFFF",
  };

  const loadRants = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    let query = supabase
      .from("rants")
      .select(
        "id, user_id, category, content, upvotes, downvotes, comment_count, views, created_at, is_anonymous",
      )
      .order("created_at", { ascending: false });

    if (activeChip !== "All Rants") {
      query = query.eq("category", activeChip);
    }

    const { data, error } = await query;

    if (error) {
      setErrorMessage(error.message);
      setRants([]);
    } else {
      const rows = (data ?? []) as RantItem[];
      const rantIds = rows.map((rant) => rant.id);
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

      setRants(
        rows.map((rant) => ({
          ...rant,
          profile: rant.user_id ? profileMap.get(rant.user_id) : undefined,
          user_vote: voteMap.get(rant.id) ?? 0,
        })),
      );
    }

    setIsLoading(false);
  }, [activeChip, session?.user?.id]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (!isMounted) return;
      await loadRants();
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [loadRants]);

  useFocusEffect(
    useCallback(() => {
      void loadRants();
      return undefined;
    }, [loadRants]),
  );

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
    <View className="flex-1 bg-white dark:bg-slate-950">
      <ScrollView contentContainerClassName="px-5 pt-5 pb-20">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <AppText className="text-[22px] font-bold text-slate-900 dark:text-slate-100">
              HU Rants
            </AppText>
            <AppText className="text-xs mt-[2px] text-slate-500 dark:text-slate-400">
              Hawassa University Anonymous Feed
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

        {/* Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2 pb-1"
        >
          {chips.map((chip) => {
            const active = chip === activeChip;
            return (
              <View
                key={chip}
                className={`px-4 py-2 rounded-full border ${
                  active
                    ? "bg-green-600 border-green-600 dark:bg-green-400 dark:border-green-400"
                    : "bg-slate-100 border-slate-200 dark:bg-slate-900 dark:border-slate-800"
                }`}
                onTouchEnd={() => setActiveChip(chip)}
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
              </View>
            );
          })}
        </ScrollView>

        {/* Cards */}
        <View className="mt-3 gap-4">
          {isLoading ? (
            <AppText className="text-sm text-slate-400 dark:text-slate-500">
              Loading rants...
            </AppText>
          ) : null}
          {errorMessage ? (
            <AppText className="text-sm text-red-500">{errorMessage}</AppText>
          ) : null}
          {rants.map((rant) => (
            <Pressable
              key={rant.id}
              onPress={() => router.push(`/rants/${rant.id}`)}
              className="rounded-2xl p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
            >
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
                    color={iconColors.muted}
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
                        rant.user_vote === 1
                          ? iconColors.accent
                          : iconColors.muted
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
                        rant.user_vote === -1
                          ? iconColors.danger
                          : iconColors.muted
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
                      color={iconColors.muted}
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
                      color={iconColors.muted}
                    />
                    <AppText className="text-xs text-slate-500 dark:text-slate-400">
                      {rant.comment_count} Comments
                    </AppText>
                  </Pressable>
                </View>
              </View>
            </Pressable>
          ))}
        </View>

        <AppText className="text-xs text-center mt-4 text-slate-400 dark:text-slate-500">
          You are all caught up!
        </AppText>
      </ScrollView>
      {/* FAB */}
      <Pressable
        onPress={() => router.push("/rants/create-rants")}
        className="absolute right-5 bottom-5 w-14 h-14 rounded-full items-center justify-center bg-green-600 dark:bg-green-400 shadow-lg"
      >
        <Ionicons name="add" size={26} color={iconColors.chipText} />
      </Pressable>
      <ReportModal
        visible={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        onSubmit={handleReportSubmit}
      />
    </View>
  );
}
