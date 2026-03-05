import React from "react";
import { Modal, Pressable, View } from "react-native";
import { AppText } from "./AppText";

type FetchErrorModalProps = {
  visible: boolean;
  message: string | null;
  onRetry: () => void;
  onClose: () => void;
  retryLabel?: string;
};

export function FetchErrorModal({
  visible,
  message,
  onRetry,
  onClose,
  retryLabel = "Retry",
}: FetchErrorModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 items-center justify-center bg-black/50 px-6">
        <View className="w-full rounded-2xl bg-white p-5 shadow-lg dark:bg-slate-900">
          <AppText className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Something went wrong
          </AppText>
          <AppText className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {message ?? "Unable to load data right now."}
          </AppText>

          <View className="mt-5 flex-row items-center gap-3">
            <Pressable
              onPress={onClose}
              className="flex-1 items-center justify-center rounded-xl border border-slate-200 py-3 dark:border-slate-800"
            >
              <AppText className="text-sm font-semibold text-slate-600 dark:text-slate-200">
                Close
              </AppText>
            </Pressable>
            <Pressable
              onPress={onRetry}
              className="flex-1 items-center justify-center rounded-xl bg-green-600 py-3"
            >
              <AppText className="text-sm font-semibold text-white">
                {retryLabel}
              </AppText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
