/** Shared iOS large-title stack options (avoids iOS 26 invisible-title bug). */
export const largeTitleScreenOptions = {
  headerTransparent: true,
  headerBlurEffect: "none" as const,
  headerShadowVisible: false,
  headerLargeTitleStyle: { color: "#1C1917" },
  headerTitleStyle: { color: "#1C1917" },
  contentStyle: { backgroundColor: "#F7F4EF" },
};
