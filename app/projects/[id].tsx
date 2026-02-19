import React, { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AppText } from "../../components/AppText";
import { useTheme } from "../../hooks/useTheme";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import { useSupabase } from "../../providers/SupabaseProvider";

type ProjectDetail = {
  id: string;
  user_id: string | null;
  is_anonymous: boolean;
  title: string;
  summary: string | null;
  details: string | null;
  tags: string[] | null;
  views: number;
  likes: number;
  cover_url: string | null;
  repo_url: string | null;
  created_at: string;
};

type ProjectAuthor = {
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
};

const fallbackCover =
  "https://images.unsplash.com/photo-1479839672679-a46483c0e7c8?auto=format&fit=crop&w=1200&q=80";

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

export default function ProjectDetailsScreen() {
  const { statusBarStyle } = useTheme();
  const { session } = useSupabase();
  const router = useRouter();
  const scheme = useColorScheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [author, setAuthor] = useState<ProjectAuthor | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const iconColors = {
    muted: scheme === "dark" ? "#94A3B8" : "#64748B",
    danger: scheme === "dark" ? "#F87171" : "#DC2626",
  };

  useEffect(() => {
    let isMounted = true;

    const loadProject = async () => {
      if (!id) return;

      setIsLoading(true);
      setErrorMessage(null);

      const { data, error } = await supabase
        .from("projects")
        .select(
          "id, user_id, is_anonymous, title, summary, details, tags, views, likes, cover_url, repo_url, created_at",
        )
        .eq("id", id)
        .maybeSingle();

      if (!isMounted) return;

      if (error) {
        setErrorMessage(error.message);
        setProject(null);
      } else {
        const detail = (data as ProjectDetail) ?? null;
        setProject(detail);
        if (detail && !detail.is_anonymous && detail.user_id) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("full_name, username, avatar_url")
            .eq("user_id", detail.user_id)
            .maybeSingle();
          if (isMounted) {
            setAuthor((profileData as ProjectAuthor) ?? null);
          }
        } else {
          setAuthor(null);
        }

        if (detail && session?.user?.id) {
          const { data: likeData } = await supabase
            .from("project_likes")
            .select("project_id")
            .eq("project_id", detail.id)
            .eq("user_id", session.user.id)
            .maybeSingle();
          if (isMounted) {
            setIsLiked(Boolean(likeData));
          }
        } else if (isMounted) {
          setIsLiked(false);
        }
      }

      setIsLoading(false);
    };

    loadProject();

    const incrementViews = async () => {
      if (!id) return;
      const { data: viewsData, error: viewsError } = await supabase.rpc(
        "increment_project_views",
        { p_project_id: id },
      );
      if (!viewsError && isMounted && typeof viewsData === "number") {
        setProject((prev) => (prev ? { ...prev, views: viewsData } : prev));
      }
    };

    incrementViews();

    return () => {
      isMounted = false;
    };
  }, [id, session?.user?.id]);

  const handleToggleLike = async () => {
    if (!session?.user?.id || !project) {
      setErrorMessage("Please log in to like projects.");
      return;
    }

    const previousLiked = isLiked;
    const previousLikes = project.likes;
    const nextLiked = !isLiked;

    setIsLiked(nextLiked);
    setProject((prev) =>
      prev
        ? {
            ...prev,
            likes: Math.max(prev.likes + (nextLiked ? 1 : -1), 0),
          }
        : prev,
    );

    const { data, error } = await supabase.rpc("set_project_like", {
      p_project_id: project.id,
      p_is_liked: nextLiked,
    });

    if (error) {
      setErrorMessage(error.message);
      setIsLiked(previousLiked);
      setProject((prev) => (prev ? { ...prev, likes: previousLikes } : prev));
      return;
    }

    if (typeof data === "number") {
      setProject((prev) => (prev ? { ...prev, likes: data } : prev));
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">
      <View className="flex-1 bg-white dark:bg-slate-950">
        <StatusBar style={statusBarStyle} />
        <View className="flex-row items-center justify-between px-5 pb-3 pt-6">
          <TouchableOpacity
            className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900"
            accessibilityRole="button"
            onPress={() => router.back()}
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color={statusBarStyle === "light" ? "#E5E7EB" : "#0F172A"}
            />
          </TouchableOpacity>
          <AppText className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Project Details
          </AppText>
          <TouchableOpacity
            className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900"
            accessibilityRole="button"
          >
            <Ionicons
              name="share-social-outline"
              size={18}
              color={statusBarStyle === "light" ? "#E5E7EB" : "#0F172A"}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="pb-28"
          showsVerticalScrollIndicator={false}
        >
          {project?.cover_url ? (
            <Image
              source={{ uri: project.cover_url }}
              className="h-56 w-full"
              resizeMode="cover"
            />
          ) : (
            <Image
              source={{ uri: fallbackCover }}
              className="h-56 w-full"
              resizeMode="cover"
            />
          )}

          <View className="px-5 pt-6">
            <AppText className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {isLoading ? "Loading project..." : (project?.title ?? "Project")}
            </AppText>

            <View className="mt-4 flex-row items-center">
              <View className="h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-amber-200 dark:bg-amber-700">
                <Image
                  source={{
                    uri: project?.is_anonymous
                      ? "https://placehold.co/40x40/png"
                      : (author?.avatar_url ??
                        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=80&q=80"),
                  }}
                  className="h-full w-full"
                  resizeMode="cover"
                />
              </View>
              <View className="ml-3">
                <AppText className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {project?.is_anonymous
                    ? "Anonymous Student"
                    : author?.full_name || author?.username || "Student"}
                </AppText>
                {!project?.is_anonymous && author?.username ? (
                  <AppText className="text-xs text-slate-500 dark:text-slate-400">
                    @{author.username}
                  </AppText>
                ) : null}
                <AppText className="text-xs text-slate-500 dark:text-slate-400">
                  {project?.created_at ? formatTimeAgo(project.created_at) : ""}
                </AppText>
              </View>
            </View>

            <View className="mt-4 flex-row items-center gap-6">
              <View className="flex-row items-center gap-2">
                <Ionicons
                  name="eye-outline"
                  size={18}
                  color={iconColors.muted}
                />
                <AppText className="text-sm text-slate-500 dark:text-slate-400">
                  {project?.views ?? 0}
                </AppText>
              </View>
              <Pressable
                onPress={handleToggleLike}
                className="flex-row items-center gap-2"
              >
                <Ionicons
                  name={isLiked ? "heart" : "heart-outline"}
                  size={18}
                  color={isLiked ? iconColors.danger : iconColors.muted}
                />
                <AppText className="text-sm text-slate-500 dark:text-slate-400">
                  {project?.likes ?? 0}
                </AppText>
              </Pressable>
            </View>

            {errorMessage ? (
              <AppText className="mt-3 text-sm text-red-500">
                {errorMessage}
              </AppText>
            ) : null}

            <AppText className="mt-6 text-lg font-semibold text-slate-900 dark:text-slate-100">
              About this project
            </AppText>
            <AppText className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {project?.details ?? project?.summary ?? "No details yet."}
            </AppText>

            <AppText className="mt-8 text-xs font-semibold tracking-[2px] text-slate-400 dark:text-slate-500">
              TECH STACK
            </AppText>
            <View className="mt-3 flex-row flex-wrap gap-2">
              {(project?.tags ?? []).map((tag) => (
                <View
                  key={tag}
                  className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1 dark:border-emerald-900/40 dark:bg-emerald-900/30"
                >
                  <AppText className="text-xs font-semibold text-emerald-700 dark:text-emerald-200">
                    {tag}
                  </AppText>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        <View className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-950">
          <Pressable className="flex-row items-center justify-center gap-2 rounded-xl bg-green-600 py-3">
            <AppText className="text-sm font-semibold text-white">
              View Repository
            </AppText>
            <Ionicons
              name="arrow-up-right-box-outline"
              size={20}
              color="#FFFFFF"
            />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
