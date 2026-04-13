import { Platform } from "react-native";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { isRunningInExpoGo } from "expo";

type NotificationsModule = typeof import("expo-notifications");
type NotificationResponseLike = {
  notification?: {
    request?: {
      content?: {
        data?: Record<string, unknown>;
      };
    };
  };
};

let notificationsModulePromise: Promise<NotificationsModule | null> | null =
  null;
let notificationHandlerConfigured = false;

const getProjectId = () => {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    undefined
  );
};

const isExpoGo = () =>
  isRunningInExpoGo() ||
  Constants.appOwnership === "expo" ||
  Constants.executionEnvironment === "storeClient";

export const canUseRemotePushNotifications = () =>
  !isExpoGo() && Device.isDevice;

async function getNotificationsModule() {
  if (!canUseRemotePushNotifications()) return null;

  if (!notificationsModulePromise) {
    notificationsModulePromise = import("expo-notifications").catch(() => null);
  }

  return notificationsModulePromise;
}

async function ensureNotificationHandler() {
  const Notifications = await getNotificationsModule();
  if (!Notifications || notificationHandlerConfigured) return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  notificationHandlerConfigured = true;
}

export async function registerForPushNotificationsAsync() {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return null;

  await ensureNotificationHandler();

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
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;

  const safeCount = Math.max(unreadCount, 0);
  try {
    await Notifications.setBadgeCountAsync(safeCount);
  } catch {
    // Ignore unsupported badge APIs in limited runtimes.
  }
}

type NotificationTargetInput = {
  route?: string | null;
  deep_link?: string | null;
  target_type?: string | null;
  target_id?: string | null;
};

export async function subscribeToNotificationResponses(
  onResponse: (response: NotificationResponseLike | null) => void,
) {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return () => undefined;

  await ensureNotificationHandler();

  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      onResponse(response as NotificationResponseLike);
    },
  );

  void Notifications.getLastNotificationResponseAsync().then((response) => {
    onResponse(response as NotificationResponseLike | null);
  });

  return () => {
    subscription.remove();
  };
}

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
