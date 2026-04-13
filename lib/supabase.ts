import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";
import {
  captureBootError,
  markBootStage,
  patchBootState,
} from "./bootDiagnostics";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey);
export const SUPABASE_CONFIG_ERROR_MESSAGE =
  "This build is missing Supabase config. Rebuild with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.";

patchBootState(
  {
    hasSupabaseEnv,
  },
  "SUPABASE_ENV_CHECK",
);
markBootStage("SUPABASE_CLIENT_INIT", {
  hasSupabaseEnv,
  platform: Platform.OS,
});

if (!hasSupabaseEnv) {
  console.warn(SUPABASE_CONFIG_ERROR_MESSAGE);
  captureBootError("supabase.env", SUPABASE_CONFIG_ERROR_MESSAGE);
}

const isServerRender = typeof window === "undefined";
const isWeb = Platform.OS === "web";

// Expo web static rendering runs in Node (no window). Disable persisted auth there.
const authConfig = isWeb
  ? {
      autoRefreshToken: !isServerRender,
      persistSession: !isServerRender,
      detectSessionInUrl: false,
    }
  : {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    };

const fallbackSupabaseUrl = "https://example.invalid";
const fallbackSupabaseAnonKey = "public-anon-key";

export const supabase = createClient(
  hasSupabaseEnv ? supabaseUrl : fallbackSupabaseUrl,
  hasSupabaseEnv ? supabaseAnonKey : fallbackSupabaseAnonKey,
  {
    auth: authConfig,
  },
);
