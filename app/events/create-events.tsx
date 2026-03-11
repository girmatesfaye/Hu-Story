import React, { useEffect, useState } from "react";
import {
  Image,
  Modal,
  Platform,
  Pressable,
  TextInput,
  View,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { AppText } from "../../components/AppText";
import { FetchErrorModal } from "../../components/FetchErrorModal";
import { SkeletonBlock } from "../../components/SkeletonBlock";
import { TopToast } from "../../components/TopToast";
import { useTheme } from "../../hooks/useTheme";
import { useTopToast } from "../../hooks/useTopToast";
import Feather from "@expo/vector-icons/Feather";
import { supabase } from "../../lib/supabase";
import { useSupabase } from "../../providers/SupabaseProvider";

// Current merge keeps image-cover upload and keyboard-aware form behavior for event create/edit.
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { formatEventDateRange } from "../../lib/eventDateTime";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { trackSmartlookEvent } from "../../lib/smartlook";

type PickerTarget = "startDate" | "startTime" | "endDate" | "endTime";

const toIsoWithOffset = (value: Date) => {
  const pad = (num: number) => num.toString().padStart(2, "0");
  const year = value.getFullYear();
  const month = pad(value.getMonth() + 1);
  const day = pad(value.getDate());
  const hours = pad(value.getHours());
  const minutes = pad(value.getMinutes());
  const seconds = pad(value.getSeconds());
  const offsetMinutes = -value.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absMinutes = Math.abs(offsetMinutes);
  const offset = `${sign}${pad(Math.floor(absMinutes / 60))}:${pad(
    absMinutes % 60,
  )}`;

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offset}`;
};

const parseIsoToDate = (value: string | null) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const mergeDatePart = (base: Date | null, selected: Date) => {
  const merged = base ? new Date(base) : new Date();
  merged.setFullYear(
    selected.getFullYear(),
    selected.getMonth(),
    selected.getDate(),
  );
  return merged;
};

const mergeTimePart = (base: Date | null, selected: Date) => {
  const merged = base ? new Date(base) : new Date();
  merged.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
  return merged;
};

const formatPickerDate = (value: Date | null) => {
  if (!value) return "Select date";
  return value.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatPickerTime = (value: Date | null) => {
  if (!value) return "Select time";
  return value.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
};

const getPickerMode = (target: PickerTarget | null) =>
  target?.toLowerCase().includes("time") ? "time" : "date";

const getPickerDisplay = (target: PickerTarget | null) => {
  const mode = getPickerMode(target);
  if (Platform.OS !== "ios") return "default";
  return mode === "date" ? "inline" : "spinner";
};

const getPickerTitle = (target: PickerTarget | null) => {
  if (target === "startDate") return "Start Date";
  if (target === "startTime") return "Start Time";
  if (target === "endDate") return "End Date";
  if (target === "endTime") return "End Time";
  return "Date & time";
};

const getSuggestedEndDate = (startValue: Date) => {
  const suggested = new Date(startValue);
  suggested.setHours(suggested.getHours() + 1);
  return suggested;
};

export default function CreateEventScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { colors } = useTheme();
  const { session } = useSupabase();
  const isEditing = Boolean(id);
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [hostName, setHostName] = useState("");
  const [details, setDetails] = useState("");
  const [feeType, setFeeType] = useState<"free" | "paid">("free");
  const [feeAmount, setFeeAmount] = useState("");
  const [startAt, setStartAt] = useState<Date | null>(null);
  const [endAt, setEndAt] = useState<Date | null>(null);
  const [activePicker, setActivePicker] = useState<PickerTarget | null>(null);
  const [tagsText, setTagsText] = useState("");
  const [coverImageUri, setCoverImageUri] = useState<string | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [isLoadingEvent, setIsLoadingEvent] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const { toast, showToast } = useTopToast();

  useEffect(() => {
    if (Platform.OS !== "android") return;

    const showSub = Keyboard.addListener("keyboardDidShow", (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadEvent = async () => {
      if (!id) return;

      setIsLoadingEvent(true);
      setFetchError(null);

      const { data, error } = await supabase
        .from("events")
        .select(
          "title, description, start_at, end_at, location, host_name, fee_type, fee_amount, tags, cover_url",
        )
        .eq("id", id)
        .maybeSingle();

      if (!isMounted) return;

      if (error) {
        setFetchError(error.message);
        setIsLoadingEvent(false);
        return;
      }

      setTitle(data?.title ?? "");
      setDetails(data?.description ?? "");
      setLocation(data?.location ?? "");
      setHostName(data?.host_name ?? "");
      setFeeType((data?.fee_type as "free" | "paid") ?? "free");
      setFeeAmount(
        data?.fee_amount !== null && data?.fee_amount !== undefined
          ? String(data.fee_amount)
          : "",
      );
      setTagsText((data?.tags ?? []).join(", "));
      setStartAt(parseIsoToDate(data?.start_at ?? null));
      setEndAt(parseIsoToDate(data?.end_at ?? null));
      setCoverImageUrl(data?.cover_url ?? null);
      setIsLoadingEvent(false);
    };

    loadEvent();

    return () => {
      isMounted = false;
    };
  }, [id, reloadKey]);

  const handlePickCover = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showToast("Something went wrong. Please try again.", "error");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      aspect: [16, 9],
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setCoverImageUri(result.assets[0].uri);
    }
  };

  const uploadCoverImage = async () => {
    if (!coverImageUri || !session?.user) return null;

    setIsUploadingCover(true);
    try {
      const response = await fetch(coverImageUri);
      const arrayBuffer = await response.arrayBuffer();
      const fileData = new Uint8Array(arrayBuffer);
      const fileExt = coverImageUri.split(".").pop()?.split("?")[0] || "jpg";
      const filePath = `${session.user.id}/${Date.now()}.${fileExt}`;
      const contentType = `image/${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("event-covers")
        .upload(filePath, fileData, { contentType, upsert: false });

      if (uploadError) {
        showToast("Something went wrong. Please try again.", "error");
        return null;
      }

      const { data } = supabase.storage
        .from("event-covers")
        .getPublicUrl(filePath);
      const publicUrl = data.publicUrl;
      setCoverImageUrl(publicUrl);
      return publicUrl;
    } finally {
      setIsUploadingCover(false);
    }
  };

  // Safe map integration: request foreground location, reverse geocode, and fill the text location field.
  const handleSelectCurrentLocation = async () => {
    setIsResolvingLocation(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        showToast("Location permission is required to select on map.", "error");
        void trackSmartlookEvent("event_location_select_failed", {
          reason: "permission_denied",
        });
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = position.coords;
      const places = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      const place = places[0];

      const resolvedLocation =
        [place?.name, place?.street, place?.district, place?.city]
          .filter(Boolean)
          .join(", ") || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

      setLocation(resolvedLocation);
      showToast("Location selected successfully.", "success");
      void trackSmartlookEvent("event_location_selected", {
        has_reverse_geocode: Boolean(place),
      });
    } catch {
      showToast("Unable to fetch your current location.", "error");
      void trackSmartlookEvent("event_location_select_failed", {
        reason: "location_fetch_error",
      });
    } finally {
      setIsResolvingLocation(false);
    }
  };

  const getPickerValue = () => {
    if (activePicker === "startDate" || activePicker === "startTime") {
      return startAt ?? new Date();
    }
    if (activePicker === "endDate" || activePicker === "endTime") {
      return endAt ?? startAt ?? new Date();
    }
    return new Date();
  };

  const handlePickerChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    if (event.type === "dismissed") {
      setActivePicker(null);
      return;
    }

    if (!selectedDate || !activePicker) return;

    if (activePicker === "startDate") {
      setStartAt((current) => {
        const nextStart = mergeDatePart(current, selectedDate);
        setEndAt((currentEnd) => {
          if (!currentEnd) return getSuggestedEndDate(nextStart);
          if (currentEnd.getTime() < nextStart.getTime()) {
            return getSuggestedEndDate(nextStart);
          }
          return currentEnd;
        });
        return nextStart;
      });
    }

    if (activePicker === "startTime") {
      setStartAt((current) => {
        const nextStart = mergeTimePart(current, selectedDate);
        setEndAt((currentEnd) => {
          if (!currentEnd) return getSuggestedEndDate(nextStart);
          if (currentEnd.getTime() < nextStart.getTime()) {
            return getSuggestedEndDate(nextStart);
          }
          return currentEnd;
        });
        return nextStart;
      });
    }

    if (activePicker === "endDate") {
      setEndAt((current) => mergeDatePart(current, selectedDate));
    }

    if (activePicker === "endTime") {
      setEndAt((current) => mergeTimePart(current, selectedDate));
    }

    if (Platform.OS === "android") {
      setActivePicker(null);
    }
  };

  const handleSubmit = async () => {
    // Smartlook phase-1 integration: track event create/edit attempts and outcomes.
    void trackSmartlookEvent(
      isEditing ? "event_edit_attempt" : "event_create_attempt",
      {
        fee_type: feeType,
        has_cover: Boolean(coverImageUri || coverImageUrl),
      },
    );

    if (!session?.user) {
      showToast("Please fill all required fields.", "error");
      return;
    }

    if (!title.trim()) {
      showToast("Please fill all required fields.", "error");
      return;
    }

    if (feeType === "paid" && !feeAmount.trim()) {
      showToast("Please fill all required fields.", "error");
      return;
    }

    const parsedFee = feeAmount.trim() ? Number(feeAmount.trim()) : null;
    if (feeType === "paid" && (parsedFee === null || Number.isNaN(parsedFee))) {
      showToast("Please fill all required fields.", "error");
      return;
    }

    if (startAt && endAt && endAt.getTime() < startAt.getTime()) {
      showToast("Please fill all required fields.", "error");
      return;
    }

    const startAtValue = startAt ? toIsoWithOffset(startAt) : null;
    const endAtValue = endAt ? toIsoWithOffset(endAt) : null;

    setIsSubmitting(true);

    const coverUrl = coverImageUri ? await uploadCoverImage() : coverImageUrl;
    if (coverImageUri && !coverUrl) {
      setIsSubmitting(false);
      return;
    }

    const payload = {
      title: title.trim(),
      description: details.trim() || null,
      tags: tagsText
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      start_at: startAtValue,
      end_at: endAtValue,
      location: location.trim() || null,
      host_name: hostName.trim() || null,
      fee_type: feeType,
      fee_amount: feeType === "paid" ? parsedFee : null,
      cover_url: coverUrl,
    };

    const { error } = isEditing
      ? await supabase.from("events").update(payload).eq("id", id)
      : await supabase.from("events").insert({
          user_id: session.user.id,
          ...payload,
        });

    setIsSubmitting(false);

    if (error) {
      showToast("Something went wrong. Please try again.", "error");
      void trackSmartlookEvent(
        isEditing ? "event_edit_failed" : "event_create_failed",
        {
          fee_type: feeType,
        },
      );
      return;
    }

    void trackSmartlookEvent(
      isEditing ? "event_edit_success" : "event_create_success",
      {
        fee_type: feeType,
        has_cover: Boolean(coverUrl),
      },
    );
    showToast("Successfully created.", "success");
    setTimeout(() => {
      router.replace("/(tabs)/events");
    }, 700);
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">
      <View className="flex-1">
        <TopToast
          visible={toast.visible}
          message={toast.message}
          variant={toast.variant}
        />
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 bg-white dark:bg-slate-950">
            {/* Header */}
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
              <Pressable
                onPress={() => router.back()}
                className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 items-center justify-center"
              >
                <Feather name="arrow-left" size={24} color="black" />
              </Pressable>

              <AppText className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {isEditing ? "Edit Event" : "Create Event"}
              </AppText>
              <View className="w-14" />
            </View>
            {/* <ScrollView contentContainerClassName="px-5 pb-28 pt-5"> */}
            <KeyboardAwareScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{
                paddingBottom:
                  Platform.OS === "android" ? keyboardHeight + 170 : 170,
              }}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              enableOnAndroid
              enableAutomaticScroll
              enableResetScrollToCoords
              extraHeight={Platform.OS === "android" ? 140 : 80}
              extraScrollHeight={Platform.OS === "android" ? 40 : 20}
              keyboardOpeningTime={0}
            >
              <View className="px-5 pt-5">
                {isLoadingEvent && isEditing ? (
                  <View className="gap-5">
                    <SkeletonBlock className="h-40 w-full rounded-2xl" />
                    <SkeletonBlock className="h-12 w-full rounded-xl" />
                    <SkeletonBlock className="h-12 w-full rounded-xl" />
                    <SkeletonBlock className="h-12 w-full rounded-xl" />
                    <SkeletonBlock className="h-[160px] w-full rounded-xl" />
                  </View>
                ) : (
                  <>
                    <Pressable
                      onPress={handlePickCover}
                      className="h-40 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
                    >
                      {coverImageUri || coverImageUrl ? (
                        <Image
                          source={{
                            uri: coverImageUri ?? coverImageUrl ?? undefined,
                          }}
                          className="h-full w-full"
                          resizeMode="cover"
                        />
                      ) : (
                        <View className="items-center">
                          <View className="h-12 w-12 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800">
                            <Ionicons
                              name="image-outline"
                              size={22}
                              color={colors.mutedText}
                            />
                          </View>
                          <AppText className="mt-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                            {isUploadingCover
                              ? "Uploading..."
                              : "Add Event Cover"}
                          </AppText>
                        </View>
                      )}
                    </Pressable>

                    <AppText className="mt-6 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Event Title
                    </AppText>
                    <View className="mt-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                      <TextInput
                        placeholder="e.g., Graduation Party"
                        placeholderTextColor={colors.mutedStrong}
                        className="text-sm text-slate-900 dark:text-slate-100"
                        value={title}
                        onChangeText={setTitle}
                      />
                    </View>

                    <AppText className="mt-6 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      When
                    </AppText>
                    <View className="mt-2 gap-3">
                      <Pressable
                        onPress={() => setActivePicker("startDate")}
                        className="flex-row items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                      >
                        <Ionicons
                          name="calendar-outline"
                          size={18}
                          color={colors.mutedText}
                        />
                        <AppText className="flex-1 text-sm text-slate-900 dark:text-slate-100">
                          {formatPickerDate(startAt)}
                        </AppText>
                        <AppText className="text-xs text-slate-400 dark:text-slate-500">
                          Start Date
                        </AppText>
                      </Pressable>
                      <Pressable
                        onPress={() => setActivePicker("endDate")}
                        className="flex-row items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                      >
                        <Ionicons
                          name="calendar-outline"
                          size={18}
                          color={colors.mutedText}
                        />
                        <AppText className="flex-1 text-sm text-slate-900 dark:text-slate-100">
                          {formatPickerDate(endAt)}
                        </AppText>
                        <AppText className="text-xs text-slate-400 dark:text-slate-500">
                          End Date
                        </AppText>
                      </Pressable>
                      <View className="flex-row gap-3">
                        <Pressable
                          onPress={() => setActivePicker("startTime")}
                          className="flex-1 flex-row items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                        >
                          <Ionicons
                            name="time-outline"
                            size={18}
                            color={colors.mutedText}
                          />
                          <AppText className="flex-1 text-sm text-slate-900 dark:text-slate-100">
                            {formatPickerTime(startAt)}
                          </AppText>
                          <AppText className="text-xs text-slate-400 dark:text-slate-500">
                            Start Time
                          </AppText>
                        </Pressable>
                        <Pressable
                          onPress={() => setActivePicker("endTime")}
                          className="flex-1 flex-row items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                        >
                          <Ionicons
                            name="time-outline"
                            size={18}
                            color={colors.mutedText}
                          />
                          <AppText className="flex-1 text-sm text-slate-900 dark:text-slate-100">
                            {formatPickerTime(endAt)}
                          </AppText>
                          <AppText className="text-xs text-slate-400 dark:text-slate-500">
                            End Time
                          </AppText>
                        </Pressable>
                      </View>
                      <AppText className="text-xs text-slate-500 dark:text-slate-400">
                        {formatEventDateRange(
                          startAt ? toIsoWithOffset(startAt) : null,
                          endAt ? toIsoWithOffset(endAt) : null,
                          { fallback: "Select start date and time" },
                        )}
                      </AppText>
                    </View>

                    <View className="mt-6 flex-row items-center justify-between">
                      <AppText className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Where
                      </AppText>
                      <Pressable
                        className="flex-row items-center gap-2"
                        onPress={handleSelectCurrentLocation}
                        disabled={isResolvingLocation}
                      >
                        <Ionicons
                          name="map-outline"
                          size={14}
                          color={colors.accent}
                        />
                        <AppText className="text-xs font-semibold uppercase tracking-wider text-green-600 dark:text-green-400">
                          {isResolvingLocation
                            ? "Locating..."
                            : "Select on Map"}
                        </AppText>
                      </Pressable>
                    </View>
                    <View className="mt-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                      <TextInput
                        placeholder="e.g., Main Campus Hall"
                        placeholderTextColor={colors.mutedStrong}
                        className="text-sm text-slate-900 dark:text-slate-100"
                        value={location}
                        onChangeText={setLocation}
                      />
                    </View>

                    <View className="mt-3 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
                      <Image
                        source={{
                          uri: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80",
                        }}
                        className="h-[140px] w-full"
                        resizeMode="cover"
                      />
                      <View className="absolute inset-0 bg-white/40 dark:bg-slate-950/40" />
                      <View className="absolute inset-0 items-center justify-center">
                        <View className="flex-row items-center gap-2 rounded-full bg-white px-3 py-1.5 shadow dark:bg-slate-900">
                          <Ionicons
                            name="location"
                            size={14}
                            color={colors.accent}
                          />
                          <AppText className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                            {location || "Hawassa Main Campus"}
                          </AppText>
                        </View>
                      </View>
                      <View className="absolute bottom-3 right-3 items-center gap-1 rounded-lg bg-white px-2 py-1 shadow dark:bg-slate-900">
                        <Ionicons
                          name="add"
                          size={14}
                          color={colors.mutedText}
                        />
                        <View className="h-px w-4 bg-slate-200 dark:bg-slate-800" />
                        <Ionicons
                          name="remove"
                          size={14}
                          color={colors.mutedText}
                        />
                      </View>
                    </View>

                    <AppText className="mt-6 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Organizer
                    </AppText>
                    <View className="mt-2 flex-row items-center gap-3">
                      <View className="h-11 w-11 items-center justify-center rounded-full bg-green-100 dark:bg-green-400/20">
                        <Ionicons
                          name="person"
                          size={18}
                          color={colors.accent}
                        />
                      </View>
                      <View className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <TextInput
                          placeholder="Club or Individual Name"
                          placeholderTextColor={colors.mutedStrong}
                          className="text-sm text-slate-900 dark:text-slate-100"
                          value={hostName}
                          onChangeText={setHostName}
                        />
                      </View>
                    </View>

                    <AppText className="mt-6 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Entry Fee
                    </AppText>
                    <View className="mt-2 flex-row rounded-xl bg-slate-100 p-1 dark:bg-slate-900">
                      <Pressable
                        onPress={() => setFeeType("free")}
                        className="flex-1 items-center justify-center rounded-lg py-2.5"
                        style={{
                          backgroundColor:
                            feeType === "free" ? colors.card : "transparent",
                        }}
                      >
                        <AppText
                          className="text-sm font-semibold"
                          style={{
                            color:
                              feeType === "free"
                                ? colors.accent
                                : colors.mutedText,
                          }}
                        >
                          Free
                        </AppText>
                      </Pressable>
                      <Pressable
                        onPress={() => setFeeType("paid")}
                        className="flex-1 items-center justify-center rounded-lg py-2.5"
                        style={{
                          backgroundColor:
                            feeType === "paid" ? colors.card : "transparent",
                        }}
                      >
                        <AppText
                          className="text-sm font-semibold"
                          style={{
                            color:
                              feeType === "paid"
                                ? colors.accent
                                : colors.mutedText,
                          }}
                        >
                          Paid
                        </AppText>
                      </Pressable>
                    </View>

                    <View
                      className="mt-3 flex-row items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                      style={{ display: feeType === "paid" ? "flex" : "none" }}
                    >
                      <Ionicons
                        name="cash-outline"
                        size={18}
                        color={colors.mutedText}
                      />
                      <TextInput
                        placeholder="Entry fee amount (ETB)"
                        placeholderTextColor={colors.mutedStrong}
                        className="flex-1 text-sm text-slate-900 dark:text-slate-100"
                        keyboardType="numeric"
                        value={feeAmount}
                        onChangeText={setFeeAmount}
                      />
                    </View>

                    <View className="mt-6 flex-row items-center gap-2">
                      <AppText className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Details
                      </AppText>
                      <AppText className="text-xs text-slate-400 dark:text-slate-500">
                        (optional)
                      </AppText>
                    </View>
                    <View className="mt-4">
                      <AppText className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Tags
                      </AppText>
                      <View className="mt-2 flex-row items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <Ionicons
                          name="pricetag-outline"
                          size={18}
                          color={colors.mutedText}
                        />
                        <TextInput
                          placeholder="Add tags (comma separated)"
                          placeholderTextColor={colors.mutedStrong}
                          className="flex-1 text-sm text-slate-900 dark:text-slate-100"
                          value={tagsText}
                          onChangeText={setTagsText}
                        />
                      </View>
                    </View>
                    <View className="mt-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                      <TextInput
                        placeholder="Tell students what this event is about..."
                        placeholderTextColor={colors.mutedStrong}
                        className="text-sm text-slate-900 dark:text-slate-100"
                        multiline
                        scrollEnabled
                        blurOnSubmit={false}
                        textAlignVertical="top"
                        style={{
                          minHeight: 160,
                          maxHeight: 220,
                          paddingTop: 4,
                          paddingBottom: 20,
                        }}
                        value={details}
                        onChangeText={setDetails}
                      />
                    </View>
                  </>
                )}
              </View>
            </KeyboardAwareScrollView>

            <Modal
              visible={activePicker !== null}
              transparent
              animationType="slide"
              onRequestClose={() => setActivePicker(null)}
            >
              <View className="flex-1 justify-end bg-black/40">
                <Pressable
                  className="flex-1"
                  onPress={() => setActivePicker(null)}
                />
                <View className="rounded-t-3xl bg-white px-5 pb-8 pt-4 dark:bg-slate-900">
                  <View className="mb-3 flex-row items-center justify-between">
                    <Pressable onPress={() => setActivePicker(null)}>
                      <AppText className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                        Cancel
                      </AppText>
                    </Pressable>
                    <AppText className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {getPickerTitle(activePicker)}
                    </AppText>
                    <Pressable onPress={() => setActivePicker(null)}>
                      <AppText className="text-sm font-semibold text-green-600 dark:text-green-400">
                        Done
                      </AppText>
                    </Pressable>
                  </View>

                  <DateTimePicker
                    value={getPickerValue()}
                    mode={getPickerMode(activePicker)}
                    display={getPickerDisplay(activePicker)}
                    onChange={handlePickerChange}
                  />
                </View>
              </View>
            </Modal>

            <View
              className="border-t border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-950"
              style={{
                marginBottom: Platform.OS === "android" ? keyboardHeight : 0,
              }}
            >
              <Pressable
                onPress={handleSubmit}
                className={`flex-row items-center justify-center gap-2 rounded-xl bg-green-600 py-3 ${
                  isSubmitting ? "opacity-60" : ""
                }`}
                disabled={isSubmitting || (isEditing && isLoadingEvent)}
              >
                <AppText className="text-sm font-semibold text-white">
                  {isSubmitting
                    ? isEditing
                      ? "Saving..."
                      : "Posting..."
                    : isEditing
                      ? "Save Changes"
                      : "Post Event"}
                </AppText>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </Pressable>
            </View>

            <FetchErrorModal
              visible={Boolean(fetchError)}
              message={fetchError}
              onClose={() => setFetchError(null)}
              onRetry={() => setReloadKey((prev) => prev + 1)}
            />
          </View>
        </TouchableWithoutFeedback>
      </View>
    </SafeAreaView>
  );
}
