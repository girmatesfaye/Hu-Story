import React, { useState, useRef } from "react";
import { Image, Pressable, ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { AppText } from "../../components/AppText";
import { useTheme } from "../../hooks/useTheme";
import Feather from "@expo/vector-icons/Feather";
import { supabase } from "../../lib/supabase";
import { useSupabase } from "../../providers/SupabaseProvider";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { MarkerDragStartEndEvent } from 'react-native-maps';

export default function CreateEventScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { session } = useSupabase();
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [hostName, setHostName] = useState("");
  const [details, setDetails] = useState("");
  const [feeType, setFeeType] = useState<"free" | "paid">("free");
  const [feeAmount, setFeeAmount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [markerCoord, setMarkerCoord] = useState({
    latitude: 7.0504,
    longitude: 38.4768,
  });

  const mapRef = useRef<MapView>(null);

  const parseDateTime = (datePart: string, timePartRaw: string) => {
    const dateTrimmed = datePart.trim();
    const timeTrimmed = timePartRaw.trim();
    if (!dateTrimmed || !timeTrimmed) return null;

    const timePart =
      timeTrimmed.length === 5 ? `${timeTrimmed}:00` : timeTrimmed;
    const normalized = `${dateTrimmed}T${timePart}`;
    const parsed = new Date(normalized);

    if (Number.isNaN(parsed.getTime())) return "INVALID";

    const pad = (num: number) => num.toString().padStart(2, "0");
    const offsetMinutes = -parsed.getTimezoneOffset();
    const sign = offsetMinutes >= 0 ? "+" : "-";
    const absMinutes = Math.abs(offsetMinutes);
    const offset = `${sign}${pad(Math.floor(absMinutes / 60))}:${pad(
      absMinutes % 60,
    )}`;

    return `${dateTrimmed}T${timePart}${offset}`;
  };

  const handleMarkerDragEnd = async (e:MarkerDragStartEndEvent) => {
    const newCoordinate = e.nativeEvent.coordinate;
    setMarkerCoord(newCoordinate);

    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocation(
          `${newCoordinate.latitude.toFixed(4)}, ${newCoordinate.longitude.toFixed(4)}`
        );
        return;
      }

      let reverseGeocode = await Location.reverseGeocodeAsync(newCoordinate);
      if (reverseGeocode.length > 0) {
        const place = reverseGeocode[0];
        const address = [place.name, place.street, place.city]
          .filter(Boolean)
          .join(", ");
        setLocation(address || "Unknown Location");
      } else {
        setLocation(
          `${newCoordinate.latitude.toFixed(4)}, ${newCoordinate.longitude.toFixed(4)}`
        );
      }
    } catch (error) {
      setLocation(
        `${newCoordinate.latitude.toFixed(4)}, ${newCoordinate.longitude.toFixed(4)}`
      );
    }
  };

  const handleLocationSearch = async () => {
    if (!location.trim()) return;

    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMessage("Permission to access location was denied");
        return;
      }

      let searchQuery = location.trim();
      if (!searchQuery.toLowerCase().includes("hawassa")) {
        searchQuery = `${searchQuery}, Hawassa, Ethiopia`;
      }

      let geocodeResult = await Location.geocodeAsync(searchQuery);
      
      if (geocodeResult.length > 0) {
        const { latitude, longitude } = geocodeResult[0];
        const newCoord = { latitude, longitude };
        
        setMarkerCoord(newCoord);
        
        mapRef.current?.animateToRegion(
          {
            ...newCoord,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          },
          1000
        );
      } else {
        console.log("Location not found in Hawassa");
      }
    } catch (error) {
      console.log("Error finding location:", error);
    }
  };

  const handleSubmit = async () => {
    if (!session?.user) {
      setErrorMessage("Please log in to create an event.");
      return;
    }

    if (!title.trim()) {
      setErrorMessage("Add a title for your event.");
      return;
    }

    if (feeType === "paid" && !feeAmount.trim()) {
      setErrorMessage("Enter the entry fee amount.");
      return;
    }

    const parsedFee = feeAmount.trim() ? Number(feeAmount.trim()) : null;
    if (feeType === "paid" && (parsedFee === null || Number.isNaN(parsedFee))) {
      setErrorMessage("Entry fee must be a number.");
      return;
    }

    const startAtValue = parseDateTime(startDate, startTime);
    const endAtValue = parseDateTime(endDate, endTime);

    if (startAtValue === "INVALID" || endAtValue === "INVALID") {
      setErrorMessage("Use format YYYY-MM-DD and HH:mm (LT).");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const { error } = await supabase.from("events").insert({
      user_id: session.user.id,
      title: title.trim(),
      description: details.trim() || null,
      tags: tagsText
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      start_at: startAtValue === "INVALID" ? null : startAtValue,
      end_at: endAtValue === "INVALID" ? null : endAtValue,
      location: location.trim() || null,
      host_name: hostName.trim() || null,
      fee_type: feeType,
      fee_amount: feeType === "paid" ? parsedFee : null,
    });

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.replace("/(tabs)/events");
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">
      <View className="flex-1 bg-white dark:bg-slate-950">
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <Pressable
            onPress={() => router.back()}
            className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 items-center justify-center"
          >
            <Feather name="arrow-left" size={24} color="black" />
          </Pressable>

          <AppText className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Create Event
          </AppText>
          <View className="w-14" />
        </View>
        <ScrollView contentContainerClassName="px-5 pb-28 pt-5">
          <Pressable className="h-40 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800">
              <Ionicons
                name="image-outline"
                size={22}
                color={colors.mutedText}
              />
            </View>
            <AppText className="mt-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
              Add Event Cover
            </AppText>
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
            <View className="flex-row items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <Ionicons
                name="calendar-outline"
                size={18}
                color={colors.mutedText}
              />
              <TextInput
                placeholder="Start date (YYYY-MM-DD)"
                placeholderTextColor={colors.mutedStrong}
                className="flex-1 text-sm text-slate-900 dark:text-slate-100"
                value={startDate}
                onChangeText={setStartDate}
              />
              <AppText className="text-xs text-slate-400 dark:text-slate-500">
                LT
              </AppText>
            </View>
            <View className="flex-row items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <Ionicons
                name="calendar-outline"
                size={18}
                color={colors.mutedText}
              />
              <TextInput
                placeholder="End date (YYYY-MM-DD)"
                placeholderTextColor={colors.mutedStrong}
                className="flex-1 text-sm text-slate-900 dark:text-slate-100"
                value={endDate}
                onChangeText={setEndDate}
              />
              <AppText className="text-xs text-slate-400 dark:text-slate-500">
                LT
              </AppText>
            </View>
            <View className="flex-row gap-3">
              <View className="flex-1 flex-row items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <Ionicons
                  name="time-outline"
                  size={18}
                  color={colors.mutedText}
                />
                <TextInput
                  placeholder="Start (HH:mm)"
                  placeholderTextColor={colors.mutedStrong}
                  className="flex-1 text-sm text-slate-900 dark:text-slate-100"
                  value={startTime}
                  onChangeText={setStartTime}
                />
              </View>
              <View className="flex-1 flex-row items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <Ionicons
                  name="time-outline"
                  size={18}
                  color={colors.mutedText}
                />
                <TextInput
                  placeholder="End (HH:mm)"
                  placeholderTextColor={colors.mutedStrong}
                  className="flex-1 text-sm text-slate-900 dark:text-slate-100"
                  value={endTime}
                  onChangeText={setEndTime}
                />
              </View>
            </View>
          </View>

          {/* Updated "Where" Section with Search Button */}
          <View className="mt-6 flex-row items-center justify-between">
            <AppText className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Where
            </AppText>
          </View>
          <View className="mt-2 flex-row items-center gap-3">
            <View className="flex-1 flex-row items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <Ionicons
                name="location-outline"
                size={16}
                color={colors.mutedText}
              />
              <TextInput
                placeholder="Type an address and press Search..."
                placeholderTextColor={colors.mutedStrong}
                className="flex-1 text-sm text-slate-900 dark:text-slate-100"
                value={location}
                onChangeText={setLocation}
                onSubmitEditing={handleLocationSearch}
                returnKeyType="search"
              />
            </View>
            <Pressable 
              onPress={handleLocationSearch}
              className="h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <Ionicons name="search" size={18} color={colors.accent} />
            </Pressable>
          </View>

          <View className="mt-3 h-48 w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
            <MapView
              ref={mapRef}
              style={{ flex: 1 }}
              initialRegion={{
                latitude: 7.0504,
                longitude: 38.4768,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
            >
              <Marker
                draggable
                coordinate={markerCoord}
                onDragEnd={handleMarkerDragEnd}
                title="Event Location"
                description="Drag to set location"
              />
            </MapView>
          </View>

          <AppText className="mt-6 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Organizer
          </AppText>
          <View className="mt-2 flex-row items-center gap-3">
            <View className="h-11 w-11 items-center justify-center rounded-full bg-green-100 dark:bg-green-400/20">
              <Ionicons name="person" size={18} color={colors.accent} />
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
                  color: feeType === "free" ? colors.accent : colors.mutedText,
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
                  color: feeType === "paid" ? colors.accent : colors.mutedText,
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
            <Ionicons name="cash-outline" size={18} color={colors.mutedText} />
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
              className="min-h-[110px] text-sm text-slate-900 dark:text-slate-100"
              multiline
              textAlignVertical="top"
              value={details}
              onChangeText={setDetails}
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
              {isSubmitting ? "Posting..." : "Post Event"}
            </AppText>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}