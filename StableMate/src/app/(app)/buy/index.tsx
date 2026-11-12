import { Stack } from "expo-router";

import { largeTitleScreenOptions } from "@/modules/active/navigation/largeTitleScreenOptions";
import { BuyScreen } from "@/modules/active/screens/Buy/Buy.screen";

export default function BuyScreenRoute() {
  return (
    <>
      <Stack.Screen
        options={{
          ...largeTitleScreenOptions,
          title: "Buy",
          headerLargeTitleEnabled: true,
        }}
      />
      <BuyScreen />
    </>
  );
}
