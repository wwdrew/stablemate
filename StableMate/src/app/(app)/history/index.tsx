import { Stack } from "expo-router";

import { screenHeaderOptions } from "@/modules/active/navigation/largeTitleScreenOptions";
import { HistoryScreen } from "@/modules/active/screens/History/History.screen";

export default function HistoryScreenRoute() {
  return (
    <>
      <Stack.Screen options={screenHeaderOptions("History")} />
      <HistoryScreen />
    </>
  );
}
