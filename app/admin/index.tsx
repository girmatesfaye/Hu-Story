import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import Feather from "@expo/vector-icons/Feather";
import { AppText } from "../../components/AppText";
import { useTheme } from "../../hooks/useTheme";
import { supabase } from "../../lib/supabase";
import { useSupabase } from "../../providers/SupabaseProvider";
import { useRouter } from "expo-router";
import { isAdminUser } from "../../constants/admin";

const moderationTabs = [
  { id: "pending", label: "Pending" },
  { id: "history", label: "History" },
];

type ReportRow = {
  id: string;
  reporter_id: string | null;
  target_type: string;
  target_id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
};

type ReportTarget = {
  content?: string | null;
  user_id?: string | null;
};

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

const formatUserLabel = (userId?: string | null) => {
  if (!userId) return "Unknown";
  return `${userId.slice(0, 6)}...${userId.slice(-4)}`;
};

const normalizeType = (value: string) => value.toLowerCase();

const tableByType: Record<string, string> = {
  rants: "rants",
  events: "events",
  projects: "projects",
  spots: "spots",
  comments: "rant_comments",
};

type ModerationCardProps = {
  item: ReportRow;
  target?: ReportTarget;
  iconColor: string;
  onAction: (item: ReportRow, action: "keep" | "warn" | "delete") => void;
  isUpdating: boolean;
};

function ModerationCard({
  item,
  target,
  iconColor,
  onAction,
  isUpdating,
}: ModerationCardProps) {
  const typeLabel = item.target_type.toUpperCase();
  const timeLabel = formatTimeAgo(item.created_at);
  const content = target?.content || item.details || "No content available.";

  return (
    <View className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <View className="rounded-full bg-emerald-100 px-2.5 py-1 dark:bg-emerald-500/20">
            <AppText className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-200">
              {typeLabel}
            </AppText>
          </View>
          <AppText className="text-xs text-slate-400">#{item.id}</AppText>
          <AppText className="text-xs text-slate-400">• {timeLabel}</AppText>
        </View>
        <View className="rounded-full bg-red-50 px-3 py-1">
          <AppText className="text-[11px] font-semibold text-red-600">
            {item.reason}
          </AppText>
        </View>
      </View>

      <View className="mt-4 flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
          <AppText className="text-sm font-semibold text-slate-600 dark:text-slate-200">
            {formatUserLabel(target?.user_id).slice(0, 2).toUpperCase()}
          </AppText>
        </View>
        <View className="flex-1">
          <AppText className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {formatUserLabel(target?.user_id)}
          </AppText>
          <AppText className="text-xs text-slate-500 dark:text-slate-400">
            Status: {item.status}
          </AppText>
        </View>
      </View>

      <View className="mt-4 flex-row gap-3">
        <View className="flex-1 rounded-xl bg-slate-100 px-3 py-3 dark:bg-slate-800">
          <AppText className="text-xs leading-5 text-slate-600 dark:text-slate-200">
            {content}
          </AppText>
        </View>
      </View>

      <View className="mt-3 flex-row items-start gap-2">
        <Feather name="flag" size={14} color={iconColor} />
        <AppText className="flex-1 text-xs text-slate-500 dark:text-slate-400">
          Reporter&apos;s Note: {item.details || "No details provided."}
        </AppText>
      </View>

      <View className="mt-4 flex-row gap-3">
        {[
          { label: "Keep", action: "keep" as const },
          { label: "Warn User", action: "warn" as const },
          { label: "Delete", action: "delete" as const },
        ].map(({ label, action }) => {
          const isPrimary = action === "warn";
          const isWarn = action === "warn";
          const isDelete = action === "delete";
          return (
            <Pressable
              key={action}
              onPress={() => onAction(item, action)}
              disabled={isUpdating}
              className={`flex-1 items-center justify-center rounded-xl border px-3 py-2 ${
                isPrimary
                  ? "border-emerald-500 bg-emerald-500"
                  : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
              } ${isWarn ? "border-amber-300 bg-amber-50" : ""} ${
                isDelete ? "border-red-200 bg-red-50" : ""
              } ${isUpdating ? "opacity-60" : ""}`}
            >
              <AppText
                className={`text-xs font-semibold ${
                  isPrimary
                    ? "text-white"
                    : isWarn
                      ? "text-amber-700"
                      : isDelete
                        ? "text-red-600"
                        : "text-slate-700 dark:text-slate-100"
                }`}
              >
                {label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function AdminScreen() {
  const { colors } = useTheme();
  const { session, isLoading: authLoading } = useSupabase();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("pending");
  const [searchValue, setSearchValue] = useState("");
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [targets, setTargets] = useState<Record<string, ReportTarget>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!session?.user) {
      router.replace("/(auth)/login");
      return;
    }

    const ensureAdmin = async () => {
      const isAdmin = await isAdminUser();
      if (!isAdmin) {
        router.replace("/(tabs)/rants");
      }
    };

    void ensureAdmin();
  }, [authLoading, session, router]);

  const pendingCount = useMemo(
    () => reports.filter((report) => report.status === "pending").length,
    [reports],
  );
  const historyCount = useMemo(
    () => reports.filter((report) => report.status !== "pending").length,
    [reports],
  );

  const filteredReports = useMemo(() => {
    const statusFiltered = reports.filter((report) =>
      activeTab === "pending"
        ? report.status === "pending"
        : report.status !== "pending",
    );

    if (!searchValue.trim()) return statusFiltered;

    const query = searchValue.trim().toLowerCase();
    return statusFiltered.filter((report) =>
      [report.id, report.target_id, report.reason, report.target_type]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [reports, activeTab, searchValue]);

  useEffect(() => {
    let isMounted = true;

    const loadReports = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      const { data, error } = await supabase
        .from("reports")
        .select(
          "id, reporter_id, target_type, target_id, reason, details, status, created_at",
        )
        .order("created_at", { ascending: false });

      if (!isMounted) return;

      if (error) {
        setErrorMessage(error.message);
        setReports([]);
      } else {
        setReports((data ?? []) as ReportRow[]);
      }

      setIsLoading(false);
    };

    loadReports();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadTargets = async () => {
      const rantIds = Array.from(
        new Set(
          reports
            .filter((report) => normalizeType(report.target_type) === "rants")
            .map((report) => report.target_id),
        ),
      );

      if (rantIds.length === 0) {
        setTargets({});
        return;
      }

      const { data, error } = await supabase
        .from("rants")
        .select("id, content, user_id")
        .in("id", rantIds);

      if (!isMounted) return;

      if (error) {
        setTargets({});
        return;
      }

      const map: Record<string, ReportTarget> = {};
      (data ?? []).forEach((row) => {
        map[row.id] = { content: row.content, user_id: row.user_id };
      });
      setTargets(map);
    };

    loadTargets();

    return () => {
      isMounted = false;
    };
  }, [reports]);

  const handleModerationAction = async (
    report: ReportRow,
    action: "keep" | "warn" | "delete",
  ) => {
    if (updatingId) return;

    setUpdatingId(report.id);
    setErrorMessage(null);

    const targetType = normalizeType(report.target_type);
    const table = tableByType[targetType];
    const targetUserId = targets[report.target_id]?.user_id ?? null;

    if (action === "delete" && table) {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq("id", report.target_id);
      if (error) {
        setErrorMessage(error.message);
        setUpdatingId(null);
        return;
      }
    }

    const nextStatus =
      action === "keep"
        ? "dismissed"
        : action === "warn"
          ? "warned"
          : "removed";

    const { error: updateError } = await supabase
      .from("reports")
      .update({ status: nextStatus })
      .eq("id", report.id);

    if (updateError) {
      setErrorMessage(updateError.message);
      setUpdatingId(null);
      return;
    }

    if (targetUserId && action !== "keep") {
      const notificationTitle =
        action === "warn" ? "Content warning" : "Content removed";
      const notificationBody =
        action === "warn"
          ? "Your content was reported. Please follow community guidelines."
          : "Your content was removed by moderators.";

      await supabase.from("notifications").insert({
        user_id: targetUserId,
        title: notificationTitle,
        body: notificationBody,
        type: targetType,
        is_read: false,
      });
    }

    setReports((current) =>
      current.map((item) =>
        item.id === report.id ? { ...item, status: nextStatus } : item,
      ),
    );
    setUpdatingId(null);
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <View className="px-5 pt-2">
        <View className="flex-row items-center justify-between">
          <View>
            <AppText className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              Moderation Center
            </AppText>
            <AppText className="text-sm text-slate-500 dark:text-slate-400">
              Campus Story (HU)
            </AppText>
          </View>
          <Pressable className="h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <Ionicons
              name="notifications-outline"
              size={20}
              color={colors.text}
            />
          </Pressable>
        </View>

        <View className="mt-4 flex-row rounded-2xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
          {moderationTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const count = tab.id === "pending" ? pendingCount : historyCount;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                className={`flex-1 flex-row items-center justify-center gap-2 rounded-2xl px-3 py-2 ${
                  isActive ? "bg-emerald-50 dark:bg-emerald-500/20" : ""
                }`}
              >
                <AppText
                  className={`text-sm font-semibold ${
                    isActive
                      ? "text-emerald-700 dark:text-emerald-300"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {tab.label}
                </AppText>
                {count > 0 ? (
                  <View className="rounded-full bg-red-100 px-2 py-0.5">
                    <AppText className="text-[11px] font-semibold text-red-600">
                      {count}
                    </AppText>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <View className="mt-4 flex-row items-center gap-3">
          <View className="flex-1 flex-row items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
            <Ionicons
              name="search-outline"
              size={18}
              color={colors.mutedText}
            />
            <TextInput
              placeholder="Search user ID, keyword, or report ID..."
              placeholderTextColor={colors.mutedStrong}
              className="flex-1 text-sm text-slate-900 dark:text-slate-100"
              value={searchValue}
              onChangeText={setSearchValue}
            />
          </View>
          <Pressable className="h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
            <Ionicons
              name="options-outline"
              size={20}
              color={colors.mutedText}
            />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerClassName="gap-4 px-5 pb-28 pt-5">
        {isLoading ? (
          <AppText className="text-sm text-slate-400 dark:text-slate-500">
            Loading reports...
          </AppText>
        ) : null}
        {errorMessage ? (
          <AppText className="text-sm text-red-500">{errorMessage}</AppText>
        ) : null}
        {filteredReports.map((item) => (
          <ModerationCard
            key={item.id}
            item={item}
            target={targets[item.target_id]}
            iconColor={colors.mutedText}
            onAction={handleModerationAction}
            isUpdating={updatingId === item.id}
          />
        ))}
        {!isLoading && filteredReports.length === 0 ? (
          <AppText className="text-sm text-slate-400 dark:text-slate-500">
            No reports found.
          </AppText>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
