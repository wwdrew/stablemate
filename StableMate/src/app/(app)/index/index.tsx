import { Stack } from "expo-router";

import { largeTitleScreenOptions } from "@/modules/active/navigation/largeTitleScreenOptions";
import { OverviewScreen } from "@/modules/active/screens/Overview/Overview.screen";

export default function OverviewScreenRoute() {
  return (
    <>
      <Stack.Screen
        options={{
          ...largeTitleScreenOptions,
          title: "Overview",
          headerLargeTitleEnabled: true,
        }}
      />
      <OverviewScreen />
    </>
  );
}
