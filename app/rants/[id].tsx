import React, { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  Pressable,
  TextInput,
  useColorScheme,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { AppText } from "../../components/AppText";
import { SafeAreaView } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import { supabase } from "../../lib/supabase";
import { useSupabase } from "../../providers/SupabaseProvider";

type RantDetail = {
  id: string;
  content: string;
  created_at: string;
  category: string | null;
  views: number;
  comment_count: number;
};

type RantComment = {
  id: string;
  content: string;
  likes: number;
  created_at: string;
  user_id: string | null;
};

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

export default function RantCommentsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { session } = useSupabase();
  const [rant, setRant] = useState<RantDetail | null>(null);
  const [comments, setComments] = useState<RantComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const scheme = useColorScheme();
  const iconColors = {
    text: scheme === "dark" ? "#E5E7EB" : "#0F172A",
    muted: scheme === "dark" ? "#94A3B8" : "#64748B",
    accent: scheme === "dark" ? "#4ADE80" : "#16A34A",
    placeholder: scheme === "dark" ? "#94A3B8" : "#64748B",
    chipText: scheme === "dark" ? "#0B0B0B" : "#FFFFFF",
  };

  useEffect(() => {
    let isMounted = true;

    const loadRant = async () => {
      if (!id) return;

      setIsLoading(true);
      setErrorMessage(null);

      const { data: rantData, error: rantError } = await supabase
        .from("rants")
        .select("id, content, created_at, category, views, comment_count")
        .eq("id", id)
        .maybeSingle();

      if (rantError && isMounted) {
        setErrorMessage(rantError.message);
      }

      const { data: commentData, error: commentError } = await supabase
        .from("rant_comments")
        .select("id, content, likes, created_at, user_id")
        .eq("rant_id", id)
        .is("parent_comment_id", null)
        .order("created_at", { ascending: true });

      if (commentError && isMounted) {
        setErrorMessage(commentError.message);
      }

      if (isMounted) {
        setRant((rantData as RantDetail) ?? null);
        setComments((commentData ?? []) as RantComment[]);
        setIsLoading(false);
      }
    };

    loadRant();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleSend = async () => {
    if (!session?.user) {
      setErrorMessage("Please log in to comment.");
      return;
    }

    if (!commentText.trim() || !id) {
      return;
    }

    setIsSending(true);
    setErrorMessage(null);

    const { data, error } = await supabase
      .from("rant_comments")
      .insert({
        rant_id: id,
        user_id: session.user.id,
        content: commentText.trim(),
        parent_comment_id: null,
      })
      .select("id, content, likes, created_at, user_id")
      .single();

    setIsSending(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setComments((prev) => [...prev, data as RantComment]);
    setCommentText("");
    setRant((prev) =>
      prev ? { ...prev, comment_count: (prev.comment_count ?? 0) + 1 } : prev,
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">
      <View className="flex-1 bg-white dark:bg-slate-950">
        <ScrollView contentContainerClassName="px-[18px] py-4 pb-28">
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
            <Pressable
              onPress={() => router.back()}
              className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 items-center justify-center"
            >
              <Feather name="arrow-left" size={24} color="black" />
            </Pressable>

            <AppText className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Comments
            </AppText>
            <View className="w-14" />
          </View>
          {/* Rant Card */}
          <View className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl p-4 mb-4">
            <AppText className="text-sm font-semibold mb-2.5 text-slate-900 dark:text-slate-100">
              Rant #{id ?? "-"}
            </AppText>

            <AppText className="text-[15px] leading-[22px] text-slate-900 dark:text-slate-100">
              {isLoading
                ? "Loading rant..."
                : (rant?.content ?? "Rant not found.")}
            </AppText>
            {rant ? (
              <View className="mt-3 flex-row items-center gap-2">
                <AppText className="text-xs text-slate-400 dark:text-slate-500">
                  {formatTimeAgo(rant.created_at)}
                </AppText>
                <View className="h-1 w-1 rounded-full bg-slate-200 dark:bg-slate-800" />
                <AppText className="text-xs text-green-600 dark:text-green-400">
                  {rant.category ?? "General"}
                </AppText>
                <View className="h-1 w-1 rounded-full bg-slate-200 dark:bg-slate-800" />
                <AppText className="text-xs text-slate-400 dark:text-slate-500">
                  {rant.views} views
                </AppText>
              </View>
            ) : null}
          </View>

          {/* Section Title */}
          <AppText className="text-xs uppercase tracking-wider mb-3 text-slate-400 dark:text-slate-500">
            Discussion
          </AppText>

          {errorMessage ? (
            <AppText className="mb-3 text-sm text-red-500">
              {errorMessage}
            </AppText>
          ) : null}

          {/* Comments */}
          {comments.map((comment) => (
            <View
              key={comment.id}
              className="py-3.5 border-b border-slate-200 dark:border-slate-800"
            >
              {/* Header */}
              <View className="flex-row items-center mb-2">
                <View className="w-9 h-9 rounded-full items-center justify-center mr-2.5 bg-slate-100 dark:bg-slate-900">
                  <AppText className="text-xs font-semibold text-green-600 dark:text-green-400">
                    {comment.user_id ? "ST" : "AN"}
                  </AppText>
                </View>

                <View className="flex-1">
                  <AppText className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {comment.user_id ? "Student" : "Anonymous"}
                  </AppText>
                  <AppText className="text-[11px] mt-0.5 text-slate-500 dark:text-slate-400">
                    {formatTimeAgo(comment.created_at)}
                  </AppText>
                </View>
              </View>

              {/* Body */}
              <AppText className="text-sm leading-5 text-slate-900 dark:text-slate-100">
                {comment.content}
              </AppText>

              {/* Actions */}
              <View className="flex-row items-center gap-2 mt-2.5">
                <Ionicons
                  name="heart-outline"
                  size={16}
                  color={iconColors.muted}
                />
                <AppText className="text-xs text-slate-500 dark:text-slate-400">
                  {comment.likes}
                </AppText>
                <AppText className="text-xs ml-2 text-green-600 dark:text-green-400">
                  Reply
                </AppText>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Input Bar */}
        <View className="absolute bottom-0 left-0 right-0 flex-row items-center px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <TextInput
            placeholder="Join the discussion..."
            placeholderTextColor={iconColors.placeholder}
            className="flex-1 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-full px-4 py-2 mr-2"
            value={commentText}
            onChangeText={setCommentText}
          />

          <Pressable
            onPress={handleSend}
            className={`w-10 h-10 rounded-full items-center justify-center bg-green-600 dark:bg-green-400 ${
              isSending ? "opacity-60" : ""
            }`}
            disabled={isSending}
          >
            <Ionicons name="send" size={18} color={iconColors.chipText} />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

