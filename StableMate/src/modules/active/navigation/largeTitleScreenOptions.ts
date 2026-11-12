import { Platform } from "react-native";

const sharedHeaderOptions = {
  headerTitleStyle: { color: "#1C1917" },
  contentStyle: { backgroundColor: "#F7F4EF" },
};

/** iOS large titles — no header backgroundColor (iOS 26 invisible-title bug). */
const iosHeaderOptions = {
  ...sharedHeaderOptions,
  headerTransparent: true,
  headerBlurEffect: "none" as const,
  headerShadowVisible: false,
  headerLargeTitleEnabled: true,
  headerLargeTitleStyle: { color: "#1C1917" },
};

/** Standard opaque Material-style header on Android. */
const androidHeaderOptions = {
  ...sharedHeaderOptions,
  headerTransparent: false,
  headerLargeTitleEnabled: false,
  headerShadowVisible: false,
  headerStyle: { backgroundColor: "#F7F4EF" },
};

export function screenHeaderOptions(title: string) {
  return {
    title,
    ...(Platform.OS === "ios" ? iosHeaderOptions : androidHeaderOptions),
  };
}
