import { Stack } from "expo-router";

import { QueryProvider } from "@/providers/QueryProvider";
import { useHasGameState } from "@/store/game";

export default function RootLayout() {
  return (
    <QueryProvider>
      <RootNavigator />
    </QueryProvider>
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
