import {
  ScrollView,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { AppText } from "../../components/AppText";
import { useTheme } from "../../hooks/useTheme";
import { SafeAreaView } from "react-native-safe-area-context";
import { Pressable } from "react-native";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useSupabase } from "../../providers/SupabaseProvider";
export default function CreateProjectsScreen() {
  const router = useRouter();
  const { colors, statusBarStyle } = useTheme();
  const { session } = useSupabase();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!session?.user) {
      setErrorMessage("Please log in to publish a project.");
      return;
    }

    if (!title.trim()) {
      setErrorMessage("Add a project title.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const tags = tagsText
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const { error } = await supabase.from("projects").insert({
      user_id: session.user.id,
      is_anonymous: isAnonymous,
      title: title.trim(),
      summary: summary.trim() || null,
      details: null,
      tags: tags.length > 0 ? tags : null,
      repo_url: repoUrl.trim() || null,
    });

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.replace("/(tabs)/projects");
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
            Submit Project
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
                  Share your work
                </AppText>
                <AppText className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Showcase what you have built to fellow students. Great
                  projects get featured in the weekly Hawassa digest.
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
              />
            </View>
          </View>

          <View className="mt-6 flex-row items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <View className="flex-row items-center">
              <Ionicons
                name={isAnonymous ? "lock-closed" : "person-circle"}
                size={18}
                color={isAnonymous ? "#16A34A" : colors.mutedText}
              />
              <View className="ml-2">
                <AppText className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Publish anonymously
                </AppText>
                <AppText className="text-xs text-slate-500 dark:text-slate-400">
                  {isAnonymous
                    ? "Your name and photo are hidden."
                    : "Your name and photo will be shown."}
                </AppText>
              </View>
            </View>
            <Switch
              value={isAnonymous}
              onValueChange={setIsAnonymous}
              trackColor={{ false: "#CBD5F5", true: "#16A34A" }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View className="mt-6">
            <AppText className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Cover Image (Optional)
            </AppText>
            <TouchableOpacity
              className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 dark:border-slate-700 dark:bg-slate-900"
              accessibilityRole="button"
            >
              <View className="items-center">
                <View className="h-12 w-12 items-center justify-center rounded-2xl bg-slate-200 dark:bg-slate-800">
                  <Ionicons
                    name="image-outline"
                    size={20}
                    color={colors.mutedText}
                  />
                </View>
                <AppText className="mt-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Upload cover image
                </AppText>
              </View>
            </TouchableOpacity>
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
              isSubmitting ? "opacity-60" : ""
            }`}
            disabled={isSubmitting}
          >
            <AppText className="text-sm font-semibold text-white">
              {isSubmitting ? "Publishing..." : "Publish Project"}
            </AppText>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
