import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { View } from "react-native";

import { EmptyState } from "@/components/EmptyState";
import { settlementWaitCopy } from "@/lib/ledger";
import { formatMoney } from "@/lib/money";
import { BattleAction } from "@/modules/active/screens/PokemonDetail/BattleAction";
import { BattleOverlay } from "@/modules/active/screens/PokemonDetail/BattleOverlay";
import { PokemonDetailScreen } from "@/modules/active/screens/PokemonDetail/PokemonDetail.screen";
import { pokemonFromOwned } from "@/modules/active/screens/PokemonDetail/pokemonInstance";
import { SellAction } from "@/modules/active/screens/PokemonDetail/SellAction";
import {
  type BattleResult,
  type OwnedPokemon,
  useBattleHistory,
  useGameStore,
} from "@/store/game";
import { useBattleOutcome, useIsOnline } from "@/store/settings";
import { makeStyles } from "@/theme/colors";

type OwnedDetailScreenProps = {
  owned: OwnedPokemon | undefined;
};

function ownedStatusMessage(args: {
  owned: OwnedPokemon;
  isOnline: boolean;
  isLastPokemon: boolean;
}): string | null {
  const settles = settlementWaitCopy(args.isOnline);

  if (args.owned.pending?.type === "purchase") {
    return `Purchase pending. ${settles}`;
  }

  if (args.owned.pending?.type === "sale") {
    return `Sale pending at ${formatMoney(args.owned.markPrice)}. ${settles}`;
  }

  if (args.isLastPokemon) {
    return "You can’t sell your last Pokémon.";
  }

  return null;
}

export function OwnedDetailScreen({ owned }: OwnedDetailScreenProps) {
  const styles = useStyles();
  const router = useRouter();
  const battleHistory = useBattleHistory();
  const startBattle = useGameStore((store) => store.startBattle);
  const sellOwned = useGameStore((store) => store.sellOwned);
  const keepingCount = useGameStore(
    (store) =>
      store.state?.stable.filter((item) => item.pending?.type !== "sale").length ?? 0,
  );
  const battleOutcome = useBattleOutcome();
  const isOnline = useIsOnline();
  const [battle, setBattle] = useState<BattleResult | null>(null);

  const pokemon = owned ? pokemonFromOwned(owned) : null;
  const ownedBattleHistory = useMemo(
    () => battleHistory.filter((entry) => entry.ownedId === owned?.id),
    [battleHistory, owned?.id],
  );

  if (!pokemon || !owned) {
    return (
      <EmptyState fill title="Pokémon not found" body="This entry isn’t in your stable anymore." />
    );
  }

  const isPending = owned.pending !== null;
  const isLastPokemon = !isPending && keepingCount <= 1;
  const statusMessage = ownedStatusMessage({ owned, isOnline, isLastPokemon });

  return (
    <>
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

const useStyles = makeStyles((colors) => ({
  actions: {
    gap: 12,
  },
}));
