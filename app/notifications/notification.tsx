import { Image, ScrollView, TouchableOpacity, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "../../components/AppText";
import { useTheme } from "../../hooks/useTheme";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useSupabase } from "../../providers/SupabaseProvider";
import AsyncStorage from "@react-native-async-storage/async-storage";

const filters = ["All", "Rants", "Events", "Projects"];

type NotificationItem = {
  id: string;
  title: string;
  body: string | null;
  type: string | null;
  is_read: boolean;
  created_at: string;
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

const getNotificationTone = (type?: string | null) => {
  switch ((type ?? "").toLowerCase()) {
    case "rants":
      return { icon: "chatbox", bg: "bg-emerald-100", color: "#16A34A" };
    case "events":
      return { icon: "calendar", bg: "bg-orange-100", color: "#F97316" };
    case "projects":
      return { icon: "rocket", bg: "bg-violet-100", color: "#7C3AED" };
    default:
      return { icon: "notifications", bg: "bg-slate-100", color: "#64748B" };
  }
};

export default function NotificationScreen() {
  const { colors, statusBarStyle } = useTheme();
  const { session } = useSupabase();
  const [activeFilter, setActiveFilter] = useState(filters[0]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeType = useMemo(() => {
    if (activeFilter === "All") return null;
    return activeFilter.toLowerCase();
  }, [activeFilter]);

  const visibleNotifications = useMemo(() => {
    if (!activeType) return notifications;
    return notifications.filter(
      (item) => (item.type ?? "").toLowerCase() === activeType,
    );
  }, [notifications, activeType]);

  const unreadCount = useMemo(
    () => visibleNotifications.filter((item) => !item.is_read).length,
    [visibleNotifications],
  );

  useEffect(() => {
    let isMounted = true;
    const cacheKey = session?.user?.id
      ? `notifications:${session.user.id}`
      : null;

    const loadCached = async () => {
      if (!cacheKey) return;
      try {
        const cached = await AsyncStorage.getItem(cacheKey);
        if (!cached || !isMounted) return;
        const parsed = JSON.parse(cached) as NotificationItem[];
        setNotifications(parsed);
      } catch {
        // ignore cache errors
      }
    };

    const loadNotifications = async () => {
      if (!session?.user?.id) {
        setNotifications([]);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      let query = supabase
        .from("notifications")
        .select("id, title, body, type, is_read, created_at")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      const { data, error } = await query;

      if (!isMounted) return;

      if (error) {
        setErrorMessage(error.message);
        setNotifications([]);
      } else {
        setNotifications((data ?? []) as NotificationItem[]);
      }

      setIsLoading(false);

      if (!error && cacheKey) {
        try {
          await AsyncStorage.setItem(
            cacheKey,
            JSON.stringify((data ?? []) as NotificationItem[]),
          );
        } catch {
          // ignore cache errors
        }
      }
    };

    loadCached();
    loadNotifications();

    return () => {
      isMounted = false;
    };
  }, [session?.user?.id]);

  useEffect(() => {
    if (!session?.user?.id) return;

    const userId = session.user.id;
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const eventType = payload.eventType;

          if (eventType === "INSERT") {
            const newRow = payload.new as NotificationItem;
            setNotifications((prev) => {
              if (prev.some((item) => item.id === newRow.id)) return prev;
              return [newRow, ...prev];
            });
          }

          if (eventType === "UPDATE") {
            const updatedRow = payload.new as NotificationItem;
            setNotifications((prev) =>
              prev.map((item) =>
                item.id === updatedRow.id ? updatedRow : item,
              ),
            );
          }

          if (eventType === "DELETE") {
            const oldRow = payload.old as NotificationItem;
            setNotifications((prev) =>
              prev.filter((item) => item.id !== oldRow.id),
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  const handleMarkAllRead = async () => {
    if (!session?.user?.id) return;

    setErrorMessage(null);

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", session.user.id)
      .eq("is_read", false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setNotifications((current) =>
      current.map((item) => ({ ...item, is_read: true })),
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <View className="flex-1 bg-slate-50 dark:bg-slate-950">
        <StatusBar style={statusBarStyle} />
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pb-28"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-row items-center justify-between pt-6">
            <View className="flex-row items-center gap-3">
              <View className="relative">
                <View className="h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-500/20">
                  <Ionicons
                    name="notifications"
                    size={20}
                    color={colors.accent}
                  />
                </View>
                {unreadCount > 0 ? (
                  <View className="absolute -right-2 -top-2 h-6 min-w-[24px] items-center justify-center rounded-full bg-red-500 px-1">
                    <AppText className="text-[10px] font-semibold text-white">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </AppText>
                  </View>
                ) : null}
              </View>
              <AppText className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                Notifications
              </AppText>
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={handleMarkAllRead}
            >
              <AppText className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                Mark all read
              </AppText>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="mt-5 gap-3"
          >
            {filters.map((filter) => {
              const isActive = filter === activeFilter;

              return (
                <TouchableOpacity
                  key={filter}
                  className={`rounded-full px-4 py-2 ${
                    isActive
                      ? "bg-emerald-600"
                      : "border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                  }`}
                  accessibilityRole="button"
                  onPress={() => setActiveFilter(filter)}
                >
                  <AppText
                    className={`text-xs font-semibold ${
                      isActive
                        ? "text-white"
                        : "text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {filter}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View className="mt-6">
            {isLoading ? (
              <AppText className="text-sm text-slate-400 dark:text-slate-500">
                Loading notifications...
              </AppText>
            ) : null}
            {errorMessage ? (
              <AppText className="mt-3 text-sm text-red-500">
                {errorMessage}
              </AppText>
            ) : null}

            <View className="mt-4 gap-4">
              {visibleNotifications.map((item) => {
                const tone = getNotificationTone(item.type);

                return (
                  <View
                    key={item.id}
                    className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900"
                  >
                    <View className="flex-row items-start gap-4">
                      <View
                        className={`h-12 w-12 items-center justify-center rounded-2xl ${tone.bg} dark:bg-opacity-20`}
                      >
                        <Ionicons
                          name={tone.icon as keyof typeof Ionicons.glyphMap}
                          size={18}
                          color={tone.color}
                        />
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center justify-between">
                          <AppText className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {item.title}
                          </AppText>
                          {!item.is_read ? (
                            <View className="h-2 w-2 rounded-full bg-emerald-500" />
                          ) : null}
                        </View>
                        {item.body ? (
                          <AppText className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                            {item.body}
                          </AppText>
                        ) : null}
                        <AppText className="mt-3 text-xs text-slate-400 dark:text-slate-500">
                          {formatTimeAgo(item.created_at)}
                        </AppText>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {!isLoading && visibleNotifications.length === 0 ? (
            <View className="mt-8 items-center pb-6">
              <View className="h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <Ionicons
                  name="checkmark"
                  size={22}
                  color={colors.mutedStrong}
                />
              </View>
              <AppText className="mt-3 text-sm text-slate-400 dark:text-slate-500">
                You're all caught up!
              </AppText>
            </View>
          ) : null}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
