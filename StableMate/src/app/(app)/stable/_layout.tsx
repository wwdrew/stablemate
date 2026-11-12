import { Stack } from "expo-router";

export default function StableLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" />
      <Stack.Screen name="[ownedId]" options={{ presentation: "modal" }} />
    </Stack>
  );
}
