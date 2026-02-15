import { ScrollView, TouchableOpacity, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AppText } from "../../components/AppText";
import { useTheme } from "../../hooks/useTheme";
import { SafeAreaView } from "react-native-safe-area-context";

type ProjectDetails = {
  title: string;
  author: string;
  role: string;
  timeAgo: string;
  label: string;
  heroClassName: string;
  about: string[];
  tags: string[];
  views: string;
  likes: string;
  members: string[];
};

const projects: Record<string, ProjectDetails> = {
  "1": {
    title: "Library Seat Finder System",
    author: "Abebe Kebede",
    role: "Software Engineering",
    timeAgo: "2 days ago",
    label: "IoT System",
    heroClassName: "bg-amber-50 dark:bg-amber-900/30",
    about: [
      "Finding a seat in the main library during exam week is a nightmare. This project solves that problem by providing a real-time tracking system for seat occupancy.",
      "We utilized custom-built IoT sensors placed under tables to detect presence. The data is pushed to a Firebase backend and visualized on a React Native mobile app. Students can check which floors have free space before even leaving their dorms.",
      "Currently deployed in the 2nd-floor reading room as a pilot test. Looking for collaborators to help expand the backend infrastructure!",
    ],
    tags: ["#Arduino", "#React Native", "#Firebase", "#IoT", "#Hardware"],
    views: "1.2k",
    likes: "48",
    members: ["AK", "ME", "TS"],
  },
  "2": {
    title: "Bio-Waste Energy",
    author: "Liya A.",
    role: "Environmental Science",
    timeAgo: "5 hours ago",
    label: "Sustainability",
    heroClassName: "bg-emerald-50 dark:bg-emerald-900/30",
    about: [
      "A research paper and prototype on converting cafeteria waste to sustainable energy. The project studies anaerobic digestion and small-scale biogas collection.",
      "We built a pilot digester and monitored output with basic sensors. The goal is to validate the output for powering low-energy campus devices.",
      "Seeking collaborators for data analysis and improved sensor calibration.",
    ],
    tags: ["#Sustainability", "#Research", "#Biogas", "#Sensors"],
    views: "860",
    likes: "31",
    members: ["LA", "BF", "KN"],
  },
  "3": {
    title: "Freelance Connect",
    author: "Dawit A.",
    role: "Product Design",
    timeAgo: "1 day ago",
    label: "Marketplace",
    heroClassName: "bg-sky-50 dark:bg-sky-900/30",
    about: [
      "A platform connecting student designers with local businesses for quick freelance work. It features profiles, messaging, and project bidding.",
      "We are focused on trust and transparency with milestone-based payments and reputation scores.",
      "Looking for frontend collaborators and beta testers.",
    ],
    tags: ["#Marketplace", "#Product", "#Design"],
    views: "540",
    likes: "22",
    members: ["DA", "SR"],
  },
};

export default function ProjectDetailsScreen() {
  const { statusBarStyle } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const project = projects[id ?? "1"] ?? projects["1"];

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
          <View className={`h-56 w-full ${project.heroClassName}`}>
            <View className="absolute bottom-4 left-5 rounded-full bg-emerald-600 px-4 py-1">
              <AppText className="text-xs font-semibold text-white">
                {project.label}
              </AppText>
            </View>
          </View>

          <View className="px-5 pt-6">
            <AppText className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {project.title}
            </AppText>

            <View className="mt-4 flex-row items-center">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-amber-200 dark:bg-amber-700">
                <AppText className="text-xs font-semibold text-amber-900 dark:text-amber-50">
                  {project.author
                    .split(" ")
                    .map((part) => part[0])
                    .join("")}
                </AppText>
              </View>
              <View className="ml-3">
                <AppText className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {project.author}
                </AppText>
                <AppText className="text-xs text-slate-500 dark:text-slate-400">
                  {project.role} · {project.timeAgo}
                </AppText>
              </View>
            </View>

            <AppText className="mt-6 text-lg font-semibold text-slate-900 dark:text-slate-100">
              About this project
            </AppText>
            {project.about.map((paragraph) => (
              <AppText
                key={paragraph}
                className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300"
              >
                {paragraph}
              </AppText>
            ))}

            <AppText className="mt-8 text-xs font-semibold tracking-[2px] text-slate-400 dark:text-slate-500">
              TECH STACK
            </AppText>
            <View className="mt-3 flex-row flex-wrap gap-2">
              {project.tags.map((tag) => (
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

            <View className="mt-6 flex-row items-center justify-between rounded-2xl border border-slate-100 px-4 py-3 dark:border-slate-800">
              <View className="flex-row items-center">
                <Ionicons
                  name="eye-outline"
                  size={16}
                  color={statusBarStyle === "light" ? "#CBD5F5" : "#64748B"}
                />
                <AppText className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                  {project.views}
                </AppText>
              </View>
              <View className="flex-row items-center">
                <Ionicons
                  name="heart"
                  size={16}
                  color={statusBarStyle === "light" ? "#CBD5F5" : "#64748B"}
                />
                <AppText className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                  {project.likes}
                </AppText>
              </View>
              <View className="flex-row -space-x-3">
                {project.members.map((member) => (
                  <View
                    key={member}
                    className="h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-200 dark:border-slate-900 dark:bg-slate-700"
                  >
                    <AppText className="text-[10px] font-semibold text-slate-600 dark:text-slate-200">
                      {member}
                    </AppText>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>

        <View className="absolute bottom-0 left-0 right-0 bg-white px-5 pb-8 pt-4 shadow-lg dark:bg-slate-950">
          <TouchableOpacity
            className="h-12 w-full items-center justify-center rounded-2xl bg-emerald-600"
            accessibilityRole="button"
          >
            <View className="flex-row items-center">
              <AppText className="text-base font-semibold text-white">
                View Repository
              </AppText>
              <Ionicons name="open-outline" size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
