import React, { useEffect, useState } from "react";
import {
  Image,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import Feather from "@expo/vector-icons/Feather";
import { AppText } from "../../components/AppText";
import { TopToast } from "../../components/TopToast";
import { useTheme } from "../../hooks/useTheme";
import { useTopToast } from "../../hooks/useTopToast";
import { supabase } from "../../lib/supabase";
import { useSupabase } from "../../providers/SupabaseProvider";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SPOT_CATEGORIES } from "../../constants/categories";
import { trackSmartlookEvent } from "../../lib/smartlook";
const HAWASSA_REGION_LABEL = "Hawassa, Sidama, Ethiopia";

// Region guard: normalize resolved addresses to Hawassa/Sidama/Ethiopia for consistent location data.
const resolveHawassaLabel = (
  place: Location.LocationGeocodedAddress | undefined,
  latitude: number,
  longitude: number,
) => {
  const country = place?.country?.toLowerCase() ?? "";
  const region = (place?.region ?? "").toLowerCase();
  const city = (place?.city ?? "").toLowerCase();
  const district = (place?.district ?? "").toLowerCase();

  const isEthiopia = country.includes("ethiopia");
  const isSidama = region.includes("sidama");
  const isHawassa = city.includes("hawassa") || district.includes("hawassa");
  const isInTargetRegion = isEthiopia && (isSidama || isHawassa);

  if (!isInTargetRegion) {
    return {
      label: `${HAWASSA_REGION_LABEL} (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`,
      isInTargetRegion,
    };
  }

  const labelParts = [
    place?.name,
    place?.street,
    "Hawassa",
    "Sidama",
    "Ethiopia",
  ]
    .filter(Boolean)
    .filter((value, index, array) => array.indexOf(value) === index);

  return {
    label: labelParts.join(", "),
    isInTargetRegion,
  };
};

export default function CreateSpotScreen() {
  const router = useRouter();
  const { session } = useSupabase();
  const { colors } = useTheme();
  const [feeType, setFeeType] = useState<"free" | "paid">("free");
  const [priceAmount, setPriceAmount] = useState("");
  const [name, setName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>(
    SPOT_CATEGORIES[0],
  );
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionHeight, setDescriptionHeight] = useState(140);
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
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

  const handlePickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showToast("Something went wrong. Please try again.", "error");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: 5,
    });

    if (!result.canceled && result.assets?.length) {
      const uris = result.assets
        .map((asset) => asset.uri)
        .filter((uri): uri is string => Boolean(uri));
      if (uris.length > 0) {
        setImageUris(uris);
      }
    }
  };

  const getImageContentType = (fileExt: string) => {
    const normalized = fileExt.toLowerCase();
    if (normalized === "jpg" || normalized === "jpeg") return "image/jpeg";
    if (normalized === "png") return "image/png";
    if (normalized === "webp") return "image/webp";
    return `image/${normalized}`;
  };

  const uploadSpotImages = async (): Promise<string[] | null> => {
    if (!session?.user || imageUris.length === 0) {
      return [] as string[];
    }

    setIsUploadingImages(true);
    try {
      const uploadedUrls: string[] = [];

      for (const [index, uri] of imageUris.entries()) {
        const response = await fetch(uri);
        const arrayBuffer = await response.arrayBuffer();
        const fileData = new Uint8Array(arrayBuffer);
        const fileExt = uri.split(".").pop()?.split("?")[0] || "jpg";
        const filePath = `${session.user.id}/${Date.now()}-${index}.${fileExt}`;
        const contentType = getImageContentType(fileExt);

        const { error: uploadError } = await supabase.storage
          .from("spot-images")
          .upload(filePath, fileData, { contentType, upsert: false });

        if (uploadError) {
          showToast("Something went wrong. Please try again.", "error");
          return null;
        }

        const { data } = supabase.storage
          .from("spot-images")
          .getPublicUrl(filePath);
        uploadedUrls.push(data.publicUrl);
      }

      return uploadedUrls;
    } finally {
      setIsUploadingImages(false);
    }
  };

  // Safe map integration: resolve current GPS location and populate the spot location input.
  const handleSelectCurrentLocation = async () => {
    setIsResolvingLocation(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        showToast("Location permission is required to select on map.", "error");
        void trackSmartlookEvent("spot_location_select_failed", {
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

      const { label, isInTargetRegion } = resolveHawassaLabel(
        place,
        latitude,
        longitude,
      );

      setLocation(label);
      showToast(
        isInTargetRegion
          ? "Location selected successfully."
          : "Outside Hawassa area. Saved as Hawassa, Sidama, Ethiopia.",
        isInTargetRegion ? "success" : "error",
      );
      void trackSmartlookEvent("spot_location_selected", {
        has_reverse_geocode: Boolean(place),
        in_target_region: isInTargetRegion,
      });
    } catch {
      showToast("Unable to fetch your current location.", "error");
      void trackSmartlookEvent("spot_location_select_failed", {
        reason: "location_fetch_error",
      });
    } finally {
      setIsResolvingLocation(false);
    }
  };

  const handleSubmit = async () => {
    // Smartlook phase-1 integration: track spot creation attempts and outcomes.
    void trackSmartlookEvent("spot_create_attempt", {
      category: selectedCategory,
      fee_type: feeType,
      image_count: imageUris.length,
    });

    if (!session?.user) {
      showToast("Please fill all required fields.", "error");
      return;
    }

    if (!name.trim()) {
      showToast("Please fill all required fields.", "error");
      return;
    }

    if (feeType === "paid" && !priceAmount.trim()) {
      showToast("Please fill all required fields.", "error");
      return;
    }

    const parsedPrice = priceAmount.trim() ? Number(priceAmount.trim()) : null;
    if (
      feeType === "paid" &&
      (parsedPrice === null || Number.isNaN(parsedPrice))
    ) {
      showToast("Please fill all required fields.", "error");
      return;
    }

    setIsSubmitting(true);

    const uploadedUrls = await uploadSpotImages();
    if (!uploadedUrls) {
      setIsSubmitting(false);
      return;
    }
    const coverUrl = uploadedUrls[0] ?? null;

    const { data: spotRow, error: spotError } = await supabase
      .from("spots")
      .insert({
        user_id: session.user.id,
        name: name.trim(),
        category: selectedCategory,
        location: location.trim() || null,
        description: description.trim() || null,
        price_type: feeType,
        price_amount: feeType === "paid" ? parsedPrice : null,
        cover_url: coverUrl,
      })
      .select("id")
      .single();

    if (spotError || !spotRow) {
      setIsSubmitting(false);
      showToast("Something went wrong. Please try again.", "error");
      void trackSmartlookEvent("spot_create_failed", {
        category: selectedCategory,
        fee_type: feeType,
      });
      return;
    }

    const extraUrls = uploadedUrls.slice(1);
    if (extraUrls.length > 0) {
      const rows = extraUrls.map((url, index) => ({
        spot_id: spotRow.id,
        user_id: session.user.id,
        image_url: url,
        position: index + 1,
      }));
      const { error: imagesError } = await supabase
        .from("spot_images")
        .insert(rows);
      if (imagesError) {
        showToast("Something went wrong. Please try again.", "error");
      }
    }

    setIsSubmitting(false);
    void trackSmartlookEvent("spot_create_success", {
      category: selectedCategory,
      fee_type: feeType,
      image_count: uploadedUrls.length,
    });
    showToast("Successfully created.", "success");
    setTimeout(() => {
      router.replace("/(tabs)/spots");
    }, 700);
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
            <Feather name="arrow-left" size={24} color={colors.text} />
          </Pressable>
          <AppText className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Add New Spot
          </AppText>
          <View className="w-14" />
        </View>

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
          extraScrollHeight={Platform.OS === "android" ? 56 : 24}
          keyboardOpeningTime={0}
        >
          <View className="px-5 pt-5">
            <Pressable
              onPress={handlePickImages}
              className="h-40 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
            >
              {imageUris.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerClassName="px-3 gap-3"
                >
                  {imageUris.map((uri) => (
                    <Image
                      key={uri}
                      source={{ uri }}
                      className="h-28 w-36 rounded-xl"
                      resizeMode="cover"
                    />
                  ))}
                </ScrollView>
              ) : (
                <View className="items-center">
                  <View className="h-12 w-12 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800">
                    <Ionicons
                      name="camera"
                      size={22}
                      color={colors.mutedText}
                    />
                  </View>
                  <AppText className="mt-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                    {isUploadingImages
                      ? "Uploading..."
                      : "Tap to upload images"}
                  </AppText>
                  <AppText className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                    JPG, PNG (Max 5MB)
                  </AppText>
                </View>
              )}
            </Pressable>

            <AppText className="mt-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Name of the spot
            </AppText>
            <View className="mt-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <TextInput
                placeholder="e.g. Library Cafe"
                placeholderTextColor={colors.mutedStrong}
                className="text-sm text-slate-900 dark:text-slate-100"
                value={name}
                onChangeText={setName}
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
                  onChangeText={setLocation}
                />
              </View>
              <Pressable
                className="h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
                onPress={handleSelectCurrentLocation}
                disabled={isResolvingLocation}
              >
                <Ionicons name="map" size={18} color={colors.accent} />
              </Pressable>
            </View>
            {isResolvingLocation ? (
              <AppText className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                Fetching in Hawassa, Sidama, Ethiopia...
              </AppText>
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

            <View
              className="mt-3 flex-row items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              style={{ display: feeType === "paid" ? "flex" : "none" }}
            >
              <Ionicons
                name="pricetag-outline"
                size={16}
                color={colors.mutedText}
              />
              <TextInput
                placeholder="Enter price"
                placeholderTextColor={colors.mutedStrong}
                className="flex-1 text-sm text-slate-900 dark:text-slate-100"
                keyboardType="numeric"
                value={priceAmount}
                onChangeText={setPriceAmount}
              />
              <AppText className="text-xs text-slate-400 dark:text-slate-500">
                ETB
              </AppText>
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
                className="text-sm text-slate-900 dark:text-slate-100"
                multiline
                scrollEnabled={false}
                blurOnSubmit={false}
                textAlignVertical="top"
                style={{
                  minHeight: 140,
                  height: Math.max(140, descriptionHeight),
                  paddingTop: 4,
                  paddingBottom: 20,
                }}
                value={description}
                onChangeText={setDescription}
                onContentSizeChange={(event) => {
                  const nextHeight = Math.max(
                    140,
                    Math.ceil(event.nativeEvent.contentSize.height),
                  );
                  if (Math.abs(nextHeight - descriptionHeight) > 2) {
                    setDescriptionHeight(nextHeight);
                  }
                }}
              />
            </View>
          </View>
        </KeyboardAwareScrollView>

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
            disabled={isSubmitting}
          >
            <AppText className="text-sm font-semibold text-white">
              {isSubmitting ? "Submitting..." : "Submit Spot"}
            </AppText>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
