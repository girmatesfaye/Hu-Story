import React, { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import Feather from "@expo/vector-icons/Feather";
import { AppText } from "../../../components/AppText";
import { FetchErrorModal } from "../../../components/FetchErrorModal";
import { SkeletonBlock } from "../../../components/SkeletonBlock";
import { useTheme } from "../../../hooks/useTheme";
import { supabase } from "../../../lib/supabase";
import { useSupabase } from "../../../providers/SupabaseProvider";

const categories = ["Cafe", "Library", "Hangout", "Study", "Food", "Other"];

type SpotRow = {
  id: string;
  user_id: string | null;
  name: string;
  category: string | null;
  location: string | null;
  description: string | null;
  price_type: string | null;
};

export default function EditSpotScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const scheme = useColorScheme();
  const { session } = useSupabase();
  const { colors } = useTheme();
  const iconColors = {
    text: scheme === "dark" ? "#E5E7EB" : "#0F172A",
    muted: scheme === "dark" ? "#94A3B8" : "#64748B",
    accent: scheme === "dark" ? "#4ADE80" : "#16A34A",
    chipText: scheme === "dark" ? "#0B0B0B" : "#FFFFFF",
  };

  const [feeType, setFeeType] = useState<"free" | "paid">("free");
  const [name, setName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadSpot = async () => {
      if (!id) return;

      setIsLoading(true);
      setFetchError(null);

      const { data, error } = await supabase
        .from("spots")
        .select(
          "id, user_id, name, category, location, description, price_type",
        )
        .eq("id", id)
        .maybeSingle();

      if (!isMounted) return;

      if (error) {
        setFetchError(error.message);
      } else if (!data) {
        setFetchError("Spot not found.");
      } else {
        const spot = data as SpotRow;
        if (session?.user?.id && spot.user_id !== session.user.id) {
          setFetchError("You do not have permission to edit this spot.");
        }
        setName(spot.name ?? "");
        setSelectedCategory(spot.category ?? categories[0]);
        setLocation(spot.location ?? "");
        setDescription(spot.description ?? "");
        setFeeType((spot.price_type ?? "free") === "paid" ? "paid" : "free");
      }

      setIsLoading(false);
    };

    loadSpot();

    return () => {
      isMounted = false;
    };
  }, [id, session?.user?.id, reloadKey]);

  const handleSave = async () => {
    if (!session?.user) {
      setErrorMessage("Please log in to update the spot.");
      return;
    }

    if (!id) {
      setErrorMessage("Missing spot id.");
      return;
    }

    if (!name.trim()) {
      setErrorMessage("Add a name for the spot.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    const { error } = await supabase
      .from("spots")
      .update({
        name: name.trim(),
        category: selectedCategory,
        location: location.trim() || null,
        description: description.trim() || null,
        price_type: feeType,
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
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <Pressable
            onPress={() => router.back()}
            className="flex-row items-center"
          >
            <Feather name="x" size={20} color={colors.mutedText} />
            <AppText className="ml-2 text-base text-slate-500 dark:text-slate-300">
              Cancel
            </AppText>
          </Pressable>

          <AppText className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Edit Spot
          </AppText>
          <View className="w-14" />
        </View>

        <ScrollView contentContainerClassName="px-5 pb-32 pt-5">
          {isLoading ? (
            <View className="gap-5">
              <SkeletonBlock className="h-4 w-28 rounded-md" />
              <SkeletonBlock className="h-12 w-full rounded-xl" />
              <SkeletonBlock className="h-4 w-20 rounded-md" />
              <View className="flex-row flex-wrap gap-2">
                {Array.from({ length: 5 }).map((_, index) => (
                  <SkeletonBlock
                    key={`spot-edit-category-${index}`}
                    className="h-8 w-20 rounded-full"
                  />
                ))}
              </View>
              <SkeletonBlock className="h-12 w-full rounded-xl" />
              <SkeletonBlock className="h-[110px] w-full rounded-xl" />
            </View>
          ) : (
            <>
              <AppText className="mt-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Name of the spot
              </AppText>
              <View className="mt-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <TextInput
                  placeholder="e.g. Library Cafe"
                  placeholderTextColor={colors.mutedStrong}
                  className="text-sm text-slate-900 dark:text-slate-100"
                  value={name}
                  onChangeText={setName}
                  editable={!isLoading}
                />
              </View>

              <AppText className="mt-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Category
              </AppText>
              <View className="mt-3 flex-row flex-wrap gap-2">
                {categories.map((option) => (
                  <Pressable
                    key={option}
                    onPress={() => setSelectedCategory(option)}
                    className={`rounded-full border px-3 py-1.5 ${
                      option === selectedCategory
                        ? "border-green-600 bg-green-600"
                        : "border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900"
                    }`}
                  >
                    <AppText
                      className={`text-xs font-semibold ${
                        option === selectedCategory
                          ? "text-white"
                          : "text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {option}
                    </AppText>
                  </Pressable>
                ))}
              </View>

              <AppText className="mt-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Where is it?
              </AppText>
              <View className="mt-2 flex-row items-center gap-3">
                <View className="flex-1 flex-row items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <Ionicons
                    name="location-outline"
                    size={16}
                    color={colors.mutedText}
                  />
                  <TextInput
                    placeholder="e.g. Main Campus"
                    placeholderTextColor={colors.mutedStrong}
                    className="flex-1 text-sm text-slate-900 dark:text-slate-100"
                    value={location}
                    onChangeText={setLocation}
                    editable={!isLoading}
                  />
                </View>
                <Pressable className="h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <Ionicons name="map" size={18} color={colors.accent} />
                </Pressable>
              </View>

              <AppText className="mt-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Fee
              </AppText>
              <View className="mt-2 flex-row rounded-xl bg-slate-100 p-1 dark:bg-slate-900">
                <Pressable
                  onPress={() => setFeeType("free")}
                  className={`flex-1 items-center justify-center rounded-lg py-2.5 ${
                    feeType === "free" ? "bg-green-600" : "bg-transparent"
                  }`}
                >
                  <AppText
                    className={`text-sm font-semibold ${
                      feeType === "free"
                        ? "text-white"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    Free
                  </AppText>
                </Pressable>
                <Pressable
                  onPress={() => setFeeType("paid")}
                  className={`flex-1 items-center justify-center rounded-lg py-2.5 ${
                    feeType === "paid"
                      ? "bg-white dark:bg-slate-950"
                      : "bg-transparent"
                  }`}
                >
                  <AppText
                    className={`text-sm font-semibold ${
                      feeType === "paid"
                        ? "text-slate-900 dark:text-slate-100"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    Paid
                  </AppText>
                </Pressable>
              </View>

              <View className="mt-6 flex-row items-center gap-2">
                <AppText className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Spot Description
                </AppText>
                <AppText className="text-xs text-slate-400 dark:text-slate-500">
                  (optional)
                </AppText>
              </View>
              <View className="mt-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <TextInput
                  placeholder="Tell students what makes this place special..."
                  placeholderTextColor={colors.mutedStrong}
                  className="min-h-[110px] text-sm text-slate-900 dark:text-slate-100"
                  multiline
                  textAlignVertical="top"
                  value={description}
                  onChangeText={setDescription}
                  editable
                />
              </View>
            </>
          )}

          {errorMessage ? (
            <AppText className="mt-4 text-sm text-red-500">
              {errorMessage}
            </AppText>
          ) : null}
        </ScrollView>

        <View className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-950">
          <Pressable
            onPress={handleSave}
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

        <FetchErrorModal
          visible={Boolean(fetchError)}
          message={fetchError}
          onClose={() => setFetchError(null)}
          onRetry={() => setReloadKey((prev) => prev + 1)}
        />
      </View>
    </SafeAreaView>
  );
}
