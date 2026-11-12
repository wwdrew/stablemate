import { Stack } from "expo-router";

import { largeTitleScreenOptions } from "@/modules/active/navigation/largeTitleScreenOptions";
import { StableScreen } from "@/modules/active/screens/Stable/Stable.screen";

export default function StableScreenRoute() {
  return (
    <>
      <Stack.Screen
        options={{
          ...largeTitleScreenOptions,
          title: "Stable",
          headerLargeTitleEnabled: true,
        }}
      />
      <StableScreen />
    </>
  );
}
