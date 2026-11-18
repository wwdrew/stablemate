import { Platform } from "react-native";

import type { Palette } from "@/theme/colors";

function sharedHeaderOptions(colors: Palette) {
  return {
    contentStyle: { backgroundColor: colors.background },
  };
}

/** iOS headers take their colours from the navigation theme (see the root layout). */
function androidHeaderColors(colors: Palette) {
  return {
    headerTitleStyle: { color: colors.text },
    headerStyle: { backgroundColor: colors.background },
  };
}

/** iOS large titles — no header backgroundColor (iOS 26 invisible-title bug). */
function iosHeaderOptions(colors: Palette) {
  return {
    ...sharedHeaderOptions(colors),
    headerTransparent: true,
    headerBlurEffect: "none" as const,
    headerShadowVisible: false,
    headerLargeTitleEnabled: true,
  };
}

/** Standard opaque Material-style header on Android. */
function androidHeaderOptions(colors: Palette) {
  return {
    ...sharedHeaderOptions(colors),
    headerTransparent: false,
    headerLargeTitleEnabled: false,
    headerShadowVisible: false,
    ...androidHeaderColors(colors),
  };
}

export function screenHeaderOptions(title: string, colors: Palette) {
  return {
    title,
    ...(Platform.OS === "ios" ? iosHeaderOptions(colors) : androidHeaderOptions(colors)),
  };
}

/** Compact modal/detail header — no large title on either platform. */
export function detailScreenHeaderOptions(title: string, colors: Palette) {
  return {
    title,
    ...sharedHeaderOptions(colors),
    headerTransparent: false,
    headerLargeTitleEnabled: false,
    headerShadowVisible: false,
    ...(Platform.OS === "android" ? androidHeaderColors(colors) : {}),
  };
}
