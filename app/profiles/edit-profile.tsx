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
import { useState } from "react";
import { AppText } from "../../components/AppText";
import { useTheme } from "../../hooks/useTheme";

export default function EditProfileScreen() {
  const { colors, statusBarStyle } = useTheme();
  const router = useRouter();
  const [fullName, setFullName] = useState("Abebe Kebede");
  const [username, setUsername] = useState("@abebe_k");
  const [bio, setBio] = useState(
    "Final year Computer Science student. Building things for HU. Love the Quiet Study Garden!",
  );

  return (
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
        <TouchableOpacity accessibilityRole="button">
          <AppText className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            Save
          </AppText>
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-10"
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center pt-4">
          <View className="h-28 w-28 items-center justify-center rounded-full border-4 border-white bg-slate-200 shadow-sm dark:border-slate-950 dark:bg-slate-800">
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80",
              }}
              className="h-full w-full rounded-full"
              resizeMode="cover"
            />
          </View>
          <TouchableOpacity className="mt-3" accessibilityRole="button">
            <AppText className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              Change Profile Photo
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
              value="Hawassa University"
              editable={false}
              className="flex-1 text-sm text-slate-400 dark:text-slate-500"
            />
            <Ionicons name="lock-closed" size={16} color={colors.mutedStrong} />
          </View>
          <AppText className="mt-2 text-xs text-slate-400 dark:text-slate-500">
            Campus is verified based on your student email.
          </AppText>
        </View>

        <TouchableOpacity
          className="mt-8 flex-row items-center justify-between border-t border-slate-200 py-4 dark:border-slate-800"
          accessibilityRole="button"
        >
          <AppText className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Personal Information
          </AppText>
          <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
