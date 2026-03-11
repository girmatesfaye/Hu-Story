import { Platform } from "react-native";
import Smartlook, { Properties } from "react-native-smartlook-analytics";

// Smartlook phase-1 integration: centralize SDK setup and safe tracking helpers.
const SMARTLOOK_PROJECT_KEY =
  process.env.EXPO_PUBLIC_SMARTLOOK_PROJECT_KEY?.trim() ?? "";

let isInitialized = false;
let lastTrackedScreen: string | null = null;

const isSmartlookAvailable =
  Platform.OS !== "web" && Boolean(SMARTLOOK_PROJECT_KEY);

const ensureInitialized = async () => {
  if (!isSmartlookAvailable) return false;
  if (isInitialized) return true;

  try {
    await Smartlook.instance.preferences.setProjectKey(SMARTLOOK_PROJECT_KEY);
    await Smartlook.instance.preferences.setAdaptiveFrameRateEnabled(false);
    await Smartlook.instance.start();
    isInitialized = true;
    return true;
  } catch (error) {
    console.warn("Smartlook initialization failed", error);
    return false;
  }
};

export const initSmartlook = async () => {
  const ready = await ensureInitialized();
  if (!ready) return;

  await trackSmartlookEvent("app_start");
};

export const identifySmartlookUser = async (user: {
  id?: string | null;
  email?: string | null;
}) => {
  const ready = await ensureInitialized();
  if (!ready) return;

  if (!user.id) {
    await Smartlook.instance.user.openNewUser();
    return;
  }

  await Smartlook.instance.user.setIdentifier(user.id);
  if (user.email) {
    await Smartlook.instance.user.setEmail(user.email);
  }
};

export const trackSmartlookScreen = async (pathname: string | null) => {
  const ready = await ensureInitialized();
  if (!ready) return;

  const screenName = pathname && pathname.length > 0 ? pathname : "/";
  if (lastTrackedScreen === screenName) return;

  if (lastTrackedScreen) {
    await Smartlook.instance.analytics.trackNavigationExit(lastTrackedScreen);
  }

  await Smartlook.instance.analytics.trackNavigationEnter(screenName);
  lastTrackedScreen = screenName;
};

export const trackSmartlookEvent = async (
  eventName: string,
  props?: Record<string, string | number | boolean | null | undefined>,
) => {
  const ready = await ensureInitialized();
  if (!ready) return;

  if (!props) {
    await Smartlook.instance.analytics.trackEvent(eventName);
    return;
  }

  const properties = new Properties();
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null) continue;
    properties.putString(key, String(value));
  }

  await Smartlook.instance.analytics.trackEvent(eventName, properties);
};
