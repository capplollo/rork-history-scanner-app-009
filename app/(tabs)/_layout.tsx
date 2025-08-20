import { Tabs } from "expo-router";
import { Camera, BookOpen, User } from "lucide-react-native";
import React from "react";
import { Platform, View } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#8B4513",
        tabBarInactiveTintColor: "#A0A0A0",
        tabBarStyle: {
          backgroundColor: "#FEFEFE",
          borderTopWidth: 0.5,
          borderTopColor: "#E8E8E8",
          paddingBottom: Platform.OS === "ios" ? 0 : 8,
          height: Platform.OS === "ios" ? 88 : 65,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontFamily: Platform.select({
            ios: "Times New Roman",
            android: "serif",
            default: "Times New Roman"
          }),
          fontSize: 11,
          fontWeight: "500",
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="(scanner)"
        options={{
          title: "Scanner",
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: focused ? "#8B4513" : "#D4A574",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 20,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 8,
            }}>
              <Camera size={28} color="#ffffff" />
            </View>
          ),
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: "Learn",
          tabBarIcon: ({ color, size }) => <BookOpen size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}