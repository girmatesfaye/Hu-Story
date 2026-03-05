import {
  Platform,
  TextInput,
  TouchableOpacity,
  View,
  Pressable,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { AppText } from "../../components/AppText";
import { useTheme } from "../../hooks/useTheme";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import { useSupabase } from "../../providers/SupabaseProvider";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

export default function AddReviewScreen() {
  const router = useRouter();
  const { colors, statusBarStyle } = useTheme();
  const { spotId } = useLocalSearchParams<{ spotId?: string }>();
  const { session } = useSupabase();
  const [reviewText, setReviewText] = useState("");
  const [reviewHeight, setReviewHeight] = useState(220);
  const [rating, setRating] = useState(4);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!session?.user) {
      setErrorMessage("Please log in to post a review.");
      return;
    }

    if (!spotId) {
      setErrorMessage("Missing spot information.");
      return;
    }

    if (!reviewText.trim()) {
      setErrorMessage("Write a review before posting.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const { error } = await supabase.from("spot_reviews").insert({
      spot_id: spotId,
      user_id: session.user.id,
      rating,
      content: reviewText.trim(),
    });

    setIsSubmitting(false);

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
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900"
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </Pressable>
          <AppText className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Write a Review
          </AppText>
          <View className="w-12" />
        </View>

        <KeyboardAwareScrollView
          style={{ flex: 1 }}
          contentContainerClassName="px-5"
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          enableOnAndroid
          enableAutomaticScroll
          enableResetScrollToCoords
          extraHeight={Platform.OS === "android" ? 120 : 80}
          extraScrollHeight={Platform.OS === "android" ? 56 : 20}
          keyboardOpeningTime={0}
        >
          <View className="mt-4 items-center">
            <AppText className="text-xs font-semibold tracking-[3px] text-slate-400 dark:text-slate-500">
              RATE YOUR EXPERIENCE
            </AppText>
            <View className="mt-6 flex-row items-center gap-3">
              {Array.from({ length: 5 }).map((_, index) => {
                const filled = index < rating;

                return (
                  <Ionicons
                    key={`star-${index}`}
                    name={filled ? "star" : "star-outline"}
                    size={36}
                    color={filled ? colors.accent : colors.mutedStrong}
                    onPress={() => setRating(index + 1)}
                  />
                );
              })}
            </View>
            <AppText className="mt-4 text-sm text-slate-400 dark:text-slate-500">
              Tap to rate
            </AppText>
          </View>

          <View className="mt-10">
            <AppText className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Your Review
            </AppText>
            <View className="mt-4 rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <TextInput
                placeholder="Tell others about the vibe, food, or noise level..."
                placeholderTextColor={colors.mutedStrong}
                className="text-sm text-slate-900 dark:text-slate-100"
                multiline
                scrollEnabled={false}
                blurOnSubmit={false}
                textAlignVertical="top"
                style={{
                  minHeight: 220,
                  height: Math.max(220, reviewHeight),
                }}
                value={reviewText}
                onChangeText={setReviewText}
                onContentSizeChange={(event) => {
                  const nextHeight = Math.max(
                    220,
                    Math.ceil(event.nativeEvent.contentSize.height),
                  );
                  if (Math.abs(nextHeight - reviewHeight) > 2) {
                    setReviewHeight(nextHeight);
                  }
                }}
                maxLength={500}
              />
              <View className="items-end">
                <AppText className="text-xs text-slate-400 dark:text-slate-500">
                  {reviewText.length} / 500
                </AppText>
              </View>
            </View>
          </View>
        </KeyboardAwareScrollView>

        <View className="border-t border-slate-200 bg-white px-5 pb-8 pt-4 dark:border-slate-800 dark:bg-slate-950">
          {errorMessage ? (
            <AppText className="mb-3 text-sm text-red-500">
              {errorMessage}
            </AppText>
          ) : null}
          <TouchableOpacity
            className={`h-12 w-full items-center justify-center rounded-2xl bg-green-500 ${
              isSubmitting ? "opacity-60" : ""
            }`}
            accessibilityRole="button"
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <AppText className="text-base font-semibold text-white">
              {isSubmitting ? "Posting..." : "Post Review"}
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </AppText>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
