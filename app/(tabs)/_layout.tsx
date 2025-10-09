import { Tabs } from "expo-router";
import { Camera, BookOpen, User } from "lucide-react-native";
import React from "react";
import { Platform } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#FFFFFF",
        tabBarInactiveTintColor: "#7A8A95",
        tabBarStyle: {
          backgroundColor: "#173248",
          borderTopWidth: 0,
          borderRadius: 35,
          marginHorizontal: 30,
          marginBottom: Platform.OS === "ios" ? 34 : 20,
          paddingBottom: 0,
          height: 70,
          position: "absolute",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: {
          display: "none",
        },
        tabBarItemStyle: {
          paddingVertical: 10,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <User size={32} color={color} />,
        }}
      />
      <Tabs.Screen
        name="(scanner)"
        options={{
          title: "Discover",
          tabBarIcon: ({ color }) => <Camera size={36} color={color} />,
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: "Learn",
          tabBarIcon: ({ color }) => <BookOpen size={32} color={color} />,
        }}
      />
    </Tabs>
  );
}