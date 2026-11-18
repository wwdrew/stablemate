import { Stack } from "expo-router";

import { screenHeaderOptions } from "@/modules/active/navigation/headerOptions";
import { HistoryScreen } from "@/modules/active/screens/History/History.screen";
import { useColors } from "@/theme/colors";

export default function HistoryScreenRoute() {
  const colors = useColors();
  return (
    <>
      <Stack.Screen options={screenHeaderOptions("History", colors)} />
      <HistoryScreen />
    </>
  );
}
