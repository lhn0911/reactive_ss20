import CloudinaryUploaderScreen from "@/components/UploadImage";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  return (
    <SafeAreaView>
      <CloudinaryUploaderScreen />
    </SafeAreaView>
  );
}
