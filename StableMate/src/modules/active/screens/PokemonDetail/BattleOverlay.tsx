import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { CatalogSpecies } from "@/data/catalog.schema";
import { prizeMoneyForWin } from "@/modules/active/screens/PokemonDetail/battle";
import type { PokemonInstance } from "@/modules/active/screens/PokemonDetail/pokemonInstance";

type BattleOverlayProps = {
  player: PokemonInstance;
  challenger: CatalogSpecies;
  playerWins: boolean;
  onFinished: () => void;
};

const INTRO = 800;
const HIT = 240;
const RECOVER = 240;
const SHAKE_STEP = 70;
const SHAKE_TOTAL = SHAKE_STEP * 3;
const PAUSE = 900;
const KO_UP = 560;
const KO_DOWN = 700;

function spriteUri(sprites: {
  artwork: string | null;
  default: string | null;
}) {
  return sprites.artwork ?? sprites.default;
}

function easeOut(to: number, duration: number) {
  return withTiming(to, { duration, easing: Easing.out(Easing.quad) });
}

function easeInOut(to: number, duration: number) {
  return withTiming(to, { duration, easing: Easing.inOut(Easing.quad) });
}

function shakeX() {
  return withSequence(
    withTiming(12, { duration: SHAKE_STEP, easing: Easing.linear }),
    withTiming(-12, { duration: SHAKE_STEP, easing: Easing.linear }),
    withTiming(0, { duration: SHAKE_STEP, easing: Easing.linear }),
  );
}

function shakeY() {
  return withSequence(
    withTiming(-8, { duration: SHAKE_STEP, easing: Easing.linear }),
    withTiming(8, { duration: SHAKE_STEP, easing: Easing.linear }),
    withTiming(0, { duration: SHAKE_STEP, easing: Easing.linear }),
  );
}

export function BattleOverlay({
  player,
  challenger,
  playerWins,
  onFinished,
}: BattleOverlayProps) {
  const insets = useSafeAreaInsets();
  const [showResult, setShowResult] = useState(false);

  const backdrop = useSharedValue(0);
  const playerX = useSharedValue(0);
  const playerY = useSharedValue(0);
  const playerFlyY = useSharedValue(0);
  const playerRotate = useSharedValue(0);
  const playerNameOpacity = useSharedValue(1);
  const challengerX = useSharedValue(0);
  const challengerY = useSharedValue(0);
  const challengerFlyY = useSharedValue(0);
  const challengerRotate = useSharedValue(0);
  const challengerNameOpacity = useSharedValue(1);
  const resultOpacity = useSharedValue(0);

  const winnerName = playerWins ? player.name : challenger.name;
  const prizeMoney = playerWins ? prizeMoneyForWin(challenger) : 0;

  useEffect(() => {
    const hit1At = INTRO;
    const hit1Done = hit1At + HIT + RECOVER;
    const hit2At = hit1Done + PAUSE;
    const hit2Done = hit2At + HIT + RECOVER;
    const hit3At = hit2Done + PAUSE;
    const hit3Done = hit3At + HIT + RECOVER;
    const koAt = hit3Done + 220;

    backdrop.value = withTiming(1, { duration: 280 });

    // --- Player movement ---
    // Hit 1 lunge, pause, hit 2 get shaken, pause, optional hit 3 lunge
    playerX.value = withSequence(
      withDelay(hit1At, easeOut(56, HIT)),
      easeInOut(0, RECOVER),
      withDelay(PAUSE + HIT, shakeX()),
      withDelay(
        RECOVER + PAUSE - SHAKE_TOTAL,
        playerWins ? easeOut(72, HIT) : withTiming(0, { duration: 1 }),
      ),
      playerWins ? easeInOut(0, RECOVER) : withTiming(0, { duration: 1 }),
    );
    playerY.value = withSequence(
      withDelay(hit1At, easeOut(-40, HIT)),
      easeInOut(0, RECOVER),
      withDelay(PAUSE + HIT, shakeY()),
      withDelay(
        RECOVER + PAUSE - SHAKE_TOTAL,
        playerWins ? easeOut(-52, HIT) : withTiming(0, { duration: 1 }),
      ),
      playerWins ? easeInOut(0, RECOVER) : withTiming(0, { duration: 1 }),
    );

    // --- Challenger movement ---
    // Hit 1 get shaken, pause, hit 2 lunge, pause, optional hit 3 lunge
    challengerX.value = withSequence(
      withDelay(hit1At + HIT, shakeX()),
      withDelay(PAUSE + RECOVER - SHAKE_TOTAL, easeOut(-56, HIT)),
      easeInOut(0, RECOVER),
      withDelay(
        PAUSE,
        playerWins ? withTiming(0, { duration: 1 }) : easeOut(-72, HIT),
      ),
      playerWins ? withTiming(0, { duration: 1 }) : easeInOut(0, RECOVER),
    );
    challengerY.value = withSequence(
      withDelay(hit1At + HIT, shakeY()),
      withDelay(PAUSE + RECOVER - SHAKE_TOTAL, easeOut(40, HIT)),
      easeInOut(0, RECOVER),
      withDelay(
        PAUSE,
        playerWins ? withTiming(0, { duration: 1 }) : easeOut(52, HIT),
      ),
      playerWins ? withTiming(0, { duration: 1 }) : easeInOut(0, RECOVER),
    );

    // --- KO: gravity toss (rise decelerates, fall accelerates) + spin ---
    if (playerWins) {
      challengerNameOpacity.value = withDelay(
        koAt,
        withTiming(0, { duration: 140 }),
      );
      challengerFlyY.value = withDelay(
        koAt,
        withSequence(
          withTiming(-230, {
            duration: KO_UP,
            easing: Easing.out(Easing.cubic),
          }),
          withTiming(560, {
            duration: KO_DOWN,
            easing: Easing.in(Easing.cubic),
          }),
        ),
      );
      challengerRotate.value = withDelay(
        koAt,
        withTiming(720, {
          duration: KO_UP + KO_DOWN,
          easing: Easing.inOut(Easing.quad),
        }),
      );
    } else {
      playerNameOpacity.value = withDelay(
        koAt,
        withTiming(0, { duration: 140 }),
      );
      playerFlyY.value = withDelay(
        koAt,
        withSequence(
          withTiming(-230, {
            duration: KO_UP,
            easing: Easing.out(Easing.cubic),
          }),
          withTiming(560, {
            duration: KO_DOWN,
            easing: Easing.in(Easing.cubic),
          }),
        ),
      );
      playerRotate.value = withDelay(
        koAt,
        withTiming(720, {
          duration: KO_UP + KO_DOWN,
          easing: Easing.inOut(Easing.quad),
        }),
      );
    }

    const resultAt = koAt + KO_UP + KO_DOWN + 250;
    const timeout = setTimeout(() => {
      setShowResult(true);
      resultOpacity.value = withTiming(1, { duration: 280 });
    }, resultAt);

    return () => clearTimeout(timeout);
  }, [
    backdrop,
    challengerFlyY,
    challengerNameOpacity,
    challengerRotate,
    challengerX,
    challengerY,
    playerFlyY,
    playerNameOpacity,
    playerRotate,
    playerWins,
    playerX,
    playerY,
    resultOpacity,
  ]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdrop.value,
  }));

  const playerMoveStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: playerX.value },
      { translateY: playerY.value + playerFlyY.value },
    ],
  }));

  const playerArtStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${playerRotate.value}deg` }],
  }));

  const playerNameStyle = useAnimatedStyle(() => ({
    opacity: playerNameOpacity.value,
  }));

  const challengerMoveStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: challengerX.value },
      { translateY: challengerY.value + challengerFlyY.value },
    ],
  }));

  const challengerArtStyle = useAnimatedStyle(() => ({
    transform: [
      { scaleX: -1 },
      { rotate: `${challengerRotate.value}deg` },
    ],
  }));

  const challengerNameStyle = useAnimatedStyle(() => ({
    opacity: challengerNameOpacity.value,
  }));

  const resultStyle = useAnimatedStyle(() => ({
    opacity: resultOpacity.value,
  }));

  const playerArt = spriteUri(player.sprites);
  const challengerArt = spriteUri(challenger.sprites);

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

          <Animated.View style={[styles.challengerSlot, challengerMoveStyle]}>
            <Animated.View style={challengerArtStyle}>
              {challengerArt ? (
                <Image
                  source={{ uri: challengerArt }}
                  style={styles.challengerArt}
                  contentFit="contain"
                />
              ) : null}
            </Animated.View>
            <Animated.Text style={[styles.challengerName, challengerNameStyle]}>
              {challenger.name}
            </Animated.Text>
          </Animated.View>

          <Animated.View style={[styles.playerSlot, playerMoveStyle]}>
            <Animated.View style={playerArtStyle}>
              {playerArt ? (
                <Image
                  source={{ uri: playerArt }}
                  style={styles.playerArt}
                  contentFit="contain"
                />
              ) : null}
            </Animated.View>
            <Animated.Text style={[styles.playerName, playerNameStyle]}>
              {player.name}
            </Animated.Text>
          </Animated.View>

          {showResult ? (
            <Animated.View style={[styles.resultCard, resultStyle]}>
              <Text style={styles.resultTitle}>{winnerName} wins</Text>
              {playerWins ? (
                <Text style={styles.resultPrize}>Prize +${prizeMoney}</Text>
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
  challengerSlot: {
    position: "absolute",
    top: "18%",
    right: 28,
    alignItems: "center",
    gap: 6,
  },
  challengerArt: {
    width: 96,
    height: 96,
  },
  challengerName: {
    color: "#D6D3D1",
    fontSize: 13,
    fontWeight: "600",
  },
  playerSlot: {
    position: "absolute",
    left: 20,
    bottom: "12%",
    alignItems: "center",
    gap: 8,
  },
  playerArt: {
    width: 168,
    height: 168,
  },
  playerName: {
    color: "#FFFCF7",
    fontSize: 17,
    fontWeight: "700",
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
