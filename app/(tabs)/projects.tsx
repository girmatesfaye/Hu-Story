import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
  ViewToken,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { AppText } from "../../components/AppText";
import { FetchErrorModal } from "../../components/FetchErrorModal";
import { SkeletonBlock } from "../../components/SkeletonBlock";
import { useTheme } from "../../hooks/useTheme";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useSupabase } from "../../providers/SupabaseProvider";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { formatTimeAgo } from "../../lib/ui/formatters";

type ProjectItem = {
  id: string;
  user_id: string | null;
  is_anonymous: boolean;
  title: string;
  summary: string | null;
  tags: string[] | null;
  created_at: string;
  views: number;
  likes: number;
  cover_url: string | null;
  is_liked?: boolean;
  profile?: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
};

const fallbackAvatar =
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=80&q=80";

function ProjectCardSkeleton() {
  return (
    <View className="mt-6 rounded-3xl bg-white p-4 dark:bg-slate-900">
      <SkeletonBlock className="h-44 w-full rounded-2xl" />
      <View className="mt-4">
        <View className="flex-row items-center justify-between">
          <SkeletonBlock className="h-5 w-1/2 rounded-md" />
          <SkeletonBlock className="h-3 w-16 rounded-md" />
        </View>
        <View className="mt-3 gap-2">
          <SkeletonBlock className="h-3 w-full rounded-md" />
          <SkeletonBlock className="h-3 w-5/6 rounded-md" />
        </View>
        <View className="mt-4 flex-row gap-2">
          <SkeletonBlock className="h-6 w-16 rounded-lg" />
          <SkeletonBlock className="h-6 w-20 rounded-lg" />
        </View>
        <View className="mt-4 flex-row items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
          <View className="flex-row items-center gap-3">
            <SkeletonBlock className="h-9 w-9 rounded-full" />
            <SkeletonBlock className="h-3 w-28 rounded-md" />
          </View>
          <View className="flex-row gap-4">
            <SkeletonBlock className="h-3 w-10 rounded-md" />
            <SkeletonBlock className="h-3 w-10 rounded-md" />
          </View>
        </View>
      </View>
    </View>
  );
}

export default function ProjectsTabScreen() {
  const PAGE_SIZE = 12;
  const { statusBarStyle, colors } = useTheme();
  const { session } = useSupabase();
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"recent" | "views" | "likes">("recent");
  const [showSort, setShowSort] = useState(false);
  const [highestSeenIndex, setHighestSeenIndex] = useState(-1);
  const [unreadCount, setUnreadCount] = useState(0);
  const flatListRef = useRef<FlatList<ProjectItem>>(null);
  const projectsLengthRef = useRef(0);
  const nextPageRef = useRef(0);
  const hasMoreRef = useRef(true);
  const isFetchingRef = useRef(false);

  const loadProjects = useCallback(
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
        .from("projects")
        .select(
          "id, user_id, is_anonymous, title, summary, tags, created_at, views, likes, cover_url",
        )
        .range(from, to);

      query =
        sortBy === "views"
          ? query.order("views", { ascending: false })
          : sortBy === "likes"
            ? query.order("likes", { ascending: false })
            : query.order("created_at", { ascending: false });

      const { data, error } = await query;

      if (error) {
        setErrorMessage(error.message);
        if (reset) {
          setProjects([]);
        }
      } else {
        const rows = (data ?? []) as ProjectItem[];
        const projectIds = rows.map((project) => project.id);
        const userIds = Array.from(
          new Set(
            rows
              .filter((project) => !project.is_anonymous && project.user_id)
              .map((project) => project.user_id as string),
          ),
        );

        let profileMap = new Map<string, ProjectItem["profile"]>();
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, full_name, username, avatar_url")
            .in("user_id", userIds);

          profileMap = new Map(
            (profiles ?? []).map((profile) => [profile.user_id, profile]),
          );
        }

        let likeMap = new Map<string, boolean>();
        if (session?.user?.id && projectIds.length > 0) {
          const { data: likes } = await supabase
            .from("project_likes")
            .select("project_id")
            .in("project_id", projectIds)
            .eq("user_id", session.user.id);

          likeMap = new Map(
            (likes ?? []).map((like) => [like.project_id, true]),
          );
        }

        const hydratedRows = rows.map((project) => ({
          ...project,
          profile: project.user_id
            ? profileMap.get(project.user_id)
            : undefined,
          is_liked: likeMap.get(project.id) ?? false,
        }));

        setProjects((prev) => {
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

      if (reset) {
        setIsLoading(false);
      } else {
        setIsLoadingMore(false);
      }
      isFetchingRef.current = false;
    },
    [session?.user?.id, sortBy],
  );

  useEffect(() => {
    void loadProjects(true);
  }, [loadProjects]);

  useFocusEffect(
    useCallback(() => {
      void loadProjects(true);
      return undefined;
    }, [loadProjects]),
  );

  useEffect(() => {
    projectsLengthRef.current = projects.length;
    const nextUnread =
      highestSeenIndex >= 0
        ? Math.max(projects.length - highestSeenIndex - 1, 0)
        : 0;
    setUnreadCount(nextUnread);
  }, [highestSeenIndex, projects.length]);

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
          projectsLengthRef.current - nextHighestSeenIndex - 1,
          0,
        );
        setUnreadCount(nextUnread);
        return nextHighestSeenIndex;
      });
    },
  );

  const handleJumpToFirstUnread = useCallback(() => {
    if (!flatListRef.current || unreadCount <= 0) return;

    const targetIndex = Math.min(highestSeenIndex + 1, projects.length - 1);
    if (targetIndex < 0) return;

    flatListRef.current.scrollToIndex({
      index: targetIndex,
      animated: true,
      viewPosition: 0.1,
    });
  }, [highestSeenIndex, projects.length, unreadCount]);

  const handleToggleLike = async (projectId: string) => {
    if (!session?.user?.id) {
      setErrorMessage("Please log in to like projects.");
      return;
    }

    let previousLiked = false;
    let previousLikes = 0;
    let nextLiked = false;

    setProjects((prev) =>
      prev.map((project) => {
        if (project.id !== projectId) return project;
        previousLiked = project.is_liked ?? false;
        previousLikes = project.likes;
        nextLiked = !previousLiked;

        return {
          ...project,
          is_liked: nextLiked,
          likes: Math.max(project.likes + (nextLiked ? 1 : -1), 0),
        };
      }),
    );

    const { data, error } = await supabase.rpc("set_project_like", {
      p_project_id: projectId,
      p_is_liked: nextLiked,
    });

    if (error) {
      setErrorMessage(error.message);
      setProjects((prev) =>
        prev.map((project) =>
          project.id === projectId
            ? {
                ...project,
                is_liked: previousLiked,
                likes: previousLikes,
              }
            : project,
        ),
      );
      return;
    }

    if (typeof data === "number") {
      setProjects((prev) =>
        prev.map((project) =>
          project.id === projectId ? { ...project, likes: data } : project,
        ),
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <StatusBar style={statusBarStyle} translucent={false} />
      {isLoading ? (
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pt-6 pb-28"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-4">
              <AppText className="text-[22px] font-bold text-slate-900 dark:text-slate-100">
                Campus Projects
              </AppText>
              <AppText className="mt-1 text-sm text-slate-500  dark:text-green-400">
                Discover what peers are building.
              </AppText>
            </View>
            <TouchableOpacity
              className="h-12 w-12 items-center justify-center rounded-2xl bg-green-100 dark:bg-green-400/20"
              accessibilityRole="button"
              onPress={() => setShowSort((prev) => !prev)}
            >
              <Ionicons
                name="options-outline"
                size={20}
                color={colors.accent}
              />
            </TouchableOpacity>
          </View>

          {showSort ? (
            <View className="mt-3 flex-row gap-2">
              <Pressable
                onPress={() => {
                  setSortBy("recent");
                  setShowSort(false);
                }}
                className={`rounded-full px-4 py-2 ${
                  sortBy === "recent"
                    ? "bg-green-600"
                    : "bg-slate-100 dark:bg-slate-900"
                }`}
              >
                <AppText
                  className={`text-xs font-semibold ${
                    sortBy === "recent"
                      ? "text-white"
                      : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  Recent
                </AppText>
              </Pressable>
              <Pressable
                onPress={() => {
                  setSortBy("views");
                  setShowSort(false);
                }}
                className={`rounded-full px-4 py-2 ${
                  sortBy === "views"
                    ? "bg-green-600"
                    : "bg-slate-100 dark:bg-slate-900"
                }`}
              >
                <AppText
                  className={`text-xs font-semibold ${
                    sortBy === "views"
                      ? "text-white"
                      : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  Most Viewed
                </AppText>
              </Pressable>
              <Pressable
                onPress={() => {
                  setSortBy("likes");
                  setShowSort(false);
                }}
                className={`rounded-full px-4 py-2 ${
                  sortBy === "likes"
                    ? "bg-green-600"
                    : "bg-slate-100 dark:bg-slate-900"
                }`}
              >
                <AppText
                  className={`text-xs font-semibold ${
                    sortBy === "likes"
                      ? "text-white"
                      : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  Most Liked
                </AppText>
              </Pressable>
            </View>
          ) : null}

          {Array.from({ length: 3 }).map((_, index) => (
            <ProjectCardSkeleton key={`project-skeleton-${index}`} />
          ))}
        </ScrollView>
      ) : (
        <FlatList
          ref={flatListRef}
          data={projects}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-5 pt-6 pb-28"
          showsVerticalScrollIndicator={false}
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
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-4">
                  <AppText className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                    Campus Projects
                  </AppText>
                  <AppText className="mt-1 text-sm text-slate-500  dark:text-green-400">
                    Discover what peers are building
                  </AppText>
                </View>
                <TouchableOpacity
                  className="h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-slate-900"
                  accessibilityRole="button"
                  onPress={() => setShowSort((prev) => !prev)}
                >
                  <Ionicons
                    name="options-outline"
                    size={20}
                    color={colors.text}
                  />
                </TouchableOpacity>
              </View>

              {showSort ? (
                <View className="mt-3 flex-row gap-2">
                  <Pressable
                    onPress={() => {
                      setSortBy("recent");
                      setShowSort(false);
                    }}
                    className={`rounded-full px-4 py-2 ${
                      sortBy === "recent"
                        ? "bg-green-600"
                        : "bg-slate-100 dark:bg-slate-900"
                    }`}
                  >
                    <AppText
                      className={`text-xs font-semibold ${
                        sortBy === "recent"
                          ? "text-white"
                          : "text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      Recent
                    </AppText>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setSortBy("views");
                      setShowSort(false);
                    }}
                    className={`rounded-full px-4 py-2 ${
                      sortBy === "views"
                        ? "bg-green-600"
                        : "bg-slate-100 dark:bg-slate-900"
                    }`}
                  >
                    <AppText
                      className={`text-xs font-semibold ${
                        sortBy === "views"
                          ? "text-white"
                          : "text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      Most Viewed
                    </AppText>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setSortBy("likes");
                      setShowSort(false);
                    }}
                    className={`rounded-full px-4 py-2 ${
                      sortBy === "likes"
                        ? "bg-green-600"
                        : "bg-slate-100 dark:bg-slate-900"
                    }`}
                  >
                    <AppText
                      className={`text-xs font-semibold ${
                        sortBy === "likes"
                          ? "text-white"
                          : "text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      Most Liked
                    </AppText>
                  </Pressable>
                </View>
              ) : null}
            </>
          }
          renderItem={({ item: project }) => (
            <Pressable
              className="mt-6 rounded-3xl bg-white shadow-sm dark:bg-slate-900"
              accessibilityRole="button"
              onPress={() => router.push(`../projects/${project.id}`)}
            >
              {project.cover_url ? (
                <Image
                  source={{ uri: project.cover_url }}
                  className="h-44 w-full rounded-t-3xl"
                  resizeMode="cover"
                />
              ) : (
                <View className="h-44 rounded-t-3xl bg-emerald-50 dark:bg-emerald-900/30" />
              )}
              <View className="px-5 pb-5 pt-4">
                <View className="flex-row items-center justify-between">
                  <AppText className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    {project.title}
                  </AppText>
                  <AppText className="text-sm text-slate-400 dark:text-slate-500">
                    {formatTimeAgo(project.created_at)}
                  </AppText>
                </View>
                <AppText className="mt-2 text-sm leading-5 text-slate-500 dark:text-slate-400">
                  {project.summary ?? "No summary yet."}
                </AppText>
                <View className="mt-4 flex-row flex-wrap gap-2">
                  {(project.tags ?? []).slice(0, 3).map((tag) => (
                    <View
                      key={tag}
                      className="rounded-lg bg-green-100 px-3 py-1 dark:bg-green-500/20"
                    >
                      <AppText className="text-xs font-medium text-green-700 dark:text-green-200">
                        {tag}
                      </AppText>
                    </View>
                  ))}
                </View>
                <View className="mt-4 flex-row items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                  <View className="flex-row items-center">
                    <View className="h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-green-200 dark:bg-green-700">
                      <Image
                        source={{
                          uri: project.is_anonymous
                            ? "https://placehold.co/40x40/png"
                            : (project.profile?.avatar_url ?? fallbackAvatar),
                        }}
                        className="h-full w-full"
                        resizeMode="cover"
                      />
                    </View>
                    <AppText className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                      {project.is_anonymous
                        ? "Anonymous Student"
                        : project.profile?.full_name ||
                          project.profile?.username ||
                          "Student"}
                    </AppText>
                  </View>
                  <View className="flex-row items-center gap-4">
                    <View className="flex-row items-center">
                      <Ionicons
                        name="eye-outline"
                        size={18}
                        color={colors.mutedText}
                      />
                      <AppText className="ml-2 text-sm text-slate-400 dark:text-slate-500">
                        {project.views}
                      </AppText>
                    </View>
                    <Pressable
                      onPress={() => handleToggleLike(project.id)}
                      className="flex-row items-center"
                    >
                      <Ionicons
                        name={project.is_liked ? "heart" : "heart-outline"}
                        size={18}
                        color={
                          project.is_liked ? colors.danger : colors.mutedText
                        }
                      />
                      <AppText className="ml-2 text-sm text-slate-400 dark:text-slate-500">
                        {project.likes}
                      </AppText>
                    </Pressable>
                  </View>
                </View>
              </View>
            </Pressable>
          )}
          onEndReachedThreshold={0.35}
          onEndReached={() => {
            if (!isLoadingMore && hasMore) {
              void loadProjects();
            }
          }}
          ListFooterComponent={
            <>
              {isLoadingMore ? (
                <View className="mt-4">
                  <AppText className="text-center text-xs text-slate-400 dark:text-slate-500">
                    Loading more projects...
                  </AppText>
                </View>
              ) : null}
              {!hasMore && projects.length > 0 ? (
                <View className="mt-4">
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

      {/* FAB */}
      <Pressable
        onPress={() => router.push("/projects/create-projects")}
        className="absolute right-6 bottom-6 w-14 h-14 rounded-full items-center justify-center bg-green-600 dark:bg-green-400 shadow-lg"
      >
        <Ionicons name="add" size={26} color={colors.chipActiveText} />
      </Pressable>

      <FetchErrorModal
        visible={Boolean(errorMessage)}
        message={errorMessage}
        onClose={() => setErrorMessage(null)}
        onRetry={() => void loadProjects(true)}
      />
    </SafeAreaView>
  );
}
