import { Stack } from "expo-router";

import { screenHeaderOptions } from "@/modules/active/navigation/headerOptions";
import { BuyScreen } from "@/modules/active/screens/Buy/Buy.screen";
import { useColors } from "@/theme/colors";

export default function BuyScreenRoute() {
  const colors = useColors();
  return (
    <>
      <Stack.Screen options={screenHeaderOptions("Buy", colors)} />
      <BuyScreen />
    </>
  );
}
