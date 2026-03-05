import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "./AppText";

export type ToastVariant = "success" | "error";

type TopToastProps = {
  visible: boolean;
  message: string;
  variant: ToastVariant;
};

export function TopToast({ visible, message, variant }: TopToastProps) {
  const insets = useSafeAreaInsets();

  if (!visible || !message.trim()) return null;

  const containerClassName =
    variant === "success"
      ? "bg-green-600 dark:bg-green-500"
      : "bg-red-600 dark:bg-red-500";

  return (
    <View
      pointerEvents="none"
      style={{ top: insets.top + 8 }}
      className="absolute left-4 right-4 z-50"
    >
      <View className={`rounded-xl px-4 py-3 shadow-lg ${containerClassName}`}>
        <AppText className="text-sm font-semibold text-white">
          {message}
        </AppText>
      </View>
    </View>
  );
}
