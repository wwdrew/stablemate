import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function BuyScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.title}>Buy</Text>
      <Text style={styles.subtitle}>This round’s market lot.</Text>

      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>No listings yet</Text>
        <Text style={styles.emptyBody}>
          Seeded lot Pokémon will land here. Tap through to inspect and
          purchase.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F7F4EF",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1C1917",
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 20,
    fontSize: 15,
    color: "#78716C",
  },
  empty: {
    borderWidth: 1,
    borderColor: "#E7E5E4",
    backgroundColor: "#FFFCF7",
    padding: 20,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1C1917",
  },
  emptyBody: {
    fontSize: 15,
    lineHeight: 22,
    color: "#57534E",
  },
});
