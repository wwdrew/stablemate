import { Color } from "expo-router";
import { useMemo } from "react";
import {
  type ColorSchemeName,
  type ColorValue,
  Platform,
  StyleSheet,
  useColorScheme,
} from "react-native";

/**
 * Semantic colours backed by the platform's own palette, so dark mode,
 * increased contrast and (on Android) wallpaper colours come for free.
 * Screens use these names, never hex values or platform colour names.
 */
export type Palette = {
  /** Screen background. */
  background: ColorValue;
  /** Cards and rows on top of the background. */
  surface: ColorValue;
  text: ColorValue;
  textSecondary: ColorValue;
  /** Hints, placeholders and disabled text. */
  textTertiary: ColorValue;
  separator: ColorValue;
  /** Neutral fills: disabled buttons, inactive dots, switch tracks. */
  fill: ColorValue;
  /** Primary buttons and selected states. */
  accent: ColorValue;
  /** Text and icons on `accent`. */
  onAccent: ColorValue;
  /** Money in. */
  positive: ColorValue;
  /** Money out, failures and destructive actions. */
  negative: ColorValue;
  /** Transactions waiting to settle. */
  pending: ColorValue;
};

function iosPalette(): Palette {
  // iOS system colours are dynamic, so one palette serves both schemes.
  return {
    background: Color.ios.systemGroupedBackground,
    surface: Color.ios.secondarySystemGroupedBackground,
    text: Color.ios.label,
    textSecondary: Color.ios.secondaryLabel,
    textTertiary: Color.ios.tertiaryLabel,
    separator: Color.ios.separator,
    fill: Color.ios.systemFill,
    accent: Color.ios.label,
    onAccent: Color.ios.systemBackground,
    positive: Color.ios.systemGreen,
    negative: Color.ios.systemRed,
    pending: Color.ios.systemOrange,
  };
}

function androidPalette(scheme: ColorSchemeName | null): Palette {
  // Material 3 has no success or warning roles, so those two are fixed tones
  // chosen per scheme.
  const dark = scheme === "dark";
  const material = Color.android.dynamic;
  return {
    background: material.surface,
    surface: material.surfaceContainer,
    text: material.onSurface,
    textSecondary: material.onSurfaceVariant,
    textTertiary: material.outline,
    separator: material.outlineVariant,
    fill: material.surfaceContainerHighest,
    accent: material.primary,
    onAccent: material.onPrimary,
    positive: dark ? "#6DD58C" : "#146C2E",
    negative: material.error,
    pending: dark ? "#FFB95C" : "#8A5100",
  };
}

export function palette(scheme: ColorSchemeName | null): Palette {
  return Platform.OS === "android" ? androidPalette(scheme) : iosPalette();
}

/**
 * The palette for the current colour scheme. Android resolves Material colours
 * when they're read, so this re-reads them whenever the scheme changes.
 */
export function useColors(): Palette {
  const scheme = useColorScheme();
  return useMemo(() => palette(scheme), [scheme]);
}

/** `StyleSheet.create` with the palette, as a hook that follows the colour scheme. */
export function makeStyles<S extends Parameters<typeof StyleSheet.create>[0]>(
  factory: (colors: Palette) => S,
) {
  return function useStyles(): Readonly<S> {
    const colors = useColors();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}
