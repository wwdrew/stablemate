import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { CatalogSpecies } from "@/data/catalog.schema";
import { formatSignedMoney } from "@/lib/money";
import { usePrefersReducedMotion } from "@/lib/motion";
import type { PokemonInstance } from "@/modules/active/screens/PokemonDetail/pokemonInstance";

import { BattleFighter } from "./BattleFighter";
import { playBattle, useFighterMotion } from "./battleMotion";

type BattleOverlayProps = {
  player: PokemonInstance;
  challenger: CatalogSpecies;
  playerWins: boolean;
  prizeMoney: number;
  onFinished: () => void;
};

export function BattleOverlay({
  player,
  challenger,
  playerWins,
  prizeMoney,
  onFinished,
}: BattleOverlayProps) {
  const insets = useSafeAreaInsets();
  // With Reduce Motion on, skip the fight: show the result at once and dim the loser.
  const reduceMotion = usePrefersReducedMotion();
  const [showResult, setShowResult] = useState(reduceMotion);

  const backdrop = useSharedValue(0);
  const resultOpacity = useSharedValue(reduceMotion ? 1 : 0);
  const playerMotion = useFighterMotion();
  const challengerMotion = useFighterMotion();

  const winnerName = playerWins ? player.name : challenger.name;

  useEffect(() => {
    backdrop.value = withTiming(1, { duration: 280 });
    if (reduceMotion) {
      return;
    }

    const resultAt = playBattle(playerMotion, challengerMotion, playerWins);
    const timeout = setTimeout(() => {
      setShowResult(true);
      resultOpacity.value = withTiming(1, { duration: 280 });
    }, resultAt);

    return () => clearTimeout(timeout);
  }, [backdrop, challengerMotion, playerMotion, playerWins, reduceMotion, resultOpacity]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdrop.value,
  }));

  const resultStyle = useAnimatedStyle(() => ({
    opacity: resultOpacity.value,
  }));

  return (
    <Modal
      transparent
      visible
      animationType="none"
      statusBarTranslucent
      onRequestClose={onFinished}
    >
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, backdropStyle]} />

        <View
          style={[
            styles.stage,
            {
              paddingTop: insets.top + 24,
              paddingBottom: insets.bottom + 24,
            },
          ]}
        >
          <Text style={styles.banner}>Battle</Text>

          <BattleFighter
            side="challenger"
            name={challenger.name}
            sprites={challenger.sprites}
            motion={challengerMotion}
            defeated={reduceMotion && playerWins}
          />
          <BattleFighter
            side="player"
            name={player.name}
            sprites={player.sprites}
            motion={playerMotion}
            defeated={reduceMotion && !playerWins}
          />

          {showResult ? (
            <Animated.View style={[styles.resultCard, resultStyle]}>
              <Text style={styles.resultTitle}>{winnerName} wins</Text>
              {playerWins ? (
                <Text style={styles.resultPrize}>Prize {formatSignedMoney(prizeMoney)}</Text>
              ) : (
                <Text style={styles.resultPrize}>No prize this round</Text>
              )}
              <Pressable
                accessibilityRole="button"
                onPress={onFinished}
                style={({ pressed }) => [
                  styles.continueButton,
                  pressed && styles.continuePressed,
                ]}
              >
                <Text style={styles.continueLabel}>Continue</Text>
              </Pressable>
            </Animated.View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(28, 25, 23, 0.88)",
  },
  stage: {
    flex: 1,
    paddingHorizontal: 20,
  },
  banner: {
    alignSelf: "center",
    color: "#FFFCF7",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  resultCard: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: "38%",
    backgroundColor: "#FFFCF7",
    paddingHorizontal: 20,
    paddingVertical: 22,
    gap: 10,
    alignItems: "center",
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1C1917",
    textAlign: "center",
  },
  resultPrize: {
    fontSize: 16,
    color: "#57534E",
    marginBottom: 8,
  },
  continueButton: {
    alignSelf: "stretch",
    backgroundColor: "#1C1917",
    paddingVertical: 14,
    alignItems: "center",
  },
  continuePressed: {
    opacity: 0.85,
  },
  continueLabel: {
    color: "#FFFCF7",
    fontSize: 17,
    fontWeight: "600",
  },
});
