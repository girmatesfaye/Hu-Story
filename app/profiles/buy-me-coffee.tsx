import React from "react";
import { Linking, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { AppText } from "../../components/AppText";
import { useTheme } from "../../hooks/useTheme";

const buyMeCoffeeUrl = "https://gurshaplus.com/girmatesfaye";

export default function BuyMeCoffeeScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const openBuyMeCoffee = async () => {
    await Linking.openURL(buyMeCoffeeUrl);
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
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </Pressable>
          <AppText className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Buy Me Coffee
          </AppText>
          <View className="h-10 w-10" />
        </View>

        <ScrollView contentContainerClassName="px-5 pb-24 pt-4">
          <View className="rounded-3xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-500/30 dark:bg-amber-900/20">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-white dark:bg-slate-900">
              <Ionicons name="cafe-outline" size={22} color={colors.accent} />
            </View>
            <AppText className="mt-4 text-xl font-semibold text-slate-900 dark:text-slate-100">
              Support My Work
            </AppText>
            <AppText className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              If this app has been helpful, you can support future updates and
              maintenance with a small coffee.
            </AppText>

            <Pressable
              accessibilityRole="button"
              onPress={openBuyMeCoffee}
              className="mt-6 flex-row items-center justify-center gap-2 rounded-2xl bg-green-600 py-3"
            >
              <Ionicons name="open-outline" size={18} color="#FFFFFF" />
              <AppText className="text-base font-semibold text-white">
                Open Buy Me Coffee
              </AppText>
            </Pressable>
          </View>

          {/* <View className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <AppText className="text-xs font-semibold tracking-[2px] text-slate-400 dark:text-slate-500">
              LINK
            </AppText>
            <AppText className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {buyMeCoffeeUrl}
            </AppText>
          </View> */}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
