import React, { useState } from "react";
import { Pressable, ScrollView, Switch, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { AppText } from "../../components/AppText";
import Feather from "@expo/vector-icons/Feather";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import { useSupabase } from "../../providers/SupabaseProvider";
const categories = ["Campus Life", "Cafeteria", "Academics", "Dorms", "Spots"];

export default function CreateRantScreen() {
  const router = useRouter();
  const { session } = useSupabase();
  const [activeCategory, setActiveCategory] = useState(categories[0]);
  const [text, setText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!session?.user) {
      setErrorMessage("Please log in to post a rant.");
      return;
    }

    if (!text.trim()) {
      setErrorMessage("Write something before posting.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const { error } = await supabase.from("rants").insert({
      user_id: session.user.id,
      category: activeCategory,
      content: text.trim(),
      is_anonymous: isAnonymous,
    });

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.replace("/(tabs)/rants");
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
          Rew Rants
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
            placeholder="Spill the tea... (respectfully). What's happening on campus today?"
            placeholderTextColor="#979eb4"
            multiline
            className=" text-base leading-6 text-slate-900 dark:text-slate-100"
          />
          <View className="mt-2 h-[1px] bg-slate-200 dark:bg-slate-800" />
          <View className="flex-row items-center justify-end mt-2">
            <AppText className="text-sm text-slate-400 dark:text-slate-500">
              {text.length}/280
            </AppText>
          </View>
        </View>

        <View className="mt-6 flex-row items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <View className="flex-row items-center">
            <Ionicons
              name={isAnonymous ? "lock-closed" : "person-circle"}
              size={18}
              color={isAnonymous ? "#16A34A" : "#64748B"}
            />
            <View className="ml-2">
              <AppText className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Post anonymously
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

        {errorMessage ? (
          <AppText className="mt-4 text-sm text-red-500">
            {errorMessage}
          </AppText>
        ) : null}
      </ScrollView>

      <View className="px-5 pb-6">
        <Pressable
          className={`bg-green-600 dark:bg-green-400 rounded-2xl py-4 items-center justify-center shadow-lg ${
            isSubmitting ? "opacity-60" : ""
          }`}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <View className="flex-row items-center gap-2">
            <AppText className="text-base font-semibold text-white dark:text-slate-950">
              {isSubmitting ? "Posting..." : "Post Rant"}
            </AppText>
            <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
          </View>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
