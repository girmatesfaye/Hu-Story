import React, { useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import Feather from "@expo/vector-icons/Feather";
import { AppText } from "../../components/AppText";
import { useTheme } from "../../hooks/useTheme";
import { supabase } from "../../lib/supabase";
import { useSupabase } from "../../providers/SupabaseProvider";
import * as ImagePicker from "expo-image-picker";

const categories = ["Cafe", "Library", "Hangout", "Study", "Food", "Other"];

export default function CreateSpotScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const { session } = useSupabase();
  const iconColors = {
    text: scheme === "dark" ? "#E5E7EB" : "#0F172A",
    muted: scheme === "dark" ? "#94A3B8" : "#64748B",
    accent: scheme === "dark" ? "#4ADE80" : "#16A34A",
    chipText: scheme === "dark" ? "#0B0B0B" : "#FFFFFF",
  };
  const { colors } = useTheme();
  const [feeType, setFeeType] = useState<"free" | "paid">("free");
  const [name, setName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      setErrorMessage("Permission needed to select images.");
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
          setErrorMessage(uploadError.message);
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

  const handleSubmit = async () => {
    if (!session?.user) {
      setErrorMessage("Please log in to submit a spot.");
      return;
    }

    if (!name.trim()) {
      setErrorMessage("Add a name for the spot.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

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
        cover_url: coverUrl,
      })
      .select("id")
      .single();

    if (spotError || !spotRow) {
      setIsSubmitting(false);
      setErrorMessage(spotError?.message ?? "Unable to create spot.");
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
        setErrorMessage(imagesError.message);
      }
    }

    setIsSubmitting(false);

    router.replace("/(tabs)/spots");
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">
      <View className="flex-1 bg-white dark:bg-slate-950">
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
            Add New Spot
          </AppText>
          <View className="w-14" />
        </View>

        <ScrollView contentContainerClassName="px-5 pb-32 pt-5">
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
                  <Ionicons name="camera" size={22} color={colors.mutedText} />
                </View>
                <AppText className="mt-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  {isUploadingImages ? "Uploading..." : "Tap to upload images"}
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
          <Pressable className="mt-2 flex-row items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <AppText className="text-sm text-slate-900 dark:text-slate-100">
              Select a category
            </AppText>
            <Ionicons name="chevron-down" size={18} color={colors.mutedText} />
          </Pressable>

          <View className="mt-3 flex-row flex-wrap gap-2">
            {categories.map((option) => (
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
            <Pressable className="h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <Ionicons name="map" size={18} color={colors.accent} />
            </Pressable>
          </View>

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
            />
          </View>

          {errorMessage ? (
            <AppText className="mt-4 text-sm text-red-500">
              {errorMessage}
            </AppText>
          ) : null}
        </ScrollView>

        <View className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-950">
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
