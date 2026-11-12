import { Stack } from "expo-router";

import { useHasGameState } from "@/store/game";

export default function RootLayout() {
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
