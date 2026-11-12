import { Stack } from "expo-router";

export default function BuyLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" />
      <Stack.Screen name="[listingId]" options={{ presentation: "modal" }} />
    </Stack>
  );
}
