import React from "react";
import { Pressable, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { AppText } from "./AppText";
import { useTheme } from "../hooks/useTheme";

type TabHeaderProps = {
  title: string;
  subtitle: string;
  onPressNotification?: () => void;
};

export function TabHeader({
  title,
  subtitle,
  onPressNotification,
}: TabHeaderProps) {
  const { colors } = useTheme();

  return (
    <View className="flex-row items-center justify-between">
      <View>
        <AppText className="text-[22px] font-bold text-slate-900 dark:text-slate-100">
          {title}
        </AppText>
        <AppText className="mt-1 text-sm text-slate-500 dark:text-green-400">
          {subtitle}
        </AppText>
      </View>

      {onPressNotification ? (
        <Pressable
          onPress={onPressNotification}
          accessibilityRole="button"
          className="h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
        >
          <Ionicons
            name="notifications-outline"
            size={22}
            color={colors.text}
          />
        </Pressable>
      ) : null}
    </View>
  );
}
