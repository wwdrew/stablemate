import { Stack } from "expo-router";

import { screenHeaderOptions } from "@/modules/active/navigation/headerOptions";
import { StableScreen } from "@/modules/active/screens/Stable/Stable.screen";
import { useColors } from "@/theme/colors";

export default function StableScreenRoute() {
  const colors = useColors();
  return (
    <>
      <Stack.Screen options={screenHeaderOptions("Stable", colors)} />
      <StableScreen />
    </>
  );
}
