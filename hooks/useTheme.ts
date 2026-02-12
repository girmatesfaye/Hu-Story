import { useColorScheme } from "react-native";

const lightColors = {
  background: "#FFFFFF",
  text: "#0F172A",
  surface: "#F8FAFC",
  card: "#FFFFFF",
  tabActive: "#0E9715",
  tabInactive: "#9CA3AF",
  accent: "#16A34A",
  headerBackground: "#FFFFFF",
  headerText: "#0F172A",
  border: "#E2E8F0",
  mutedText: "#64748B",
  mutedStrong: "#94A3B8",
  chipInactiveBg: "#F1F5F9",
  chipInactiveText: "#475569",
  chipActiveText: "#FFFFFF",
  overlay: "rgba(0, 0, 0, 0.4)",
};

const darkColors = {
  background: "#0B0B0B",
  text: "#E5E7EB",
  surface: "#0F172A",
  card: "#111827",
  tabActive: "#4ADE80",
  tabInactive: "#64748B",
  accent: "#4ADE80",
  headerBackground: "#0B0B0B",
  headerText: "#E5E7EB",
  border: "#1F2937",
  mutedText: "#94A3B8",
  mutedStrong: "#64748B",
  chipInactiveBg: "#111827",
  chipInactiveText: "#CBD5F5",
  chipActiveText: "#0B0B0B",
  overlay: "rgba(0, 0, 0, 0.65)",
};

type ThemeColors = typeof lightColors;

type Theme = {
  isDark: boolean;
  colors: ThemeColors;
  overlayColor: string;
  statusBarStyle: "light" | "dark";
};

export function useTheme(): Theme {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? darkColors : lightColors;

  return {
    isDark,
    colors,
    overlayColor: colors.overlay,
    statusBarStyle: isDark ? "light" : "dark",
  };
}
