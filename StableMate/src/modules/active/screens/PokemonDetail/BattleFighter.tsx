import { Image } from "expo-image";
import { StyleSheet } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

import { DISPLAY_MAX_SCALE } from "@/lib/a11y";

import type { FighterMotion } from "./battleMotion";

type BattleFighterProps = {
  name: string;
  sprites: { artwork: string | null; default: string | null };
  motion: FighterMotion;
  /** The player stands front-left; the challenger stands back-right, facing them. */
  side: "player" | "challenger";
  /** Dimmed instead of knocked out, when Reduce Motion skips the fight. */
  defeated: boolean;
};

export function BattleFighter({ name, sprites, motion, side, defeated }: BattleFighterProps) {
  const isPlayer = side === "player";
  const art = sprites.artwork ?? sprites.default;

  const moveStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: motion.x.value },
      { translateY: motion.y.value + motion.flyY.value },
    ],
  }));

  const artStyle = useAnimatedStyle(() => ({
    transform: [
      ...(isPlayer ? [] : [{ scaleX: -1 }]),
      { rotate: `${motion.rotate.value}deg` },
    ],
  }));

  const nameStyle = useAnimatedStyle(() => ({
    opacity: motion.nameOpacity.value,
  }));

  return (
    <Animated.View
      style={[
        isPlayer ? styles.playerSlot : styles.challengerSlot,
        moveStyle,
        defeated && styles.defeated,
      ]}
    >
      <Animated.View style={artStyle}>
        {art ? (
          <Image
            source={{ uri: art }}
            style={isPlayer ? styles.playerArt : styles.challengerArt}
            contentFit="contain"
          />
        ) : null}
      </Animated.View>
      <Animated.Text
        style={[isPlayer ? styles.playerName : styles.challengerName, nameStyle]}
        maxFontSizeMultiplier={DISPLAY_MAX_SCALE}
      >
        {name}
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  defeated: {
    opacity: 0.35,
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
});
