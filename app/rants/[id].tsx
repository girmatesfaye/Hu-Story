import React from "react";
import {
  ScrollView,
  View,
  Pressable,
  TextInput,
  useColorScheme,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { AppText } from "../../components/AppText";
import { SafeAreaView } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
const comments = [
  {
    id: "c1",
    name: "JohnyStudent",
    time: "2h ago",
    content:
      "Tell me about it. I had to use my data all day. My wallet is crying right now.",
    likes: 12,
  },
  {
    id: "c2",
    name: "Sarah_22",
    time: "1h ago",
    content:
      "Have you tried the second floor? It is usually better near the history section.",
    likes: 5,
  },
  {
    id: "c3",
    name: "MikeK",
    time: "15m ago",
    content: "I think they throttle it on purpose. Conspiracy time?",
    likes: 0,
  },
  {
    id: "c4",
    name: "King",
    time: "15m ago",
    content: "I think they throttle it on purpose. Conspiracy time?",
    likes: 0,
  },
];

export default function RantCommentsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const scheme = useColorScheme();
  const iconColors = {
    text: scheme === "dark" ? "#E5E7EB" : "#0F172A",
    muted: scheme === "dark" ? "#94A3B8" : "#64748B",
    accent: scheme === "dark" ? "#4ADE80" : "#16A34A",
    placeholder: scheme === "dark" ? "#94A3B8" : "#64748B",
    chipText: scheme === "dark" ? "#0B0B0B" : "#FFFFFF",
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">
      <View className="flex-1 bg-white dark:bg-slate-950">
        <ScrollView contentContainerClassName="px-[18px] py-4 pb-28">
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
            <Pressable
              onPress={() => router.back()}
              className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 items-center justify-center"
            >
              <Feather name="arrow-left" size={24} color="black" />{" "}
            </Pressable>

            <AppText className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Comments
            </AppText>
            <View className="w-14" />
          </View>
          {/* Rant Card */}
          <View className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl p-4 mb-4">
            <AppText className="text-sm font-semibold mb-2.5 text-slate-900 dark:text-slate-100">
              Rant #{id ?? "-"}
            </AppText>

            <AppText className="text-[15px] leading-[22px] text-slate-900 dark:text-slate-100">
              Why is the WiFi in the library always down during exam week? It is
              literally impossible to get any research done. We need a fix ASAP!
            </AppText>
          </View>

          {/* Section Title */}
          <AppText className="text-xs uppercase tracking-wider mb-3 text-slate-400 dark:text-slate-500">
            Discussion
          </AppText>

          {/* Comments */}
          {comments.map((comment) => (
            <View
              key={comment.id}
              className="py-3.5 border-b border-slate-200 dark:border-slate-800"
            >
              {/* Header */}
              <View className="flex-row items-center mb-2">
                <View className="w-9 h-9 rounded-full items-center justify-center mr-2.5 bg-slate-100 dark:bg-slate-900">
                  <AppText className="text-xs font-semibold text-green-600 dark:text-green-400">
                    {comment.name.slice(0, 2).toUpperCase()}
                  </AppText>
                </View>

                <View className="flex-1">
                  <AppText className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {comment.name}
                  </AppText>
                  <AppText className="text-[11px] mt-0.5 text-slate-500 dark:text-slate-400">
                    {comment.time}
                  </AppText>
                </View>
              </View>

              {/* Body */}
              <AppText className="text-sm leading-5 text-slate-900 dark:text-slate-100">
                {comment.content}
              </AppText>

              {/* Actions */}
              <View className="flex-row items-center gap-2 mt-2.5">
                <Ionicons
                  name="heart-outline"
                  size={16}
                  color={iconColors.muted}
                />
                <AppText className="text-xs text-slate-500 dark:text-slate-400">
                  {comment.likes}
                </AppText>
                <AppText className="text-xs ml-2 text-green-600 dark:text-green-400">
                  Reply
                </AppText>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Input Bar */}
        <View className="absolute bottom-0 left-0 right-0 flex-row items-center px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <TextInput
            placeholder="Join the discussion..."
            placeholderTextColor={iconColors.placeholder}
            className="flex-1 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-full px-4 py-2 mr-2"
          />

          <Pressable className="w-10 h-10 rounded-full items-center justify-center bg-green-600 dark:bg-green-400">
            <Ionicons name="send" size={18} color={iconColors.chipText} />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
