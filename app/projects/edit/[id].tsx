import { ScrollView, TextInput, TouchableOpacity, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AppText } from "../../../components/AppText";
import { useTheme } from "../../../hooks/useTheme";
import { SafeAreaView } from "react-native-safe-area-context";
import { Pressable } from "react-native";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useSupabase } from "../../../providers/SupabaseProvider";

type ProjectRow = {
  id: string;
  user_id: string | null;
  title: string;
  summary: string | null;
  tags: string[] | null;
  repo_url: string | null;
};

export default function EditProjectsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { colors, statusBarStyle } = useTheme();
  const { session } = useSupabase();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadProject = async () => {
      if (!id) return;

      setIsLoading(true);
      setErrorMessage(null);

      const { data, error } = await supabase
        .from("projects")
        .select("id, user_id, title, summary, tags, repo_url")
        .eq("id", id)
        .maybeSingle();

      if (!isMounted) return;

      if (error) {
        setErrorMessage(error.message);
      } else if (!data) {
        setErrorMessage("Project not found.");
      } else {
        const project = data as ProjectRow;
        if (session?.user?.id && project.user_id !== session.user.id) {
          setErrorMessage("You do not have permission to edit this project.");
        }
        setTitle(project.title ?? "");
        setSummary(project.summary ?? "");
        setTagsText((project.tags ?? []).join(", "));
        setRepoUrl(project.repo_url ?? "");
      }

      setIsLoading(false);
    };

    loadProject();

    return () => {
      isMounted = false;
    };
  }, [id, session?.user?.id]);

  const handleSubmit = async () => {
    if (!session?.user) {
      setErrorMessage("Please log in to update the project.");
      return;
    }

    if (!id) {
      setErrorMessage("Missing project id.");
      return;
    }

    if (!title.trim()) {
      setErrorMessage("Add a project title.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    const tags = tagsText
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const { error } = await supabase
      .from("projects")
      .update({
        title: title.trim(),
        summary: summary.trim() || null,
        tags: tags.length > 0 ? tags : null,
        repo_url: repoUrl.trim() || null,
      })
      .eq("id", id)
      .eq("user_id", session.user.id);

    setIsSaving(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">
      <View className="flex-1 bg-white dark:bg-slate-950">
        <StatusBar style={statusBarStyle} />
        <View className="flex-row items-center justify-between px-5 pb-3 pt-6">
          <TouchableOpacity
            className="h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20"
            accessibilityRole="button"
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color={colors.accent} />
          </TouchableOpacity>
          <AppText className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Edit Project
          </AppText>
          <View className="h-10 w-10" />
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pb-28"
          showsVerticalScrollIndicator={false}
        >
          <View className="mt-2 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-500/30 dark:bg-emerald-900/30">
            <View className="flex-row items-start gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-500/20">
                <Ionicons name="bulb" size={18} color={colors.accent} />
              </View>
              <View className="flex-1">
                <AppText className="text-base font-semibold text-emerald-700 dark:text-emerald-200">
                  Update your project
                </AppText>
                <AppText className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Keep your project details fresh so peers can discover it.
                </AppText>
              </View>
            </View>
          </View>

          <View className="mt-8">
            <AppText className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Project Title
            </AppText>
            <View className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
              <TextInput
                placeholder="e.g., Campus Bus Tracker"
                placeholderTextColor={colors.mutedStrong}
                className="text-sm text-slate-900 dark:text-slate-100"
                value={title}
                onChangeText={setTitle}
                editable={!isLoading}
              />
            </View>
          </View>

          <View className="mt-6">
            <AppText className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              What's it about?
            </AppText>
            <View className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
              <TextInput
                placeholder="Describe the problem you solved and how it helps students..."
                placeholderTextColor={colors.mutedStrong}
                className="min-h-[120px] text-sm text-slate-900 dark:text-slate-100"
                multiline
                textAlignVertical="top"
                maxLength={300}
                value={summary}
                onChangeText={setSummary}
                editable={!isLoading}
              />
            </View>
            <View className="mt-2 items-end">
              <AppText className="text-xs text-slate-400 dark:text-slate-500">
                {summary.length}/300
              </AppText>
            </View>
          </View>

          <View className="mt-6">
            <AppText className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Tech Stack / Skills
            </AppText>
            <View className="mt-3 flex-row flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3 dark:border-slate-800 dark:bg-slate-900">
              <View className="flex-1">
                <TextInput
                  placeholder="Add tags..."
                  placeholderTextColor={colors.mutedStrong}
                  className="text-sm text-slate-900 dark:text-slate-100"
                  value={tagsText}
                  onChangeText={setTagsText}
                  editable={!isLoading}
                />
              </View>
            </View>
            <AppText className="mt-2 text-xs text-slate-400 dark:text-slate-500">
              Press enter or comma to add a tag.
            </AppText>
          </View>

          <View className="mt-6">
            <AppText className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Link (GitHub, Demo, etc.)
            </AppText>
            <View className="mt-3 flex-row items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
              <Ionicons name="link" size={18} color={colors.mutedText} />
              <TextInput
                placeholder="https://"
                placeholderTextColor={colors.mutedStrong}
                className="flex-1 text-sm text-slate-900 dark:text-slate-100"
                value={repoUrl}
                onChangeText={setRepoUrl}
                editable={!isLoading}
              />
            </View>
          </View>

          {errorMessage ? (
            <AppText className="mt-4 text-sm text-red-500">
              {errorMessage}
            </AppText>
          ) : null}
        </ScrollView>

        <View className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-950">
          <Pressable
            onPress={handleSubmit}
            className={`flex-row items-center justify-center gap-2 rounded-xl bg-green-600 py-3 ${
              isSaving ? "opacity-60" : ""
            }`}
            disabled={isSaving}
          >
            <AppText className="text-sm font-semibold text-white">
              {isSaving ? "Saving..." : "Save Changes"}
            </AppText>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
