import React, { useEffect, useState } from "react";
import {
  Keyboard,
  Platform,
  Pressable,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import Feather from "@expo/vector-icons/Feather";
import { AppText } from "../../../components/AppText";
import { FetchErrorModal } from "../../../components/FetchErrorModal";
import { SkeletonBlock } from "../../../components/SkeletonBlock";
import { TopToast } from "../../../components/TopToast";
import { useTopToast } from "../../../hooks/useTopToast";
import { useTheme } from "../../../hooks/useTheme";
import { supabase } from "../../../lib/supabase";
import { useSupabase } from "../../../providers/SupabaseProvider";
import { SPOT_CATEGORIES } from "../../../constants/categories";
import * as Location from "expo-location";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

type SpotRow = {
  id: string;
  user_id: string | null;
  name: string;
  category: string | null;
  location: string | null;
  description: string | null;
  price_type: string | null;
};

const removePlusCode = (value: string) =>
  value
    .replace(/^[A-Z0-9]{3,}\+[A-Z0-9]{2,}[\.,]?\s*/i, "")
    .replace(/\s{2,}/g, " ")
    .trim();

const normalizePlaceFragment = (value: string | null | undefined) => {
  if (!value) return "";
  return removePlusCode(value)
    .replace(/\bregion\b/gi, "")
    .replace(/\bSidama\b/gi, "")
    .replace(/\bEthiopi(?:a)?\b/gi, "")
    .replace(/^,\s*|,\s*$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
};

const isGenericArea = (value: string) => {
  const normalized = value.toLowerCase().trim();
  return (
    normalized === "hawassa" ||
    normalized === "awassa" ||
    normalized === "sidama" ||
    normalized === "region hawassa"
  );
};

const isPostalOrCodeLike = (value: string) => {
  const normalized = value.trim();
  return (
    /^\d{3,}$/.test(normalized) ||
    /^[A-Z0-9]{3,}\+[A-Z0-9]{2,}$/i.test(normalized)
  );
};

const isUsefulAreaName = (value: string) => {
  const cleaned = normalizePlaceFragment(value);
  if (!cleaned) return false;
  if (isGenericArea(cleaned)) return false;
  if (isPostalOrCodeLike(cleaned)) return false;
  return true;
};

const extractPreferredArea = (
  place: Location.LocationGeocodedAddress | undefined,
) => {
  const geo = (place ?? {}) as Location.LocationGeocodedAddress & {
    neighborhood?: string;
    sublocality?: string;
    route?: string;
  };

  const candidates = [
    geo.neighborhood,
    geo.sublocality,
    geo.route,
    geo.district,
    geo.subregion,
    geo.street,
    geo.name,
  ];

  for (const candidate of candidates) {
    const cleaned = normalizePlaceFragment(candidate);
    if (cleaned && isUsefulAreaName(cleaned)) return cleaned;
  }

  return null;
};

export default function EditSpotScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { session } = useSupabase();
  const { colors } = useTheme();

  const [feeType, setFeeType] = useState<"free" | "paid">("free");
  const [name, setName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>(
    SPOT_CATEGORIES[0],
  );
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  const [requiresLandmarkHint, setRequiresLandmarkHint] = useState(false);
  const [landmarkInput, setLandmarkInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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

    const loadSpot = async () => {
      if (!id) return;

      setIsLoading(true);
      setFetchError(null);

      const { data, error } = await supabase
        .from("spots")
        .select(
          "id, user_id, name, category, location, description, price_type",
        )
        .eq("id", id)
        .maybeSingle();

      if (!isMounted) return;

      if (error) {
        setFetchError(error.message);
      } else if (!data) {
        setFetchError("Spot not found.");
      } else {
        const spot = data as SpotRow;
        if (session?.user?.id && spot.user_id !== session.user.id) {
          setFetchError("You do not have permission to edit this spot.");
        }
        setName(spot.name ?? "");
        setSelectedCategory(
          spot.category && SPOT_CATEGORIES.includes(spot.category as never)
            ? spot.category
            : SPOT_CATEGORIES[0],
        );
        setLocation(spot.location ?? "");
        setDescription(spot.description ?? "");
        setFeeType((spot.price_type ?? "free") === "paid" ? "paid" : "free");
      }

      setIsLoading(false);
    };

    loadSpot();

    return () => {
      isMounted = false;
    };
  }, [id, session?.user?.id, reloadKey]);

  // Spot edit map integration: resolve current location to a user-friendly area or request landmark fallback.
  const handleSelectCurrentLocation = async () => {
    setIsResolvingLocation(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        showToast("Location permission is required to select on map.", "error");
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
      const area = extractPreferredArea(place);

      if (area) {
        setLocation(
          `${area}, Hawassa (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`,
        );
        setRequiresLandmarkHint(false);
        setLandmarkInput("");
        showToast("Location selected successfully.", "success");
      } else {
        setLocation("");
        setRequiresLandmarkHint(true);
        showToast(
          "This place has no name. Please enter a nearby landmark.",
          "error",
        );
      }
    } catch {
      showToast("Unable to fetch your current location.", "error");
    } finally {
      setIsResolvingLocation(false);
    }
  };

  const handleLocationChange = (value: string) => {
    const cleaned = removePlusCode(value);
    setLocation(cleaned);

    if (cleaned.trim().length > 0 && !isGenericArea(cleaned)) {
      setRequiresLandmarkHint(false);
    }
  };

  const handleSave = async () => {
    if (!session?.user) {
      setErrorMessage("Please log in to update the spot.");
      return;
    }

    if (!id) {
      setErrorMessage("Missing spot id.");
      return;
    }

    if (!name.trim()) {
      setErrorMessage("Add a name for the spot.");
      return;
    }

    const cleanedLocation = removePlusCode(location).trim();
    const cleanedLandmark = removePlusCode(landmarkInput).trim();

    let locationToSave = cleanedLocation;
    if (requiresLandmarkHint) {
      if (!cleanedLandmark) {
        showToast(
          "This place has no name. Please enter a nearby landmark.",
          "error",
        );
        return;
      }

      locationToSave = `Near ${cleanedLandmark}, Hawassa`;
    } else if (isGenericArea(locationToSave)) {
      showToast("Please add a specific nearby place.", "error");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    const { error } = await supabase
      .from("spots")
      .update({
        name: name.trim(),
        category: selectedCategory,
        location: locationToSave || null,
        description: description.trim() || null,
        price_type: feeType,
      })
      .eq("id", id)
      .eq("user_id", session.user.id);

    setIsSaving(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">
      <View className="flex-1 bg-white dark:bg-slate-950">
        <TopToast
          visible={toast.visible}
          message={toast.message}
          variant={toast.variant}
        />
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <Pressable
            onPress={() => router.back()}
            className="flex-row items-center"
          >
            <Feather name="x" size={20} color={colors.mutedText} />
            <AppText className="ml-2 text-base text-slate-500 dark:text-slate-300">
              Cancel
            </AppText>
          </Pressable>

          <AppText className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Edit Spot
          </AppText>
          <View className="w-14" />
        </View>

        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1">
            <KeyboardAwareScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingTop: 20,
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
              {isLoading ? (
                <View className="gap-5">
                  <SkeletonBlock className="h-4 w-28 rounded-md" />
                  <SkeletonBlock className="h-12 w-full rounded-xl" />
                  <SkeletonBlock className="h-4 w-20 rounded-md" />
                  <View className="flex-row flex-wrap gap-2">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <SkeletonBlock
                        key={`spot-edit-category-${index}`}
                        className="h-8 w-20 rounded-full"
                      />
                    ))}
                  </View>
                  <SkeletonBlock className="h-12 w-full rounded-xl" />
                  <SkeletonBlock className="h-[110px] w-full rounded-xl" />
                </View>
              ) : (
                <>
                  <AppText className="mt-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Name of the spot
                  </AppText>
                  <View className="mt-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <TextInput
                      placeholder="e.g. Library Cafe"
                      placeholderTextColor={colors.mutedStrong}
                      className="text-sm text-slate-900 dark:text-slate-100"
                      value={name}
                      onChangeText={setName}
                      editable={!isLoading}
                    />
                  </View>

                  <AppText className="mt-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Category
                  </AppText>
                  <View className="mt-3 flex-row flex-wrap gap-2">
                    {SPOT_CATEGORIES.map((option) => (
                      <Pressable
                        key={option}
                        onPress={() => setSelectedCategory(option)}
                        className={`rounded-full border px-3 py-1.5 ${
                          option === selectedCategory
                            ? "border-green-600 bg-green-600"
                            : "border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900"
                        }`}
                      >
                        <AppText
                          className={`text-xs font-semibold ${
                            option === selectedCategory
                              ? "text-white"
                              : "text-slate-600 dark:text-slate-300"
                          }`}
                        >
                          {option}
                        </AppText>
                      </Pressable>
                    ))}
                  </View>

                  <AppText className="mt-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Where is it?
                  </AppText>
                  <View className="mt-2 flex-row items-center gap-3">
                    <View className="flex-1 flex-row items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                      <Ionicons
                        name="location-outline"
                        size={16}
                        color={colors.mutedText}
                      />
                      <TextInput
                        placeholder="e.g. Main Campus"
                        placeholderTextColor={colors.mutedStrong}
                        className="flex-1 text-sm text-slate-900 dark:text-slate-100"
                        value={location}
                        onChangeText={handleLocationChange}
                        editable={!isLoading}
                      />
                    </View>
                    <Pressable
                      onPress={() => void handleSelectCurrentLocation()}
                      disabled={isResolvingLocation || isLoading}
                      className="h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
                    >
                      <Ionicons name="map" size={18} color={colors.accent} />
                    </Pressable>
                  </View>

                  {requiresLandmarkHint ? (
                    <View className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 dark:border-amber-500/40 dark:bg-amber-900/20">
                      <AppText className="text-xs text-amber-700 dark:text-amber-300">
                        This place has no name. Please enter a nearby landmark.
                      </AppText>
                      <View className="mt-2 rounded-lg border border-amber-300 bg-white px-3 py-2 dark:border-amber-500/50 dark:bg-slate-900">
                        <TextInput
                          placeholder="e.g. Hawassa University Main Gate"
                          placeholderTextColor={colors.mutedStrong}
                          className="text-sm text-slate-900 dark:text-slate-100"
                          value={landmarkInput}
                          onChangeText={setLandmarkInput}
                          editable={!isLoading}
                        />
                      </View>
                    </View>
                  ) : null}

                  <AppText className="mt-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Fee
                  </AppText>
                  <View className="mt-2 flex-row rounded-xl bg-slate-100 p-1 dark:bg-slate-900">
                    <Pressable
                      onPress={() => setFeeType("free")}
                      className={`flex-1 items-center justify-center rounded-lg py-2.5 ${
                        feeType === "free" ? "bg-green-600" : "bg-transparent"
                      }`}
                    >
                      <AppText
                        className={`text-sm font-semibold ${
                          feeType === "free"
                            ? "text-white"
                            : "text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        Free
                      </AppText>
                    </Pressable>
                    <Pressable
                      onPress={() => setFeeType("paid")}
                      className={`flex-1 items-center justify-center rounded-lg py-2.5 ${
                        feeType === "paid"
                          ? "bg-white dark:bg-slate-950"
                          : "bg-transparent"
                      }`}
                    >
                      <AppText
                        className={`text-sm font-semibold ${
                          feeType === "paid"
                            ? "text-slate-900 dark:text-slate-100"
                            : "text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        Paid
                      </AppText>
                    </Pressable>
                  </View>

                  <View className="mt-6 flex-row items-center gap-2">
                    <AppText className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Spot Description
                    </AppText>
                    <AppText className="text-xs text-slate-400 dark:text-slate-500">
                      (optional)
                    </AppText>
                  </View>
                  <View className="mt-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <TextInput
                      placeholder="Tell students what makes this place special..."
                      placeholderTextColor={colors.mutedStrong}
                      className="min-h-[110px] text-sm text-slate-900 dark:text-slate-100"
                      multiline
                      textAlignVertical="top"
                      value={description}
                      onChangeText={setDescription}
                      editable
                    />
                  </View>
                </>
              )}

              {errorMessage ? (
                <AppText className="mt-4 text-sm text-red-500">
                  {errorMessage}
                </AppText>
              ) : null}
            </KeyboardAwareScrollView>

            <View
              className="border-t border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-950"
              style={{
                marginBottom: Platform.OS === "android" ? keyboardHeight : 0,
              }}
            >
              <Pressable
                onPress={handleSave}
                className={`flex-row items-center justify-center gap-2 rounded-xl bg-green-600 py-3 ${
                  isSaving ? "opacity-60" : ""
                }`}
                disabled={isSaving}
              >
                <AppText className="text-sm font-semibold text-white">
                  {isSaving ? "Saving..." : "Save Changes"}
                </AppText>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        </TouchableWithoutFeedback>

        <FetchErrorModal
          visible={Boolean(fetchError)}
          message={fetchError}
          onClose={() => setFetchError(null)}
          onRetry={() => setReloadKey((prev) => prev + 1)}
        />
      </View>
    </SafeAreaView>
  );
}
