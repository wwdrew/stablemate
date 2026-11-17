import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { useColorScheme } from "react-native";

import { QueryProvider } from "@/providers/QueryProvider";
import { useHasGameState } from "@/store/game";

export default function RootLayout() {
  // Navigation chrome (headers, modal backgrounds) follows the system scheme.
  const scheme = useColorScheme();

  return (
    <ThemeProvider value={scheme === "dark" ? DarkTheme : DefaultTheme}>
      <QueryProvider>
        <RootNavigator />
      </QueryProvider>
    </ThemeProvider>
  );
}

function RootNavigator() {
  const hasGameState = useHasGameState();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={hasGameState}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>

      <Stack.Protected guard={!hasGameState}>
        <Stack.Screen name="welcome" />
      </Stack.Protected>
    </Stack>
  );
}
