import { Stack } from "expo-router";

import { screenHeaderOptions } from "@/modules/active/navigation/largeTitleScreenOptions";
import { BuyScreen } from "@/modules/active/screens/Buy/Buy.screen";

export default function BuyScreenRoute() {
  return (
    <>
      <Stack.Screen options={screenHeaderOptions("Buy")} />
      <BuyScreen />
    </>
  );
}
