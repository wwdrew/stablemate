import { FlatList, StyleSheet, Text, View } from "react-native";

import { STARTER_OPTIONS } from "@/constants/starters";
import { type OwnedPokemon, useGameStore } from "@/store/game";

function StableRow({ item }: { item: OwnedPokemon }) {
  const species = STARTER_OPTIONS.find(
    (option) => option.id === item.speciesId,
  );

  return (
    <View style={styles.row}>
      <Text style={styles.rowName}>{species?.name ?? item.speciesId}</Text>
      <Text style={styles.rowType}>{species?.type ?? "—"}</Text>
    </View>
  );
}

export function StableScreen() {
  const stable = useGameStore((store) => store.state?.stable ?? []);

  return (
    <FlatList
      data={stable}
      keyExtractor={(item) => item.id}
      contentInsetAdjustmentBehavior="automatic"
      style={styles.list}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={
        <Text style={styles.subtitle}>
          {stable.length === 1
            ? "1 Pokémon owned"
            : `${stable.length} Pokémon owned`}
        </Text>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Empty stable</Text>
          <Text style={styles.emptyBody}>
            Buy from the market to grow your roster.
          </Text>
        </View>
      }
      renderItem={({ item }) => <StableRow item={item} />}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: "#F7F4EF",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  subtitle: {
    marginBottom: 16,
    fontSize: 15,
    color: "#78716C",
  },
  row: {
    backgroundColor: "#FFFCF7",
    borderWidth: 1,
    borderColor: "#E7E5E4",
    padding: 16,
    gap: 4,
  },
  rowName: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1C1917",
  },
  rowType: {
    fontSize: 13,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "#78716C",
  },
  separator: {
    height: 10,
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
