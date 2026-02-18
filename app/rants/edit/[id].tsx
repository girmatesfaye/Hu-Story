import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import Feather from "@expo/vector-icons/Feather";
import { AppText } from "../../../components/AppText";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../../lib/supabase";
import { useSupabase } from "../../../providers/SupabaseProvider";

const categories = ["Campus Life", "Cafeteria", "Academics", "Dorms", "Spots"];

type RantRow = {
  id: string;
  user_id: string | null;
  category: string | null;
  content: string;
};

export default function EditRantScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { session } = useSupabase();
  const [activeCategory, setActiveCategory] = useState(categories[0]);
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadRant = async () => {
      if (!id) return;

      setIsLoading(true);
      setErrorMessage(null);

      const { data, error } = await supabase
        .from("rants")
        .select("id, user_id, category, content")
        .eq("id", id)
        .maybeSingle();

      if (!isMounted) return;

      if (error) {
        setErrorMessage(error.message);
      } else if (!data) {
        setErrorMessage("Rant not found.");
      } else {
        const rant = data as RantRow;
        if (session?.user?.id && rant.user_id !== session.user.id) {
          setErrorMessage("You do not have permission to edit this rant.");
        }
        setActiveCategory(rant.category ?? categories[0]);
        setText(rant.content ?? "");
      }

      setIsLoading(false);
    };

    loadRant();

    return () => {
      isMounted = false;
    };
  }, [id, session?.user?.id]);

  const handleSave = async () => {
    if (!session?.user) {
      setErrorMessage("Please log in to edit your rant.");
      return;
    }

    if (!id) {
      setErrorMessage("Missing rant id.");
      return;
    }

    if (!text.trim()) {
      setErrorMessage("Write something before saving.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    const { error } = await supabase
      .from("rants")
      .update({
        category: activeCategory,
        content: text.trim(),
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
      <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
        <Pressable
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 items-center justify-center"
        >
          <Feather name="arrow-left" size={24} color="black" />
        </Pressable>

        <AppText className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Edit Rant
        </AppText>
        <View className="w-14" />
      </View>

      <ScrollView contentContainerClassName="px-5 pt-4 pb-6">
        <AppText className="text-xs tracking-widest text-slate-400 dark:text-slate-500">
          SELECT A CATEGORY
        </AppText>

        <View className="flex-row flex-wrap gap-3 mt-3">
          {categories.map((category) => {
            const active = category === activeCategory;
            return (
              <Pressable
                key={category}
                onPress={() => setActiveCategory(category)}
                className={`px-4 py-2.5 rounded-full border ${
                  active
                    ? "bg-green-600 border-green-600 dark:bg-green-400 dark:border-green-400"
                    : "bg-slate-100 border-slate-200 dark:bg-slate-900 dark:border-slate-800"
                }`}
              >
                <AppText
                  className={`text-sm font-semibold ${
                    active
                      ? "text-white dark:text-slate-950"
                      : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {category}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        <View className="mt-6">
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={isLoading ? "Loading..." : "Update your rant..."}
            placeholderTextColor="#CBD5F5"
            multiline
            editable={!isLoading}
            className="min-h-[240px] text-base leading-6 text-slate-900 dark:text-slate-100"
          />
          <View className="mt-2 h-[1px] bg-slate-200 dark:bg-slate-800" />
          <View className="flex-row items-center justify-end mt-2">
            <AppText className="text-sm text-slate-400 dark:text-slate-500">
              {text.length}/280
            </AppText>
          </View>
        </View>

        {errorMessage ? (
          <AppText className="mt-4 text-sm text-red-500">
            {errorMessage}
          </AppText>
        ) : null}
      </ScrollView>

      <View className="px-5 pb-6">
        <Pressable
          className={`bg-green-600 dark:bg-green-400 rounded-2xl py-4 items-center justify-center shadow-lg ${
            isSaving ? "opacity-60" : ""
          }`}
          onPress={handleSave}
          disabled={isSaving}
        >
          <View className="flex-row items-center gap-2">
            <AppText className="text-base font-semibold text-white dark:text-slate-950">
              {isSaving ? "Saving..." : "Save Changes"}
            </AppText>
            <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
          </View>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
