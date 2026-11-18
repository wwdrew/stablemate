import { Stack, useLocalSearchParams } from "expo-router";

import { detailScreenHeaderOptions } from "@/modules/active/navigation/headerOptions";
import { OwnedDetailScreen } from "@/modules/active/screens/OwnedDetail/OwnedDetail.screen";
import { pokemonFromOwned } from "@/modules/active/screens/PokemonDetail/pokemonInstance";
import { useGameStore } from "@/store/game";
import { useColors } from "@/theme/colors";

export default function StableOwnedDetailRoute() {
  const colors = useColors();
  const { ownedId } = useLocalSearchParams<{ ownedId: string }>();
  const owned = useGameStore((store) =>
    store.state?.stable.find((item) => item.id === ownedId),
  );
  const title = (owned && pokemonFromOwned(owned)?.name) ?? "Not found";

  return (
    <>
      <Stack.Screen options={detailScreenHeaderOptions(title, colors)} />
      <OwnedDetailScreen owned={owned} />
    </>
  );
}
