import { useEffect, useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "./AppText";
import {
  getBootDiagnosticsState,
  isBootDiagnosticsEnabled,
  subscribeBootDiagnostics,
} from "../lib/bootDiagnostics";

export function BootDebugOverlay() {
  const insets = useSafeAreaInsets();
  const [snapshot, setSnapshot] = useState(getBootDiagnosticsState());

  useEffect(() => {
    return subscribeBootDiagnostics(setSnapshot);
  }, []);

  if (!isBootDiagnosticsEnabled()) return null;

  const recentEvents = snapshot.events.slice(-5).join("\n");

  return (
    <View
      pointerEvents="none"
      style={{ top: insets.top + 8 }}
      className="absolute left-3 right-3 z-50 rounded-xl border border-emerald-300 bg-emerald-50/95 px-3 py-2 dark:border-emerald-700 dark:bg-slate-900/95"
    >
      <AppText className="text-[10px] font-semibold uppercase tracking-[1px] text-emerald-800 dark:text-emerald-300">
        Boot Debug
      </AppText>
      <AppText className="mt-1 text-[11px] text-slate-800 dark:text-slate-200">
        stage={snapshot.stage} appReady={String(snapshot.appReady)} authLoading=
        {String(snapshot.authLoading)}
      </AppText>
      <AppText className="text-[11px] text-slate-800 dark:text-slate-200">
        hasSession={String(snapshot.hasSession)} env=
        {String(snapshot.hasSupabaseEnv)} route={snapshot.routePath ?? "(none)"}
      </AppText>
      <AppText className="text-[11px] text-slate-800 dark:text-slate-200">
        target={snapshot.routeTarget ?? "(none)"}
      </AppText>
      {snapshot.errorMessage ? (
        <AppText className="mt-1 text-[11px] text-red-700 dark:text-red-400">
          error[{snapshot.errorSource ?? "unknown"}]: {snapshot.errorMessage}
        </AppText>
      ) : null}
      <AppText
        className="mt-1 text-[10px] text-slate-600 dark:text-slate-400"
        numberOfLines={5}
      >
        {recentEvents || "No boot events yet"}
      </AppText>
    </View>
  );
}
