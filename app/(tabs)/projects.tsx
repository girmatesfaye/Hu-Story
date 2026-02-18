import { Image, ScrollView, TouchableOpacity, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { AppText } from "../../components/AppText";
import { useTheme } from "../../hooks/useTheme";
import { Pressable } from "react-native";
import { useColorScheme } from "react-native";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type ProjectItem = {
  id: string;
  title: string;
  summary: string | null;
  tags: string[] | null;
  created_at: string;
  views: number;
  likes: number;
  cover_url: string | null;
};

const fallbackCover =
  "https://images.unsplash.com/photo-1483721310020-03333e577078?auto=format&fit=crop&w=1200&q=80";

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

export default function ProjectsTabScreen() {
  const { statusBarStyle } = useTheme();
  const router = useRouter();
  const scheme = useColorScheme();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const iconColors = {
    text: scheme === "dark" ? "#E5E7EB" : "#0F172A",
    muted: scheme === "dark" ? "#94A3B8" : "#64748B",
    accent: scheme === "dark" ? "#4ADE80" : "#16A34A",
    chipText: scheme === "dark" ? "#0B0B0B" : "#FFFFFF",
  };

  useEffect(() => {
    let isMounted = true;

    const loadProjects = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      const { data, error } = await supabase
        .from("projects")
        .select("id, title, summary, tags, created_at, views, likes, cover_url")
        .order("created_at", { ascending: false });

      if (!isMounted) return;

      if (error) {
        setErrorMessage(error.message);
        setProjects([]);
      } else {
        setProjects((data ?? []) as ProjectItem[]);
      }

      setIsLoading(false);
    };

    loadProjects();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <StatusBar style={statusBarStyle} />
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pt-6 pb-28"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-4">
            <AppText className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              Campus Projects
            </AppText>
            <AppText className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Discover what peers are building
            </AppText>
          </View>
          <TouchableOpacity
            className="h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-slate-900"
            accessibilityRole="button"
          >
            <Ionicons
              name="options-outline"
              size={20}
              color={statusBarStyle === "light" ? "#E5E7EB" : "#0F172A"}
            />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <AppText className="mt-6 text-sm text-slate-400 dark:text-slate-500">
            Loading projects...
          </AppText>
        ) : null}
        {errorMessage ? (
          <AppText className="mt-6 text-sm text-red-500">
            {errorMessage}
          </AppText>
        ) : null}
        {projects.map((project) => (
          <Pressable
            key={project.id}
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
                    className="rounded-lg bg-emerald-100 px-3 py-1 dark:bg-emerald-500/20"
                  >
                    <AppText className="text-xs font-medium text-emerald-700 dark:text-emerald-200">
                      {tag}
                    </AppText>
                  </View>
                ))}
              </View>
              <View className="mt-4 flex-row items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                <View className="flex-row items-center">
                  <View className="h-9 w-9 items-center justify-center rounded-full bg-emerald-200 dark:bg-emerald-700">
                    <AppText className="text-xs font-semibold text-emerald-900 dark:text-emerald-50">
                      ST
                    </AppText>
                  </View>
                  <AppText className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                    Student
                  </AppText>
                </View>
                <View className="flex-row items-center gap-4">
                  <View className="flex-row items-center">
                    <Ionicons
                      name="eye-outline"
                      size={18}
                      color={statusBarStyle === "light" ? "#94A3B8" : "#64748B"}
                    />
                    <AppText className="ml-2 text-sm text-slate-400 dark:text-slate-500">
                      {project.views}
                    </AppText>
                  </View>
                  <View className="flex-row items-center">
                    <Ionicons
                      name="heart-outline"
                      size={18}
                      color={statusBarStyle === "light" ? "#94A3B8" : "#64748B"}
                    />
                    <AppText className="ml-2 text-sm text-slate-400 dark:text-slate-500">
                      {project.likes}
                    </AppText>
                  </View>
                </View>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={() => router.push("/projects/create-projects")}
        className="absolute right-5 bottom-5 w-14 h-14 rounded-full items-center justify-center bg-green-600 dark:bg-green-400 shadow-lg"
      >
        <Ionicons name="add" size={26} color={iconColors.chipText} />
      </Pressable>
    </View>
  );
}
