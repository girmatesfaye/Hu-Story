import { Tabs } from "expo-router";
import React from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Entypo from "@expo/vector-icons/Entypo";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "../../hooks/useTheme";
import { StatusBar } from "expo-status-bar";

export default function TabLayout() {
  const { colors, statusBarStyle } = useTheme();

  return (
    <>
      <StatusBar
        style={statusBarStyle}
        backgroundColor={colors.headerBackground}
        translucent={false}
      />
      <Tabs
        screenOptions={{
          headerShown: false,
          headerStyle: {
            backgroundColor: colors.headerBackground,
          },
          headerTintColor: colors.headerText,
          tabBarStyle: {
            backgroundColor: colors.surface,
          },
          tabBarLabelStyle: {
            fontFamily: "LexendRegular",
          },
          tabBarActiveTintColor: colors.tabActive,
          tabBarInactiveTintColor: colors.tabInactive,
        }}
      >
        <Tabs.Screen
          name="rants"
          options={{
            title: "Rants",
            tabBarIcon: ({ color }) => (
              <Ionicons
                name="chatbox-ellipses-outline"
                size={24}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="spots"
          options={{
            title: "Spots",
            tabBarIcon: ({ color }) => (
              <Ionicons name="compass-outline" size={28} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="events"
          options={{
            title: "Events",
            tabBarIcon: ({ color }) => (
              <Ionicons name="calendar-outline" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="projects"
          options={{
            title: "Projects",
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons
                name="rocket-launch-outline"
                size={24}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color }) => (
              <Ionicons name="person-outline" size={24} color={color} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}
