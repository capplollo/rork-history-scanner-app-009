import { Stack } from "expo-router";

export default function ScannerLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: "Monument Scanner",
          headerStyle: {
            backgroundColor: "#1e3a8a",
          },
          headerTintColor: "#ffffff",
          headerTitleStyle: {
            fontWeight: "bold",
          },
        }} 
      />
    </Stack>
  );
}