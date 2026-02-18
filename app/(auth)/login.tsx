import { ScrollView, TextInput, TouchableOpacity, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { AppText } from "../../components/AppText";
import { useTheme } from "../../hooks/useTheme";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";

export default function LoginScreen() {
  const { colors, statusBarStyle } = useTheme();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setErrorMessage("Enter your email and password.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setIsLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.replace("/(tabs)/rants");
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <View className="flex-1 bg-slate-50 dark:bg-slate-950">
        <StatusBar style={statusBarStyle} />
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pb-10 pt-6"
          showsVerticalScrollIndicator={false}
        >
          <View className="overflow-hidden rounded-[32px] bg-white shadow-xl dark:bg-slate-900">
            <View className="h-2 bg-emerald-500" />

            <View className="px-6 pb-8 pt-10">
              <View className="items-center">
                <View className="h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-500/20">
                  <Ionicons name="school" size={28} color={colors.accent} />
                </View>
                <AppText className="mt-6 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  Welcome Back
                </AppText>
                <AppText className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
                  Glad to see you again at Hawassa U.
                </AppText>
              </View>

              <View className="mt-8">
                <AppText className="text-xs font-semibold tracking-[2px] text-slate-400 dark:text-slate-500">
                  ACCOUNT INFO
                </AppText>
                <View className="mt-3 flex-row items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
                  <Ionicons name="person" size={18} color={colors.mutedText} />
                  <TextInput
                    placeholder="Student email or phone"
                    placeholderTextColor={colors.mutedStrong}
                    className="flex-1 text-sm text-slate-900 dark:text-slate-100"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
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
                    placeholder="Enter password"
                    placeholderTextColor={colors.mutedStrong}
                    className="flex-1 text-sm text-slate-900 dark:text-slate-100"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
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
                <TouchableOpacity
                  className="mt-3 items-end"
                  accessibilityRole="button"
                >
                  <AppText className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    Forgot Password?
                  </AppText>
                </TouchableOpacity>
              </View>

              {errorMessage ? (
                <AppText className="mt-3 text-sm text-red-500">
                  {errorMessage}
                </AppText>
              ) : null}

              <TouchableOpacity
                onPress={handleLogin}
                className={`mt-8 h-12 items-center justify-center rounded-2xl bg-emerald-600 ${
                  isLoading ? "opacity-60" : ""
                }`}
                accessibilityRole="button"
                disabled={isLoading}
              >
                <AppText className="text-base font-semibold text-white">
                  {isLoading ? "Logging in..." : "Log In"}
                </AppText>
              </TouchableOpacity>

              <View className="mt-7 flex-row items-center gap-3">
                <View className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                <AppText className="text-xs font-semibold tracking-[2px] text-slate-400 dark:text-slate-500">
                  OR LOGIN WITH
                </AppText>
                <View className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
              </View>

              <View className="mt-5 flex-row items-center justify-center gap-4">
                <TouchableOpacity
                  className="h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950"
                  accessibilityRole="button"
                >
                  <Ionicons name="logo-google" size={20} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  className="h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950"
                  accessibilityRole="button"
                >
                  <Ionicons name="logo-apple" size={20} color={colors.text} />
                </TouchableOpacity>
              </View>

              <View className="mt-6 flex-row items-center justify-center">
                <AppText className="text-sm text-slate-500 dark:text-slate-400">
                  New here?
                </AppText>
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={() => router.push("/(auth)/register")}
                >
                  <AppText className="ml-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    Create account
                  </AppText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
