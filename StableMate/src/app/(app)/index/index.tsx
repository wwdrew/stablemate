import { Stack } from "expo-router";

import { screenHeaderOptions } from "@/modules/active/navigation/largeTitleScreenOptions";
import { OverviewScreen } from "@/modules/active/screens/Overview/Overview.screen";

export default function OverviewScreenRoute() {
  return (
    <>
      <Stack.Screen options={screenHeaderOptions("Overview")} />
      <OverviewScreen />
    </>
  );
}
