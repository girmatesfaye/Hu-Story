import React, { useEffect, useState } from "react";
import {
  Image,
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
import AsyncStorage from "@react-native-async-storage/async-storage";

type RantDetail = {
  id: string;
  user_id: string | null;
  content: string;
  created_at: string;
  category: string | null;
  views: number;
  comment_count: number;
  is_anonymous: boolean;
};

type RantAuthor = {
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
};

type RantComment = {
  id: string;
  content: string;
  likes: number;
  created_at: string;
  user_id: string | null;
  is_anonymous?: boolean;
  parent_comment_id?: string | null;
  is_liked?: boolean;
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
  const [author, setAuthor] = useState<RantAuthor | null>(null);
  const [comments, setComments] = useState<RantComment[]>([]);
  const [commentProfiles, setCommentProfiles] = useState<
    Record<string, RantAuthor>
  >({});
  const [commentText, setCommentText] = useState("");
  const [isAnonymousComment, setIsAnonymousComment] = useState(false);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
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

  const fallbackAvatar =
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=80&q=80";

  const commentById = new Map(comments.map((comment) => [comment.id, comment]));
  const depthCache = new Map<string, number>();

  const getDepth = (commentId: string, visited = new Set<string>()): number => {
    if (depthCache.has(commentId)) return depthCache.get(commentId) as number;
    if (visited.has(commentId)) return 0;
    visited.add(commentId);

    const current = commentById.get(commentId);
    if (!current?.parent_comment_id) {
      depthCache.set(commentId, 0);
      return 0;
    }

    const depth = 1 + getDepth(current.parent_comment_id, visited);
    depthCache.set(commentId, depth);
    return depth;
  };

  useEffect(() => {
    let isMounted = true;
    const cacheKey = id ? `rant-comments:${id}` : null;

    const loadCached = async () => {
      if (!cacheKey) return;
      try {
        const cached = await AsyncStorage.getItem(cacheKey);
        if (!cached || !isMounted) return;
        const parsed = JSON.parse(cached) as {
          rant?: RantDetail | null;
          comments?: RantComment[];
        };
        if (parsed.rant) setRant(parsed.rant);
        if (parsed.comments) setComments(parsed.comments);
      } catch {
        // ignore cache errors
      }
    };

    const loadRant = async () => {
      if (!id) return;

      setIsLoading(true);
      setErrorMessage(null);

      const { data: rantData, error: rantError } = await supabase
        .from("rants")
        .select(
          "id, user_id, content, created_at, category, views, comment_count, is_anonymous",
        )
        .eq("id", id)
        .maybeSingle();

      if (rantError && isMounted) {
        setErrorMessage(rantError.message);
      }

      const { data: commentData, error: commentError } = await supabase
        .from("rant_comments")
        .select(
          "id, content, likes, created_at, user_id, parent_comment_id, is_anonymous",
        )
        .eq("rant_id", id)
        .order("created_at", { ascending: true });

      if (commentError && isMounted) {
        setErrorMessage(commentError.message);
      }

      if (isMounted) {
        const detail = (rantData as RantDetail) ?? null;
        setRant(detail);
        const rows = (commentData ?? []) as RantComment[];
        let likeMap = new Map<string, boolean>();
        const commentUserIds = Array.from(
          new Set(
            rows
              .map((row) => row.user_id)
              .filter((userId): userId is string => Boolean(userId)),
          ),
        );

        if (commentUserIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, full_name, username, avatar_url")
            .in("user_id", commentUserIds);

          setCommentProfiles(
            (profiles ?? []).reduce<Record<string, RantAuthor>>(
              (acc, profile) => {
                acc[profile.user_id] = {
                  full_name: profile.full_name,
                  username: profile.username,
                  avatar_url: profile.avatar_url,
                };
                return acc;
              },
              {},
            ),
          );
        } else {
          setCommentProfiles({});
        }

        if (session?.user?.id && rows.length > 0) {
          const commentIds = rows.map((row) => row.id);
          const { data: likes } = await supabase
            .from("rant_comment_likes")
            .select("comment_id")
            .in("comment_id", commentIds)
            .eq("user_id", session.user.id);

          likeMap = new Map(
            (likes ?? []).map((like) => [like.comment_id, true]),
          );
        }

        setComments(
          rows.map((row) => ({
            ...row,
            is_liked: likeMap.get(row.id) ?? false,
          })),
        );
        setIsLoading(false);

        if (detail && !detail.is_anonymous && detail.user_id) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("full_name, username, avatar_url")
            .eq("user_id", detail.user_id)
            .maybeSingle();
          if (isMounted) {
            setAuthor((profileData as RantAuthor) ?? null);
          }
        } else {
          setAuthor(null);
        }
      }

      if (cacheKey && !rantError && !commentError) {
        try {
          await AsyncStorage.setItem(
            cacheKey,
            JSON.stringify({
              rant: (rantData as RantDetail) ?? null,
              comments: (commentData ?? []) as RantComment[],
            }),
          );
        } catch {
          // ignore cache errors
        }
      }
    };

    loadCached();
    loadRant();

    const incrementViews = async () => {
      if (!id) return;
      const { data, error } = await supabase.rpc("increment_rant_views", {
        p_rant_id: id,
      });
      if (!error && isMounted && typeof data === "number") {
        setRant((prev) => (prev ? { ...prev, views: data } : prev));
      }
    };

    incrementViews();

    return () => {
      isMounted = false;
    };
  }, [id, session?.user?.id]);

  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`rant-comments-${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rant_comments",
          filter: `rant_id=eq.${id}`,
        },
        (payload) => {
          const eventType = payload.eventType;

          if (eventType === "INSERT") {
            const newRow = payload.new as RantComment;

            setComments((prev) => {
              if (prev.some((comment) => comment.id === newRow.id)) return prev;
              return [...prev, { ...newRow, is_liked: false }];
            });

            if (newRow.user_id) {
              setCommentProfiles((prev) => {
                if (newRow.user_id && prev[newRow.user_id]) return prev;
                return prev;
              });

              void supabase
                .from("profiles")
                .select("user_id, full_name, username, avatar_url")
                .eq("user_id", newRow.user_id)
                .maybeSingle()
                .then(({ data }) => {
                  if (!data?.user_id) return;
                  setCommentProfiles((prev) => ({
                    ...prev,
                    [data.user_id]: {
                      full_name: data.full_name,
                      username: data.username,
                      avatar_url: data.avatar_url,
                    },
                  }));
                });
            }

            if (newRow.parent_comment_id) {
              setExpandedIds((prev) => ({
                ...prev,
                [newRow.parent_comment_id as string]: true,
              }));
            }
            setRant((prev) =>
              prev
                ? {
                    ...prev,
                    comment_count: (prev.comment_count ?? 0) + 1,
                  }
                : prev,
            );
          }

          if (eventType === "UPDATE") {
            const updatedRow = payload.new as RantComment;
            setComments((prev) =>
              prev.map((comment) =>
                comment.id === updatedRow.id
                  ? { ...updatedRow, is_liked: comment.is_liked }
                  : comment,
              ),
            );
          }

          if (eventType === "DELETE") {
            const oldRow = payload.old as RantComment;
            setComments((prev) =>
              prev.filter((comment) => comment.id !== oldRow.id),
            );
            setRant((prev) =>
              prev
                ? {
                    ...prev,
                    comment_count: Math.max((prev.comment_count ?? 1) - 1, 0),
                  }
                : prev,
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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

    const { data, error } = await supabase.rpc("add_rant_comment", {
      p_rant_id: id,
      p_parent_id: replyToId,
      p_content: commentText.trim(),
      p_is_anonymous: isAnonymousComment,
    });

    setIsSending(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    if (data) {
      setComments((prev) => [
        ...prev,
        { ...(data as RantComment), is_liked: false },
      ]);
    }
    setCommentText("");
    if (replyToId) {
      setExpandedIds((prev) => ({
        ...prev,
        [replyToId]: true,
      }));
    }
    setReplyToId(null);
    setIsAnonymousComment(false);
    setRant((prev) =>
      prev ? { ...prev, comment_count: (prev.comment_count ?? 0) + 1 } : prev,
    );
  };

  const handleToggleLike = async (commentId: string) => {
    if (!session?.user?.id) {
      setErrorMessage("Please log in to like comments.");
      return;
    }

    let previousLiked = false;
    let previousLikes = 0;
    let nextLiked = false;

    setComments((prev) =>
      prev.map((comment) => {
        if (comment.id !== commentId) return comment;
        previousLiked = comment.is_liked ?? false;
        previousLikes = comment.likes;
        nextLiked = !previousLiked;

        return {
          ...comment,
          is_liked: nextLiked,
          likes: Math.max(comment.likes + (nextLiked ? 1 : -1), 0),
        };
      }),
    );

    const { data, error } = await supabase.rpc("set_rant_comment_like", {
      p_comment_id: commentId,
      p_is_liked: nextLiked,
    });

    if (error) {
      setErrorMessage(error.message);
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === commentId
            ? {
                ...comment,
                is_liked: previousLiked,
                likes: previousLikes,
              }
            : comment,
        ),
      );
      return;
    }

    if (typeof data === "number") {
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === commentId ? { ...comment, likes: data } : comment,
        ),
      );
    }
  };

  const toggleReplies = (commentId: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  const startReply = (commentId: string) => {
    setReplyToId((prev) => (prev === commentId ? null : commentId));
    setExpandedIds((prev) => ({
      ...prev,
      [commentId]: true,
    }));
  };

  const rootComments = comments.filter((comment) => !comment.parent_comment_id);
  const replyMap = comments.reduce<Record<string, RantComment[]>>(
    (acc, comment) => {
      if (comment.parent_comment_id) {
        if (!acc[comment.parent_comment_id]) {
          acc[comment.parent_comment_id] = [];
        }
        acc[comment.parent_comment_id].push(comment);
      }
      return acc;
    },
    {},
  );

  const renderComment = (comment: RantComment, depth: number) => {
    const replies = replyMap[comment.id] ?? [];
    const isExpanded = expandedIds[comment.id] ?? false;
    const commentProfile = comment.user_id
      ? commentProfiles[comment.user_id]
      : null;
    const isAnonymous = Boolean(comment.is_anonymous);
    const displayName = isAnonymous
      ? "Anonymous"
      : comment.user_id
        ? commentProfile?.full_name || commentProfile?.username || "Student"
        : "Anonymous";
    const avatarUrl = isAnonymous
      ? null
      : comment.user_id
        ? commentProfile?.avatar_url
        : null;

    const replyIndent = 16;
    return (
      <View
        key={comment.id}
        style={{ marginLeft: comment.parent_comment_id ? replyIndent : 0 }}
      >
        <View>
          <View className="py-3.5 border-b border-slate-200 dark:border-slate-800">
            <View className="flex-row items-center mb-2">
              {avatarUrl ? (
                <View className="w-9 h-9 rounded-full overflow-hidden mr-2.5 bg-slate-100 dark:bg-slate-900">
                  <Image
                    source={{ uri: avatarUrl }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                </View>
              ) : (
                <View className="w-9 h-9 rounded-full items-center justify-center mr-2.5 bg-slate-100 dark:bg-slate-900">
                  <AppText className="text-xs font-semibold text-green-600 dark:text-green-400">
                    {comment.user_id ? "ST" : "AN"}
                  </AppText>
                </View>
              )}

              <View className="flex-1">
                <AppText className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {displayName}
                </AppText>
                {!isAnonymous && comment.user_id && commentProfile?.username ? (
                  <AppText className="text-[11px] text-slate-500 dark:text-slate-400">
                    @{commentProfile.username}
                  </AppText>
                ) : null}
                <AppText className="text-[11px] mt-0.5 text-slate-500 dark:text-slate-400">
                  {formatTimeAgo(comment.created_at)}
                </AppText>
              </View>
            </View>

            {comment.parent_comment_id ? (
              <AppText className="text-[11px] mb-1 text-slate-500 dark:text-slate-400">
                Replying to a comment
              </AppText>
            ) : null}
            <AppText className="text-sm leading-5 text-slate-900 dark:text-slate-100">
              {comment.content}
            </AppText>

            <View className="flex-row items-center gap-3 mt-2.5">
              <Pressable
                onPress={() => handleToggleLike(comment.id)}
                className="flex-row items-center gap-1"
              >
                <Ionicons
                  name={comment.is_liked ? "heart" : "heart-outline"}
                  size={16}
                  color={comment.is_liked ? "#DC2626" : iconColors.muted}
                />
                <AppText className="text-xs text-slate-500 dark:text-slate-400">
                  {comment.likes}
                </AppText>
              </Pressable>

              <Pressable onPress={() => startReply(comment.id)}>
                <AppText className="text-xs text-green-600 dark:text-green-400">
                  {replyToId === comment.id ? "Cancel" : "Reply"}
                </AppText>
              </Pressable>

              {replies.length > 0 ? (
                <Pressable onPress={() => toggleReplies(comment.id)}>
                  <AppText className="text-xs text-slate-500 dark:text-slate-400">
                    {isExpanded
                      ? "Hide replies"
                      : `View replies (${replies.length})`}
                  </AppText>
                </Pressable>
              ) : null}
            </View>
          </View>

          {isExpanded
            ? replies.map((reply) => renderComment(reply, depth + 1))
            : null}
        </View>
      </View>
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
          {/* <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
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
          </View> */}
          {/* Rant Card */}
          <View className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl p-4 mb-4">
            <AppText className="text-sm font-semibold mb-2.5 text-slate-900 dark:text-slate-100">
              Rant #{id ?? "-"}
            </AppText>

            {rant ? (
              <View className="mb-3 flex-row items-center">
                <View className="h-9 w-9 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <Image
                    source={{
                      uri: rant.is_anonymous
                        ? "https://placehold.co/40x40/png"
                        : (author?.avatar_url ?? fallbackAvatar),
                    }}
                    className="h-full w-full"
                    resizeMode="cover"
                  />
                </View>
                <View className="ml-2">
                  <AppText className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {rant.is_anonymous
                      ? "Anonymous Student"
                      : author?.full_name || author?.username || "Student"}
                  </AppText>
                  {!rant.is_anonymous && author?.username ? (
                    <AppText className="text-xs text-slate-500 dark:text-slate-400">
                      @{author.username}
                    </AppText>
                  ) : null}
                </View>
              </View>
            ) : null}

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
          {rootComments.map((comment) => renderComment(comment, 0))}
        </ScrollView>

        {/* Input Bar */}
        <View className="absolute bottom-0 left-0 right-0 flex-row items-center px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          {replyToId ? (
            <View className="absolute -top-7 left-4 right-4 flex-row items-center justify-between rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-900">
              <AppText className="text-xs text-slate-500 dark:text-slate-400">
                Replying to a comment
              </AppText>
              <Pressable onPress={() => setReplyToId(null)}>
                <AppText className="text-xs text-green-600 dark:text-green-400">
                  Cancel
                </AppText>
              </Pressable>
            </View>
          ) : null}
          <TextInput
            placeholder={
              replyToId ? "Write a reply..." : "Join the discussion..."
            }
            placeholderTextColor={iconColors.placeholder}
            className="flex-1 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-full px-4 py-2 mr-2"
            value={commentText}
            onChangeText={setCommentText}
          />

          <Pressable
            onPress={() => setIsAnonymousComment((prev) => !prev)}
            className="w-10 h-10 rounded-full items-center justify-center bg-slate-100 dark:bg-slate-900 mr-2"
          >
            <Ionicons
              name={isAnonymousComment ? "lock-closed" : "person-circle"}
              size={18}
              color={isAnonymousComment ? iconColors.accent : iconColors.muted}
            />
          </Pressable>

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
