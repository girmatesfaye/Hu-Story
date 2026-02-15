import { ScrollView, TextInput, TouchableOpacity, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { AppText } from "../../components/AppText";
import { useTheme } from "../../hooks/useTheme";

export default function RegisterScreen() {
  const { colors, statusBarStyle } = useTheme();
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <StatusBar style={statusBarStyle} />
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-10 pt-6"
        showsVerticalScrollIndicator={false}
      >
        <View className="overflow-hidden rounded-[32px] bg-white shadow-xl dark:bg-slate-900">
          <View className="h-2 bg-emerald-500" />

          <View className="px-6 pb-8 pt-8">
            <View className="items-center">
              <View className="h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-500/20">
                <Ionicons name="school" size={28} color={colors.accent} />
              </View>
              <AppText className="mt-6 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                Join the Campus
              </AppText>
              <AppText className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
                Connect with students, events, and projects at Hawassa U.
              </AppText>
            </View>

            <View className="mt-8">
              <AppText className="text-xs font-semibold tracking-[2px] text-slate-400 dark:text-slate-500">
                SELECT CAMPUS
              </AppText>
              <TouchableOpacity
                className="mt-3 flex-row items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950"
                accessibilityRole="button"
              >
                <Ionicons name="location" size={18} color={colors.mutedText} />
                <AppText className="flex-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Hawassa University
                </AppText>
                <Ionicons
                  name="chevron-down"
                  size={18}
                  color={colors.mutedText}
                />
              </TouchableOpacity>
            </View>

            <View className="mt-6">
              <AppText className="text-xs font-semibold tracking-[2px] text-slate-400 dark:text-slate-500">
                CONTACT INFO
              </AppText>
              <View className="mt-3 flex-row items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
                <Ionicons name="mail" size={18} color={colors.mutedText} />
                <TextInput
                  placeholder="Student email or phone"
                  placeholderTextColor={colors.mutedStrong}
                  className="flex-1 text-sm text-slate-900 dark:text-slate-100"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View className="mt-6">
              <AppText className="text-xs font-semibold tracking-[2px] text-slate-400 dark:text-slate-500">
                PASSWORD
              </AppText>
              <View className="mt-3 flex-row items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
                <Ionicons
                  name="lock-closed"
                  size={18}
                  color={colors.mutedText}
                />
                <TextInput
                  placeholder="Create a password"
                  placeholderTextColor={colors.mutedStrong}
                  className="flex-1 text-sm text-slate-900 dark:text-slate-100"
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={() => setShowPassword((prev) => !prev)}
                >
                  <Ionicons
                    name={showPassword ? "eye" : "eye-off"}
                    size={18}
                    color={colors.mutedText}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              className="mt-6 flex-row items-center gap-3"
              accessibilityRole="button"
              onPress={() => setAgreed((prev) => !prev)}
            >
              <View
                className={`h-5 w-5 items-center justify-center rounded-md border ${
                  agreed
                    ? "border-emerald-600 bg-emerald-600"
                    : "border-slate-300 dark:border-slate-700"
                }`}
              >
                {agreed ? (
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                ) : null}
              </View>
              <AppText className="flex-1 text-sm text-slate-500 dark:text-slate-400">
                I agree to the
                <AppText className="text-emerald-600 dark:text-emerald-400">
                  {" "}
                  campus rules{","}
                </AppText>{" "}
                terms of service, and privacy policy.
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              className="mt-8 h-12 items-center justify-center rounded-2xl bg-emerald-600"
              accessibilityRole="button"
            >
              <View className="flex-row items-center gap-2">
                <AppText className="text-base font-semibold text-white">
                  Continue
                </AppText>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            <View className="mt-6 flex-row items-center justify-center">
              <AppText className="text-sm text-slate-500 dark:text-slate-400">
                Already have an account?
              </AppText>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => router.push("/(auth)/login")}
              >
                <AppText className="ml-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  Log In
                </AppText>
              </TouchableOpacity>
            </View>

            <View className="mt-6 flex-row items-center gap-3">
              <View className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
              <AppText className="text-xs text-slate-400 dark:text-slate-500">
                Or continue with
              </AppText>
              <View className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            </View>

            <View className="mt-5 flex-row items-center justify-center gap-4">
              <TouchableOpacity
                className="h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"
                accessibilityRole="button"
              >
                <Ionicons name="logo-google" size={20} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity
                className="h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"
                accessibilityRole="button"
              >
                <Ionicons name="logo-apple" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
