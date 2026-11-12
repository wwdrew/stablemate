import { useGameStore } from "@/store/game";
import { View, Text, StyleSheet } from "react-native";

export function RoundsDisplay() {
  const roundsPlayed = useGameStore((store) => store.state?.roundsPlayed);

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Rounds played</Text>
      <Text style={styles.value}>{roundsPlayed}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 10,
    padding: 10,
  },
  label: {
    fontSize: 12,
    color: "gray",
  },
  value: {
    fontSize: 16,
  },
});
