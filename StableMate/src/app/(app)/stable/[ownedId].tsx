import { Stack, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { detailScreenHeaderOptions } from "@/modules/active/navigation/largeTitleScreenOptions";
import { BattleAction } from "@/modules/active/screens/PokemonDetail/BattleAction";
import { PokemonDetailScreen } from "@/modules/active/screens/PokemonDetail/PokemonDetail.screen";
import { pokemonFromOwned } from "@/modules/active/screens/PokemonDetail/pokemonInstance";
import { useGameStore } from "@/store/game";

export default function StableOwnedDetailRoute() {
  const { ownedId } = useLocalSearchParams<{ ownedId: string }>();
  const owned = useGameStore((store) =>
    store.state?.stable.find((item) => item.id === ownedId),
  );

  const pokemon = owned ? pokemonFromOwned(owned) : null;

  if (!pokemon) {
    return (
      <>
        <Stack.Screen options={detailScreenHeaderOptions("Not found")} />
        <View style={styles.centered}>
          <Text style={styles.title}>Pokémon not found</Text>
          <Text style={styles.body}>
            This entry isn’t in your stable anymore.
          </Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={detailScreenHeaderOptions(pokemon.name)} />
      <PokemonDetailScreen pokemon={pokemon} actions={<BattleAction />} />
    </>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    gap: 8,
    backgroundColor: "#F7F4EF",
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1C1917",
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: "#57534E",
  },
});
