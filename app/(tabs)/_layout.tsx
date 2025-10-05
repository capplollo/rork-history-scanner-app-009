import { Tabs } from "expo-router";
import { Camera, BookOpen, User } from "lucide-react-native";
import React from "react";
import { Platform, View, StyleSheet } from "react-native";
import Colors from "@/constants/colors";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#FFFFFF",
        tabBarInactiveTintColor: Colors.iconGray,
        tabBarStyle: {
          backgroundColor: "transparent",
          borderTopWidth: 0,
          borderRadius: 38,
          marginHorizontal: 24,
          marginBottom: Platform.OS === "ios" ? 16 : 16,
          paddingBottom: 0,
          height: 76,
          position: "absolute",
          shadowColor: "transparent",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0,
          shadowRadius: 0,
          elevation: 0,
        },
        tabBarBackground: () => (
          <View style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: Colors.navBar,
            borderRadius: 38,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.25,
            shadowRadius: 24,
            elevation: 12,
          }} />
        ),
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
          title: "",
          tabBarIcon: ({ color }) => <User size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="(scanner)"
        options={{
          title: "",
          tabBarIcon: ({ focused }) => (
            <View style={[
              styles.cameraIconContainer,
              { backgroundColor: focused ? "#FFFFFF" : Colors.iconGray }
            ]}>
              <Camera size={32} color={Colors.navBar} />
            </View>
          ),
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: "",
          tabBarIcon: ({ color }) => <BookOpen size={26} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  cameraIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "rgba(0,0,0,0.15)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 4,
  },
});