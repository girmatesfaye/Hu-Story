import React, { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "./AppText";
import { useTheme } from "../hooks/useTheme";

type ReportModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit?: (reason: string, details: string) => void;
};

const reasons = [
  "It's spam",
  "Hate speech or symbols",
  "Bullying or harassment",
  "False information",
  "Something else",
];

export function ReportModal({ visible, onClose, onSubmit }: ReportModalProps) {
  const { colors, statusBarStyle } = useTheme();
  const [selectedReason, setSelectedReason] = useState(reasons[0]);
  const [details, setDetails] = useState("");

  useEffect(() => {
    if (!visible) {
      setSelectedReason(reasons[0]);
      setDetails("");
    }
  }, [visible]);

  const handleSubmit = () => {
    onSubmit?.(selectedReason, details.trim());
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
    >
      <View className="flex-1 items-center justify-center bg-black/40 px-5">
        <View className="w-full max-w-[420px] max-h-[70%] rounded-3xl bg-white shadow-xl dark:bg-slate-950">
          <View className="flex-row items-start justify-between border-b border-slate-100 px-5 pb-4 pt-5 dark:border-slate-800">
            <View className="flex-1 pr-3">
              <AppText className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Report Content
              </AppText>
              <AppText className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Why are you reporting this post?
              </AppText>
            </View>
            <TouchableOpacity
              className="h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900"
              accessibilityRole="button"
              onPress={onClose}
            >
              <Ionicons
                name="close"
                size={16}
                color={statusBarStyle === "light" ? "#E5E7EB" : "#0F172A"}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            className="px-5 pt-5"
            contentContainerClassName="pb-6"
            showsVerticalScrollIndicator={false}
          >
            <View className="gap-3">
              {reasons.map((reason) => {
                const isSelected = reason === selectedReason;

                return (
                  <Pressable
                    key={reason}
                    onPress={() => setSelectedReason(reason)}
                    className={`flex-row items-center justify-between rounded-2xl border px-4 py-3 ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50 dark:border-emerald-400 dark:bg-emerald-900/30"
                        : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                    }`}
                  >
                    <View className="flex-row items-center gap-3">
                      <View
                        className={`h-10 w-10 items-center justify-center rounded-2xl ${
                          isSelected
                            ? "bg-emerald-100 dark:bg-emerald-500/20"
                            : "bg-slate-100 dark:bg-slate-800"
                        }`}
                      >
                        <Ionicons
                          name={
                            reason === "It's spam"
                              ? "ban"
                              : reason === "Hate speech or symbols"
                                ? "alert"
                                : reason === "Bullying or harassment"
                                  ? "alert-circle"
                                  : reason === "False information"
                                    ? "warning"
                                    : "ellipsis-horizontal"
                          }
                          size={18}
                          color={isSelected ? colors.accent : colors.mutedText}
                        />
                      </View>
                      <AppText
                        className={`text-sm font-semibold ${
                          isSelected
                            ? "text-emerald-700 dark:text-emerald-200"
                            : "text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        {reason}
                      </AppText>
                    </View>
                    <View
                      className={`h-6 w-6 items-center justify-center rounded-full border ${
                        isSelected
                          ? "border-emerald-600"
                          : "border-slate-300 dark:border-slate-700"
                      }`}
                    >
                      {isSelected ? (
                        <View className="h-3 w-3 rounded-full bg-emerald-600" />
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <AppText className="mt-6 text-xs font-semibold tracking-[2px] text-slate-400 dark:text-slate-500">
              ADDITIONAL DETAILS (OPTIONAL)
            </AppText>
            <View className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
              <TextInput
                placeholder="Please describe the issue..."
                placeholderTextColor={colors.mutedStrong}
                className="min-h-[90px] text-sm text-slate-900 dark:text-slate-100"
                multiline
                textAlignVertical="top"
                value={details}
                onChangeText={setDetails}
              />
            </View>

            <TouchableOpacity
              className="mt-6 h-12 items-center justify-center rounded-2xl bg-emerald-600"
              accessibilityRole="button"
              onPress={handleSubmit}
            >
              <AppText className="text-base font-semibold text-white">
                Submit Report
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              className="mt-4 items-center"
              accessibilityRole="button"
              onPress={onClose}
            >
              <AppText className="text-sm text-slate-500 dark:text-slate-400">
                Cancel
              </AppText>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
