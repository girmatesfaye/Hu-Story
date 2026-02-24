import {
  Image,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { AppText } from "../../components/AppText";
import { useTheme } from "../../hooks/useTheme";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import { useSupabase } from "../../providers/SupabaseProvider";
import * as ImagePicker from "expo-image-picker";

export default function EditProfileScreen() {
  const { colors, statusBarStyle } = useTheme();
  const router = useRouter();
  const { session } = useSupabase();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [campus, setCampus] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      if (!session?.user) return;

      const { data } = await supabase
        .from("profiles")
        .select("full_name, username, bio, campus, avatar_url")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (isMounted) {
        setFullName(data?.full_name ?? "");
        setUsername(data?.username ?? "");
        setBio(data?.bio ?? "");
        setCampus(
          data?.campus ??
            session.user.user_metadata?.campus ??
            "Hawassa University",
        );
        setAvatarUrl(data?.avatar_url ?? null);
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [session?.user]);

  const handlePickAvatar = async () => {
    if (!session?.user) {
      setErrorMessage("You are not signed in.");
      return;
    }

    setErrorMessage(null);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      setErrorMessage("Permission needed to select a profile photo.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const uploadAvatar = async () => {
    if (!avatarUri || !session?.user) return null;

    setIsUploadingAvatar(true);
    try {
      const response = await fetch(avatarUri);
      const arrayBuffer = await response.arrayBuffer();
      const fileData = new Uint8Array(arrayBuffer);
      const fileExt = avatarUri.split(".").pop()?.split("?")[0] || "jpg";
      const filePath = `${session.user.id}/${Date.now()}.${fileExt}`;
      const contentType = `image/${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, fileData, { contentType, upsert: false });

      if (uploadError) {
        setErrorMessage(uploadError.message);
        return null;
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      return data.publicUrl;
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!session?.user) {
      setErrorMessage("You are not signed in.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const nextAvatarUrl = avatarUri ? await uploadAvatar() : avatarUrl;
    if (avatarUri && !nextAvatarUrl) {
      setIsSaving(false);
      return;
    }

    const { error } = await supabase.from("profiles").upsert(
      {
        user_id: session.user.id,
        full_name: fullName.trim() || null,
        username: username.trim() || null,
        bio: bio.trim() || null,
        campus: campus.trim() || null,
        avatar_url: nextAvatarUrl,
      },
      { onConflict: "user_id" },
    );

    setIsSaving(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setSuccessMessage("Profile updated.");
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <View className="flex-1 bg-slate-50 dark:bg-slate-950">
        <StatusBar style={statusBarStyle} />
        <View className="flex-row items-center justify-between px-5 pb-3 pt-6">
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => router.back()}
          >
            <AppText className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              Cancel
            </AppText>
          </TouchableOpacity>
          <AppText className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Edit Profile
          </AppText>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={handleSave}
            disabled={isSaving}
          >
            <AppText className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              {isSaving ? "Saving..." : "Save"}
            </AppText>
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pb-10"
          showsVerticalScrollIndicator={false}
        >
          <View className="items-center pt-4">
            <TouchableOpacity
              className="h-28 w-28 items-center justify-center rounded-full border-4 border-white bg-slate-200 shadow-sm dark:border-slate-950 dark:bg-slate-800"
              accessibilityRole="button"
              onPress={handlePickAvatar}
            >
              <Image
                source={{
                  uri:
                    avatarUri ??
                    avatarUrl ??
                    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80",
                }}
                className="h-full w-full rounded-full"
                resizeMode="cover"
              />
            </TouchableOpacity>
            <TouchableOpacity
              className="mt-3"
              accessibilityRole="button"
              onPress={handlePickAvatar}
            >
              <AppText className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                {isUploadingAvatar ? "Uploading..." : "Change Profile Photo"}
              </AppText>
            </TouchableOpacity>
          </View>

          <View className="mt-8">
            <AppText className="text-xs font-semibold tracking-[2px] text-slate-400 dark:text-slate-500">
              FULL NAME
            </AppText>
            <View className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                className="text-sm text-slate-900 dark:text-slate-100"
              />
            </View>
          </View>

          <View className="mt-6">
            <AppText className="text-xs font-semibold tracking-[2px] text-slate-400 dark:text-slate-500">
              USERNAME
            </AppText>
            <View className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
              <TextInput
                value={username}
                onChangeText={setUsername}
                className="text-sm text-slate-900 dark:text-slate-100"
              />
            </View>
          </View>

          <View className="mt-6">
            <AppText className="text-xs font-semibold tracking-[2px] text-slate-400 dark:text-slate-500">
              SHORT BIO
            </AppText>
            <View className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
              <TextInput
                value={bio}
                onChangeText={setBio}
                className="min-h-[110px] text-sm text-slate-900 dark:text-slate-100"
                multiline
                textAlignVertical="top"
              />
            </View>
          </View>

          <View className="mt-6">
            <AppText className="text-xs font-semibold tracking-[2px] text-slate-400 dark:text-slate-500">
              CAMPUS
            </AppText>
            <View className="mt-3 flex-row items-center gap-3 rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
              <TextInput
                value={campus}
                editable={false}
                className="flex-1 text-sm text-slate-400 dark:text-slate-500"
              />
              <Ionicons
                name="lock-closed"
                size={16}
                color={colors.mutedStrong}
              />
            </View>
            <AppText className="mt-2 text-xs text-slate-400 dark:text-slate-500">
              Campus is verified based on your student email.
            </AppText>
          </View>

          {errorMessage ? (
            <AppText className="mt-4 text-sm text-red-500">
              {errorMessage}
            </AppText>
          ) : null}
          {successMessage ? (
            <AppText className="mt-4 text-sm text-emerald-600 dark:text-emerald-400">
              {successMessage}
            </AppText>
          ) : null}

          <TouchableOpacity
            className="mt-8 flex-row items-center justify-between border-t border-slate-200 py-4 dark:border-slate-800"
            accessibilityRole="button"
          >
            <AppText className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Personal Information
            </AppText>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.mutedText}
            />
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
