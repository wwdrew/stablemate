import { Stack } from "expo-router";

import { screenHeaderOptions } from "@/modules/active/navigation/largeTitleScreenOptions";
import { StableScreen } from "@/modules/active/screens/Stable/Stable.screen";

export default function StableScreenRoute() {
  return (
    <>
      <Stack.Screen options={screenHeaderOptions("Stable")} />
      <StableScreen />
    </>
  );
}
