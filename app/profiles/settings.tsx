import React from "react";
import { Linking, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "../../components/AppText";
import { useTheme } from "../../hooks/useTheme";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";

const settingsLinks = {
  instagram: "https://instagram.com/",
  twitter: "https://x.com/",
  telegram: "https://t.me/",
  terms: "https://example.com/terms",
  privacy: "https://example.com/privacy",
};

type SettingRowProps = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  onPress: () => void;
};

function SettingRow({
  label,
  icon,
  iconBg,
  iconColor,
  onPress,
}: SettingRowProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between px-4 py-4"
    >
      <View className="flex-row items-center gap-3">
        <View
          className="h-10 w-10 items-center justify-center rounded-2xl"
          style={{ backgroundColor: iconBg }}
        >
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>
        <AppText className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {label}
        </AppText>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
    </Pressable>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const openUrl = async (url: string) => {
    await Linking.openURL(url);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      router.replace("/(auth)/login");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <View className="flex-1 bg-slate-50 dark:bg-slate-950">
        <View className="flex-row items-center justify-between px-5 pb-3 pt-6">
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm dark:bg-slate-900"
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </Pressable>
          <AppText className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Settings
          </AppText>
          <View className="h-10 w-10" />
        </View>

        <ScrollView contentContainerClassName="px-5 pb-28">
          <AppText className="mt-4 text-xs font-semibold tracking-[2px] text-slate-400 dark:text-slate-500">
            FOLLOW US
          </AppText>
          <View className="mt-3 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <SettingRow
              label="Instagram"
              icon="logo-instagram"
              iconBg="#FCE7F3"
              iconColor="#EC4899"
              onPress={() => openUrl(settingsLinks.instagram)}
            />
            <View className="h-px bg-slate-100 dark:bg-slate-800" />
            <SettingRow
              label="Twitter (X)"
              icon="logo-twitter"
              iconBg="#E0F2FE"
              iconColor="#0EA5E9"
              onPress={() => openUrl(settingsLinks.twitter)}
            />
            <View className="h-px bg-slate-100 dark:bg-slate-800" />
            <SettingRow
              label="Telegram"
              icon="paper-plane"
              iconBg="#E0F2FE"
              iconColor="#2563EB"
              onPress={() => openUrl(settingsLinks.telegram)}
            />
          </View>

          <AppText className="mt-8 text-xs font-semibold tracking-[2px] text-slate-400 dark:text-slate-500">
            ABOUT
          </AppText>
          <View className="mt-3 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <SettingRow
              label="Terms of Service"
              icon="document-text-outline"
              iconBg="#F1F5F9"
              iconColor="#0F172A"
              onPress={() => openUrl(settingsLinks.terms)}
            />
            <View className="h-px bg-slate-100 dark:bg-slate-800" />
            <SettingRow
              label="Privacy Policy"
              icon="shield-checkmark-outline"
              iconBg="#F1F5F9"
              iconColor="#0F172A"
              onPress={() => openUrl(settingsLinks.privacy)}
            />
          </View>

          <Pressable
            onPress={handleLogout}
            className="mt-8 items-center justify-center rounded-2xl border border-rose-200 bg-white py-4 shadow-sm"
          >
            <View className="flex-row items-center gap-2">
              <Ionicons name="log-out-outline" size={18} color="#EF4444" />
              <AppText className="text-base font-semibold text-rose-500">
                Logout
              </AppText>
            </View>
          </Pressable>

          <AppText className="mt-8 text-center text-xs text-slate-400 dark:text-slate-500">
            Campus Story (HU) • Version 1.0.4
          </AppText>
          <AppText className="mt-1 text-center text-xs text-slate-400 dark:text-slate-500">
            Made for Hawassa University Students
          </AppText>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
