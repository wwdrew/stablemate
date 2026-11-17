import { Stack } from "expo-router";

import { screenHeaderOptions } from "@/modules/active/navigation/largeTitleScreenOptions";
import { OverviewScreen } from "@/modules/active/screens/Overview/Overview.screen";
import { useColors } from "@/theme/colors";

export default function OverviewScreenRoute() {
  const colors = useColors();
  return (
    <>
      <Stack.Screen options={screenHeaderOptions("Overview", colors)} />
      <OverviewScreen />
    </>
  );
}
