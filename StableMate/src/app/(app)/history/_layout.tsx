import { Stack } from "expo-router";

export default function HistoryLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" />
      <Stack.Screen name="[entryId]" options={{ presentation: "modal" }} />
    </Stack>
  );
}
