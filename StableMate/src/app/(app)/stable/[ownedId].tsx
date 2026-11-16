import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { detailScreenHeaderOptions } from "@/modules/active/navigation/largeTitleScreenOptions";
import { BattleAction } from "@/modules/active/screens/PokemonDetail/BattleAction";
import { BattleOverlay } from "@/modules/active/screens/PokemonDetail/BattleOverlay";
import { PokemonDetailScreen } from "@/modules/active/screens/PokemonDetail/PokemonDetail.screen";
import { pokemonFromOwned } from "@/modules/active/screens/PokemonDetail/pokemonInstance";
import { SellAction } from "@/modules/active/screens/PokemonDetail/SellAction";
import { type BattleResult, type OwnedPokemon, useGameStore } from "@/store/game";
import { useBattleOutcome, useIsOnline } from "@/store/settings";

function ownedStatusMessage(args: {
  owned: OwnedPokemon;
  isOnline: boolean;
  isLastPokemon: boolean;
}): string | null {
  const settles = args.isOnline
    ? "Settling now…"
    : "Settles when you’re back online.";

  if (args.owned.pending?.type === "purchase") {
    return `Purchase pending. ${settles}`;
  }

  if (args.owned.pending?.type === "sale") {
    return `Sale pending at $${args.owned.markPrice}. ${settles}`;
  }

  if (args.isLastPokemon) {
    return "You can’t sell your last Pokémon.";
  }

  return null;
}

export default function StableOwnedDetailRoute() {
  const router = useRouter();
  const { ownedId } = useLocalSearchParams<{ ownedId: string }>();
  const owned = useGameStore((store) =>
    store.state?.stable.find((item) => item.id === ownedId),
  );
  const battleHistory = useGameStore((store) => store.state?.battleHistory ?? []);
  const startBattle = useGameStore((store) => store.startBattle);
  const sellOwned = useGameStore((store) => store.sellOwned);
  const keepingCount = useGameStore(
    (store) =>
      store.state?.stable.filter((item) => item.pending?.type !== "sale")
        .length ?? 0,
  );
  const battleOutcome = useBattleOutcome();
  const isOnline = useIsOnline();
  const [battle, setBattle] = useState<BattleResult | null>(null);

  const pokemon = owned ? pokemonFromOwned(owned) : null;
  const ownedBattleHistory = useMemo(
    () => battleHistory.filter((entry) => entry.ownedId === ownedId),
    [battleHistory, ownedId],
  );

  if (!pokemon || !owned) {
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

  const isPending = owned.pending !== null;
  const isLastPokemon = !isPending && keepingCount <= 1;
  const statusMessage = ownedStatusMessage({ owned, isOnline, isLastPokemon });

  return (
    <>
      <Stack.Screen options={detailScreenHeaderOptions(pokemon.name)} />
      <PokemonDetailScreen
        pokemon={pokemon}
        battleHistory={ownedBattleHistory}
        actions={
          <View style={styles.actions}>
            <BattleAction
              disabled={battle !== null || isPending}
              onPress={() => setBattle(startBattle(owned.id, battleOutcome))}
            />
            <SellAction
              price={owned.markPrice}
              disabled={battle !== null || isPending || isLastPokemon}
              statusMessage={statusMessage}
              onPress={() => {
                const result = sellOwned(owned.id);
                if (result.ok && router.canGoBack()) {
                  router.back();
                }
              }}
            />
          </View>
        }
      />
      {battle ? (
        <BattleOverlay
          player={pokemon}
          challenger={battle.challenger}
          playerWins={battle.playerWins}
          prizeMoney={battle.prizeMoney}
          onFinished={() => setBattle(null)}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 12,
  },
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
