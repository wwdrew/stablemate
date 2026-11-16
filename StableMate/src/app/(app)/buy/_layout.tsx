import { Stack } from "expo-router";

// Deep links to a detail route still get the list underneath, so the modal
// presents over it (and can be dismissed back to it).
export const unstable_settings = { anchor: "index" };

export default function BuyLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" />
      <Stack.Screen name="[listingId]" options={{ presentation: "modal" }} />
    </Stack>
  );
}
