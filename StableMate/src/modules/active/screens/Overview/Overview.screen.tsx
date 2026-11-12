import { ScrollView, StyleSheet, Text, View } from "react-native";

import { STARTER_OPTIONS } from "@/constants/starters";
import { useGameStore } from "@/store/game";

/**
 * FUTURE — cash-over-time chart on Overview
 * - Height ≈ 50% of screen width
 * - Horizontal baseline through the vertical centre (black)
 * - Line chart of cash after each round (x = round, y = cash)
 * - Segment / stroke green while cash ≥ 0, red while cash < 0
 * - Needs round-by-round cash history in game state before this can ship
 */

export function OverviewScreen() {
  const state = useGameStore((store) => store.state);

  const starter = STARTER_OPTIONS.find(
    (option) => option.id === state?.starterId,
  );

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={styles.screen}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.subtitle}>Your stable at a glance.</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Cash</Text>
        <Text style={styles.value}>$0</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Rounds played</Text>
        <Text style={styles.value}>{state?.roundsPlayed ?? 0}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Starter</Text>
        <Text style={styles.value}>{starter?.name ?? "—"}</Text>
        <Text style={styles.meta}>{starter?.type ?? ""}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Stable size</Text>
        <Text style={styles.value}>{state?.stable?.length ?? 0}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F7F4EF",
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 12,
  },
  subtitle: {
    fontSize: 15,
    color: "#78716C",
    marginBottom: 4,
  },
  card: {
    backgroundColor: "#FFFCF7",
    borderWidth: 1,
    borderColor: "#E7E5E4",
    padding: 16,
    gap: 4,
  },
  label: {
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "#A8A29E",
  },
  value: {
    fontSize: 22,
    fontWeight: "600",
    color: "#1C1917",
  },
  meta: {
    fontSize: 14,
    color: "#78716C",
  },
});
