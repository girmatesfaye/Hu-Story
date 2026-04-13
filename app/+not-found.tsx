import { Redirect, usePathname } from "expo-router";
import { View } from "react-native";
import { AppText } from "../components/AppText";

export default function NotFoundScreen() {
  const pathname = usePathname();

  if (!pathname || pathname === "/" || pathname === "/index") {
    return <Redirect href="/splash" />;
  }

  return (
    <View className="flex-1 items-center justify-center bg-slate-50 px-6 dark:bg-slate-950">
      <AppText className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        Page not found
      </AppText>
      <AppText className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
        Unable to open {pathname}. Returning to the app home should fix it.
      </AppText>
    </View>
  );
}
