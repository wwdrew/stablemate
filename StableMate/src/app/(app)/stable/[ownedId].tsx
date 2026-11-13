import { Stack, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { CatalogSpecies } from "@/data/catalog.schema";
import { detailScreenHeaderOptions } from "@/modules/active/navigation/largeTitleScreenOptions";
import { BattleAction } from "@/modules/active/screens/PokemonDetail/BattleAction";
import { BattleOverlay } from "@/modules/active/screens/PokemonDetail/BattleOverlay";
import {
  pickChallenger,
  prizeMoneyForWin,
  rollPlayerWins,
} from "@/modules/active/screens/PokemonDetail/battle";
import { PokemonDetailScreen } from "@/modules/active/screens/PokemonDetail/PokemonDetail.screen";
import { pokemonFromOwned } from "@/modules/active/screens/PokemonDetail/pokemonInstance";
import { useGameStore } from "@/store/game";

type BattleSession = {
  challenger: CatalogSpecies;
  playerWins: boolean;
  prizeMoney: number;
};

export default function StableOwnedDetailRoute() {
  const { ownedId } = useLocalSearchParams<{ ownedId: string }>();
  const owned = useGameStore((store) =>
    store.state?.stable.find((item) => item.id === ownedId),
  );
  const battleHistory = useGameStore((store) => store.state?.battleHistory ?? []);
  const resolveBattle = useGameStore((store) => store.resolveBattle);
  const [battle, setBattle] = useState<BattleSession | null>(null);

  const pokemon = owned ? pokemonFromOwned(owned) : null;
  const ownedBattleHistory = useMemo(
    () => battleHistory.filter((entry) => entry.ownedId === ownedId),
    [battleHistory, ownedId],
  );

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
        battleHistory={ownedBattleHistory}
        actions={
          <BattleAction
            disabled={battle !== null}
            onPress={() => {
              const challenger = pickChallenger(pokemon.slug);
              const playerWins = rollPlayerWins();
              setBattle({
                challenger,
                playerWins,
                prizeMoney: playerWins ? prizeMoneyForWin(challenger) : 0,
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
          prizeMoney={battle.prizeMoney}
          onFinished={() => {
            resolveBattle({
              ownedId: pokemon.id,
              challengerSlug: battle.challenger.slug,
              challengerName: battle.challenger.name,
              won: battle.playerWins,
              prizeMoney: battle.prizeMoney,
            });
            setBattle(null);
          }}
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
