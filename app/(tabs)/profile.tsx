import { Image, Modal, ScrollView, TouchableOpacity, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "../../components/AppText";
import { useTheme } from "../../hooks/useTheme";
import { router } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useSupabase } from "../../providers/SupabaseProvider";
import { useFocusEffect } from "@react-navigation/native";

type Profile = {
  full_name: string | null;
  username: string | null;
  campus: string | null;
  avatar_url: string | null;
  bio: string | null;
};

type ProfileStats = {
  spots: number;
  rants: number;
  projects: number;
};

type SpotItem = {
  id: string;
  name: string;
  location: string | null;
  cover_url: string | null;
  price_type: string | null;
  rating_avg: number;
  review_count: number;
};

type RantItem = {
  id: string;
  content: string;
  created_at: string;
  category: string | null;
  views: number;
  comment_count: number;
};

type ProjectItem = {
  id: string;
  title: string;
  summary: string | null;
  created_at: string;
  views: number;
  likes: number;
  cover_url: string | null;
};

type DeleteTarget = {
  type: "spots" | "rants" | "projects";
  id: string;
  title: string;
};

const fallbackAvatar =
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80";
const fallbackSpotImage =
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80";
const fallbackProjectImage =
  "https://images.unsplash.com/photo-1483721310020-03333e577078?auto=format&fit=crop&w=400&q=80";

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

export default function ProfileTabScreen() {
  const { colors, statusBarStyle } = useTheme();
  const { session } = useSupabase();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<ProfileStats>({
    spots: 0,
    rants: 0,
    projects: 0,
  });
  const [activeSection, setActiveSection] = useState<
    "spots" | "rants" | "projects"
  >("spots");
  const [spots, setSpots] = useState<SpotItem[]>([]);
  const [rants, setRants] = useState<RantItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!session?.user) {
      setProfile(null);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, username, campus, avatar_url, bio")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (error) {
      setProfile(null);
      return;
    }

    if (!data) {
      const fallbackCampus =
        session.user.user_metadata?.campus ?? "Hawassa University";
      await supabase
        .from("profiles")
        .insert({ user_id: session.user.id, campus: fallbackCampus });
      const { data: freshProfile } = await supabase
        .from("profiles")
        .select("full_name, username, campus, avatar_url, bio")
        .eq("user_id", session.user.id)
        .maybeSingle();
      setProfile(freshProfile ?? null);
      return;
    }

    setProfile(data);
  }, [session?.user]);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
      return undefined;
    }, [loadProfile]),
  );

  useEffect(() => {
    let isMounted = true;

    const loadStats = async () => {
      if (!session?.user) {
        if (isMounted) {
          setStats({ spots: 0, rants: 0, projects: 0 });
        }
        return;
      }

      setIsLoadingStats(true);

      const [spotsResult, rantsResult, projectsResult] = await Promise.all([
        supabase
          .from("spots")
          .select("id", { count: "exact", head: true })
          .eq("user_id", session.user.id),
        supabase
          .from("rants")
          .select("id", { count: "exact", head: true })
          .eq("user_id", session.user.id),
        supabase
          .from("projects")
          .select("id", { count: "exact", head: true })
          .eq("user_id", session.user.id),
      ]);

      if (!isMounted) return;

      setStats({
        spots: spotsResult.count ?? 0,
        rants: rantsResult.count ?? 0,
        projects: projectsResult.count ?? 0,
      });
      setIsLoadingStats(false);
    };

    loadStats();

    return () => {
      isMounted = false;
    };
  }, [session?.user]);

  useEffect(() => {
    let isMounted = true;

    const loadSection = async () => {
      if (!session?.user) return;

      setIsLoadingList(true);
      setListError(null);

      if (activeSection === "spots") {
        const { data, error } = await supabase
          .from("spots")
          .select(
            "id, name, location, cover_url, price_type, rating_avg, review_count",
          )
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false });

        if (!isMounted) return;
        if (error) {
          setListError(error.message);
          setSpots([]);
        } else {
          setSpots((data ?? []) as SpotItem[]);
        }
      }

      if (activeSection === "rants") {
        const { data, error } = await supabase
          .from("rants")
          .select("id, content, created_at, category, views, comment_count")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false });

        if (!isMounted) return;
        if (error) {
          setListError(error.message);
          setRants([]);
        } else {
          setRants((data ?? []) as RantItem[]);
        }
      }

      if (activeSection === "projects") {
        const { data, error } = await supabase
          .from("projects")
          .select("id, title, summary, created_at, views, likes, cover_url")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false });

        if (!isMounted) return;
        if (error) {
          setListError(error.message);
          setProjects([]);
        } else {
          setProjects((data ?? []) as ProjectItem[]);
        }
      }

      setIsLoadingList(false);
    };

    loadSection();

    return () => {
      isMounted = false;
    };
  }, [session?.user, activeSection]);

  const handleDelete = async () => {
    if (!deleteTarget || !session?.user) return;

    setIsDeleting(true);

    const { error } = await supabase
      .from(deleteTarget.type)
      .delete()
      .eq("id", deleteTarget.id)
      .eq("user_id", session.user.id);

    if (error) {
      setListError(error.message);
      setIsDeleting(false);
      return;
    }

    if (deleteTarget.type === "spots") {
      setSpots((prev) => prev.filter((item) => item.id !== deleteTarget.id));
    }
    if (deleteTarget.type === "rants") {
      setRants((prev) => prev.filter((item) => item.id !== deleteTarget.id));
    }
    if (deleteTarget.type === "projects") {
      setProjects((prev) => prev.filter((item) => item.id !== deleteTarget.id));
    }

    setStats((prev) => ({
      ...prev,
      [deleteTarget.type]: Math.max(prev[deleteTarget.type] - 1, 0),
    }));

    setIsDeleting(false);
    setDeleteTarget(null);
  };

  const displayName =
    profile?.full_name?.trim() ||
    session?.user?.email?.split("@")[0] ||
    "Student";
  const displayCampus = profile?.campus ?? "Hawassa University";
  const avatarUrl = profile?.avatar_url ?? fallbackAvatar;

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <StatusBar style={statusBarStyle} />
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-28"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between pt-6">
          <TouchableOpacity
            className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900"
            accessibilityRole="button"
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color={statusBarStyle === "light" ? "#E5E7EB" : "#0F172A"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900"
            accessibilityRole="button"
          >
            <Ionicons
              name="settings-outline"
              size={20}
              color={statusBarStyle === "light" ? "#E5E7EB" : "#0F172A"}
            />
          </TouchableOpacity>
        </View>

        <View className="items-center pt-6">
          <View className="relative">
            <View className="h-28 w-28 items-center justify-center rounded-full border-4 border-white bg-slate-200 shadow-sm dark:border-slate-950 dark:bg-slate-800">
              <Image
                source={{ uri: avatarUrl }}
                className="h-full w-full rounded-full"
                resizeMode="cover"
              />
            </View>
            <TouchableOpacity
              className="absolute bottom-0 right-0 h-10 w-10 items-center justify-center rounded-full bg-emerald-600 shadow-md"
              accessibilityRole="button"
              onPress={() => router.push("/profiles/edit-profile")}
            >
              <Ionicons name="pencil" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <AppText className="mt-4 text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {displayName}
          </AppText>
          {profile?.username ? (
            <AppText className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              @{profile.username}
            </AppText>
          ) : null}
          <View className="mt-2 flex-row items-center">
            <Ionicons name="school" size={14} color={colors.accent} />
            <AppText className="ml-2 text-sm text-slate-500 dark:text-slate-400">
              {displayCampus}
            </AppText>
          </View>
          {profile?.bio ? (
            <AppText className="mt-3 text-sm text-slate-600 text-center dark:text-slate-300">
              {profile.bio}
            </AppText>
          ) : null}
        </View>

        <View className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-800">
          <View className="flex-row items-center justify-around">
            <View className="items-center">
              <AppText className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {isLoadingStats ? "-" : stats.spots}
              </AppText>
              <AppText className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                SPOTS
              </AppText>
            </View>
            <View className="items-center">
              <AppText className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {isLoadingStats ? "-" : stats.rants}
              </AppText>
              <AppText className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                RANTS
              </AppText>
            </View>
            <View className="items-center">
              <AppText className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {isLoadingStats ? "-" : stats.projects}
              </AppText>
              <AppText className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                PROJECTS
              </AppText>
            </View>
          </View>
        </View>

        <View className="mt-8 border-b border-slate-200 pb-3 dark:border-slate-800">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              className={`flex-1 items-center pb-3 ${
                activeSection === "spots" ? "border-b-2 border-emerald-600" : ""
              }`}
              onPress={() => setActiveSection("spots")}
            >
              <AppText
                className={`text-sm font-semibold ${
                  activeSection === "spots"
                    ? "text-emerald-600"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                My Spots
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 items-center pb-3 ${
                activeSection === "rants" ? "border-b-2 border-emerald-600" : ""
              }`}
              onPress={() => setActiveSection("rants")}
            >
              <AppText
                className={`text-sm font-semibold ${
                  activeSection === "rants"
                    ? "text-emerald-600"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                My Rants
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 items-center pb-3 ${
                activeSection === "projects"
                  ? "border-b-2 border-emerald-600"
                  : ""
              }`}
              onPress={() => setActiveSection("projects")}
            >
              <AppText
                className={`text-sm font-semibold ${
                  activeSection === "projects"
                    ? "text-emerald-600"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                My Projects
              </AppText>
            </TouchableOpacity>
          </View>
        </View>

        <View className="mt-6 gap-4">
          {isLoadingList ? (
            <AppText className="text-sm text-slate-400 dark:text-slate-500">
              Loading your content...
            </AppText>
          ) : null}
          {listError ? (
            <AppText className="text-sm text-red-500">{listError}</AppText>
          ) : null}

          {activeSection === "spots"
            ? spots.map((spot) => (
                <View
                  key={spot.id}
                  className="flex-row items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <Image
                    source={{ uri: spot.cover_url ?? fallbackSpotImage }}
                    className="h-16 w-16 rounded-xl"
                    resizeMode="cover"
                  />
                  <View className="flex-1">
                    <View className="flex-row items-start justify-between">
                      <AppText className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {spot.name}
                      </AppText>
                      <View className="flex-row items-center gap-4">
                        <TouchableOpacity
                          accessibilityRole="button"
                          onPress={() =>
                            setDeleteTarget({
                              type: "spots",
                              id: spot.id,
                              title: spot.name,
                            })
                          }
                        >
                          <MaterialIcons
                            name="delete-forever"
                            size={24}
                            color={colors.mutedText}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          accessibilityRole="button"
                          onPress={() => router.push(`/spots/edit/${spot.id}`)}
                        >
                          <MaterialIcons
                            name="edit"
                            size={24}
                            color={colors.mutedText}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View className="mt-2 flex-row items-center">
                      <Ionicons
                        name="location"
                        size={14}
                        color={colors.accent}
                      />
                      <AppText className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                        {spot.location ?? "Location TBD"}
                      </AppText>
                    </View>
                    <View className="mt-2 flex-row items-center gap-4">
                      <View className="flex-row items-center gap-1">
                        <Ionicons
                          name="star"
                          size={14}
                          color={colors.mutedText}
                        />
                        <AppText className="text-xs text-slate-500 dark:text-slate-400">
                          {spot.rating_avg.toFixed(1)}
                        </AppText>
                      </View>
                      <View className="flex-row items-center gap-1">
                        <Ionicons
                          name="chatbubble-ellipses"
                          size={14}
                          color={colors.mutedText}
                        />
                        <AppText className="text-xs text-slate-500 dark:text-slate-400">
                          {spot.review_count}
                        </AppText>
                      </View>
                    </View>
                  </View>
                </View>
              ))
            : null}

          {activeSection === "rants"
            ? rants.map((rant) => (
                <View
                  key={rant.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 pr-4">
                      <AppText className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {rant.category ?? "General"}
                      </AppText>
                      <AppText className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                        {rant.content}
                      </AppText>
                      <AppText className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                        {formatTimeAgo(rant.created_at)}
                      </AppText>
                    </View>
                    <View className="flex-row items-center gap-4">
                      <TouchableOpacity
                        accessibilityRole="button"
                        onPress={() =>
                          setDeleteTarget({
                            type: "rants",
                            id: rant.id,
                            title: "Rant",
                          })
                        }
                      >
                        <MaterialIcons
                          name="delete-forever"
                          size={24}
                          color={colors.mutedText}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        accessibilityRole="button"
                        onPress={() => router.push(`/rants/edit/${rant.id}`)}
                      >
                        <MaterialIcons
                          name="edit"
                          size={24}
                          color={colors.mutedText}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View className="mt-3 flex-row items-center gap-4">
                    <View className="flex-row items-center gap-1">
                      <Ionicons
                        name="eye-outline"
                        size={14}
                        color={colors.mutedText}
                      />
                      <AppText className="text-xs text-slate-500 dark:text-slate-400">
                        {rant.views}
                      </AppText>
                    </View>
                    <View className="flex-row items-center gap-1">
                      <Ionicons
                        name="chatbox-outline"
                        size={14}
                        color={colors.mutedText}
                      />
                      <AppText className="text-xs text-slate-500 dark:text-slate-400">
                        {rant.comment_count}
                      </AppText>
                    </View>
                  </View>
                </View>
              ))
            : null}

          {activeSection === "projects"
            ? projects.map((project) => (
                <View
                  key={project.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <View className="flex-row items-start gap-4">
                    <Image
                      source={{
                        uri: project.cover_url ?? fallbackProjectImage,
                      }}
                      className="h-16 w-16 rounded-xl"
                      resizeMode="cover"
                    />
                    <View className="flex-1">
                      <View className="flex-row items-start justify-between">
                        <View className="flex-1 pr-4">
                          <AppText className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {project.title}
                          </AppText>
                          <AppText className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                            {project.summary ?? "No summary yet."}
                          </AppText>
                        </View>
                        <View className="flex-row items-center gap-4">
                          <TouchableOpacity
                            accessibilityRole="button"
                            onPress={() =>
                              setDeleteTarget({
                                type: "projects",
                                id: project.id,
                                title: project.title,
                              })
                            }
                          >
                            <MaterialIcons
                              name="delete-forever"
                              size={24}
                              color={colors.mutedText}
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            accessibilityRole="button"
                            onPress={() =>
                              router.push(`/projects/edit/${project.id}`)
                            }
                          >
                            <MaterialIcons
                              name="edit"
                              size={24}
                              color={colors.mutedText}
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                      <View className="mt-2 flex-row items-center gap-4">
                        <AppText className="text-xs text-slate-400 dark:text-slate-500">
                          {formatTimeAgo(project.created_at)}
                        </AppText>
                        <View className="flex-row items-center gap-1">
                          <Ionicons
                            name="eye-outline"
                            size={14}
                            color={colors.mutedText}
                          />
                          <AppText className="text-xs text-slate-500 dark:text-slate-400">
                            {project.views}
                          </AppText>
                        </View>
                        <View className="flex-row items-center gap-1">
                          <Ionicons
                            name="heart-outline"
                            size={14}
                            color={colors.mutedText}
                          />
                          <AppText className="text-xs text-slate-500 dark:text-slate-400">
                            {project.likes}
                          </AppText>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              ))
            : null}

          {!isLoadingList &&
          listError === null &&
          ((activeSection === "spots" && spots.length === 0) ||
            (activeSection === "rants" && rants.length === 0) ||
            (activeSection === "projects" && projects.length === 0)) ? (
            <AppText className="text-sm text-slate-400 dark:text-slate-500">
              No items yet.
            </AppText>
          ) : null}
        </View>
      </ScrollView>

      <Modal visible={Boolean(deleteTarget)} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/50 px-6">
          <View className="w-full rounded-2xl bg-white p-5 shadow-lg dark:bg-slate-900">
            <AppText className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Delete item?
            </AppText>
            <AppText className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {deleteTarget
                ? `Delete "${deleteTarget.title}"? This cannot be undone.`
                : ""}
            </AppText>
            <View className="mt-5 flex-row items-center gap-3">
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => setDeleteTarget(null)}
                className="flex-1 items-center justify-center rounded-xl border border-slate-200 py-3 dark:border-slate-800"
              >
                <AppText className="text-sm font-semibold text-slate-600 dark:text-slate-200">
                  Cancel
                </AppText>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={handleDelete}
                disabled={isDeleting}
                className={`flex-1 items-center justify-center rounded-xl bg-red-600 py-3 ${
                  isDeleting ? "opacity-60" : ""
                }`}
              >
                <AppText className="text-sm font-semibold text-white">
                  {isDeleting ? "Deleting..." : "Delete"}
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
