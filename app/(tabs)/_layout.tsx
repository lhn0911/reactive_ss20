import { Tabs } from "expo-router";
import React from "react";

export default function HomeScreen() {
  return (
    <Tabs>
      <Tabs.Screen
        name="CameraUploadScreen"
        options={{ title: "Bài 1 đến 5", headerShown: false }}
      />
      <Tabs.Screen
        name="MediaCaptureScreen"
        options={{ title: "Bài 6 đến 8", headerShown: false }}
      />
    </Tabs>
  );
}
