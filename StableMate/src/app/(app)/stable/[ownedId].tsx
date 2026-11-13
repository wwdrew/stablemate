import { Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { CatalogSpecies } from "@/data/catalog.schema";
import { detailScreenHeaderOptions } from "@/modules/active/navigation/largeTitleScreenOptions";
import { BattleAction } from "@/modules/active/screens/PokemonDetail/BattleAction";
import { BattleOverlay } from "@/modules/active/screens/PokemonDetail/BattleOverlay";
import {
  pickChallenger,
  rollPlayerWins,
} from "@/modules/active/screens/PokemonDetail/battle";
import { PokemonDetailScreen } from "@/modules/active/screens/PokemonDetail/PokemonDetail.screen";
import { pokemonFromOwned } from "@/modules/active/screens/PokemonDetail/pokemonInstance";
import { useGameStore } from "@/store/game";

type BattleSession = {
  challenger: CatalogSpecies;
  playerWins: boolean;
};

export default function StableOwnedDetailRoute() {
  const { ownedId } = useLocalSearchParams<{ ownedId: string }>();
  const owned = useGameStore((store) =>
    store.state?.stable.find((item) => item.id === ownedId),
  );
  const [battle, setBattle] = useState<BattleSession | null>(null);

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
      <PokemonDetailScreen
        pokemon={pokemon}
        actions={
          <BattleAction
            disabled={battle !== null}
            onPress={() => {
              setBattle({
                challenger: pickChallenger(pokemon.slug),
                playerWins: rollPlayerWins(),
              });
            }}
          />
        }
      />
      {battle ? (
        <BattleOverlay
          player={pokemon}
          challenger={battle.challenger}
          playerWins={battle.playerWins}
          onFinished={() => setBattle(null)}
        />
      ) : null}
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
