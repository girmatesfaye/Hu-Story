import React, { useEffect, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { AppText } from "../../components/AppText";
import { TopToast } from "../../components/TopToast";
import Feather from "@expo/vector-icons/Feather";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTopToast } from "../../hooks/useTopToast";
import { supabase } from "../../lib/supabase";
import { useSupabase } from "../../providers/SupabaseProvider";
import { useTheme } from "../../hooks/useTheme";
import { RANT_CATEGORIES } from "../../constants/categories";
import { trackSmartlookEvent } from "../../lib/smartlook";
export default function CreateRantScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { session } = useSupabase();
  const [activeCategory, setActiveCategory] = useState<string>(
    RANT_CATEGORIES[0],
  );
  const [text, setText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const { toast, showToast } = useTopToast();

  useEffect(() => {
    if (Platform.OS !== "android") return;

    const showSub = Keyboard.addListener("keyboardDidShow", (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleSubmit = async () => {
    // Smartlook phase-1 integration: track rant creation attempts and outcomes.
    void trackSmartlookEvent("rant_create_attempt", {
      category: activeCategory,
      is_anonymous: isAnonymous,
    });

    if (!session?.user) {
      showToast("Please fill all required fields.", "error");
      return;
    }

    if (!text.trim()) {
      showToast("Please fill all required fields.", "error");
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.from("rants").insert({
      user_id: session.user.id,
      category: activeCategory,
      content: text.trim(),
      is_anonymous: isAnonymous,
    });

    setIsSubmitting(false);

    if (error) {
      showToast("Something went wrong. Please try again.", "error");
      void trackSmartlookEvent("rant_create_failed", {
        category: activeCategory,
      });
      return;
    }

    void trackSmartlookEvent("rant_create_success", {
      category: activeCategory,
      is_anonymous: isAnonymous,
    });
    showToast("Successfully created.", "success");
    setTimeout(() => {
      router.replace("/(tabs)/rants");
    }, 700);
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
        enabled={Platform.OS === "ios"}
      >
        <TopToast
          visible={toast.visible}
          message={toast.message}
          variant={toast.variant}
        />
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <Pressable
            onPress={() => router.back()}
            className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 items-center justify-center"
          >
            <Feather name="arrow-left" size={24} color={colors.text} />
          </Pressable>

          <AppText className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Create Rant
          </AppText>
          <View className="w-14" />
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pt-4"
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom:
              Platform.OS === "android" ? keyboardHeight + 120 : 120,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AppText className="text-xs tracking-widest text-slate-400 dark:text-slate-500">
            SELECT A CATEGORY
          </AppText>

          <View className="flex-row flex-wrap gap-3 mt-3">
            {RANT_CATEGORIES.map((category) => {
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

          <View className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="What's happening on campus today?"
              placeholderTextColor="#979eb4"
              multiline
              textAlignVertical="top"
              className="min-h-[170px] text-base leading-6 text-slate-900 dark:text-slate-100"
            />
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
        </ScrollView>

        <View
          className="px-5 pb-6 pt-3"
          style={{
            marginBottom: Platform.OS === "android" ? keyboardHeight : 0,
          }}
        >
          <Pressable
            className={`bg-green-600 dark:bg-green-600 rounded-2xl py-4 items-center justify-center shadow-lg ${
              isSubmitting ? "opacity-60" : ""
            }`}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <View className="flex-row items-center gap-2">
              <AppText className="text-base font-semibold text-white text-white">
                {isSubmitting ? "Posting..." : "Post Rant"}
              </AppText>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </View>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
