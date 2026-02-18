import React, { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AppText } from "../../components/AppText";
import { useTheme } from "../../hooks/useTheme";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";

type ProjectDetail = {
  id: string;
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
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadProject = async () => {
      if (!id) return;

      setIsLoading(true);
      setErrorMessage(null);

      const { data, error } = await supabase
        .from("projects")
        .select(
          "id, title, summary, details, tags, views, likes, cover_url, repo_url, created_at",
        )
        .eq("id", id)
        .maybeSingle();

      if (!isMounted) return;

      if (error) {
        setErrorMessage(error.message);
        setProject(null);
      } else {
        setProject((data as ProjectDetail) ?? null);
      }

      setIsLoading(false);
    };

    loadProject();

    return () => {
      isMounted = false;
    };
  }, [id]);

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
              <View className="h-10 w-10 items-center justify-center rounded-full bg-amber-200 dark:bg-amber-700">
                <AppText className="text-xs font-semibold text-amber-900 dark:text-amber-50">
                  ST
                </AppText>
              </View>
              <View className="ml-3">
                <AppText className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Student
                </AppText>
                <AppText className="text-xs text-slate-500 dark:text-slate-400">
                  {project?.created_at ? formatTimeAgo(project.created_at) : ""}
                </AppText>
              </View>
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
