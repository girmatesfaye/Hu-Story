import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const getProjectId = () => {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    undefined
  );
};

export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) return null;

  const existingPermissions = await Notifications.getPermissionsAsync();
  let finalStatus = existingPermissions.status;

  if (finalStatus !== "granted") {
    const requestedPermissions = await Notifications.requestPermissionsAsync();
    finalStatus = requestedPermissions.status;
  }

  if (finalStatus !== "granted") {
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#16A34A",
    });
  }

  const projectId = getProjectId();
  if (!projectId) {
    // In dev/bare-like environments projectId may be unavailable.
    return null;
  }

  let tokenResponse;
  try {
    tokenResponse = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
  } catch {
    return null;
  }

  return tokenResponse.data;
}

export async function syncAppBadgeCount(unreadCount: number) {
  const safeCount = Math.max(unreadCount, 0);
  await Notifications.setBadgeCountAsync(safeCount);
}

type NotificationTargetInput = {
  route?: string | null;
  deep_link?: string | null;
  target_type?: string | null;
  target_id?: string | null;
};

export function getRouteFromNotificationTarget(
  input?: NotificationTargetInput | null,
) {
  if (!input) return null;

  const directRoute = input.route?.trim();
  if (directRoute) return directRoute;

  const deepLink = input.deep_link?.trim();
  if (deepLink) {
    if (deepLink.startsWith("/")) return deepLink;

    const schemeIndex = deepLink.indexOf("://");
    if (schemeIndex >= 0) {
      const path = deepLink.slice(schemeIndex + 3);
      return path.startsWith("/") ? path : `/${path}`;
    }

    return `/${deepLink.replace(/^\/+/, "")}`;
  }

  const targetId = input.target_id?.trim();
  if (!targetId) return null;

  const targetType = (input.target_type ?? "").toLowerCase();
  if (targetType === "rants") return `/rants/${targetId}`;
  if (targetType === "events") return `/events/${targetId}`;
  if (targetType === "spots") return `/spots/${targetId}`;
  if (targetType === "projects") return `/projects/${targetId}`;

  return null;
}
