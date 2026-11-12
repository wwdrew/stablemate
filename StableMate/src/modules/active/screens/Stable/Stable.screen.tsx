import { LegendList } from "@legendapp/list/react-native";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  const insets = useSafeAreaInsets();
  const stable = useGameStore((store) => store.state?.stable ?? []);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.title}>Stable</Text>
      <Text style={styles.subtitle}>
        {stable.length === 1
          ? "1 Pokémon owned"
          : `${stable.length} Pokémon owned`}
      </Text>

      <LegendList
        data={stable}
        keyExtractor={(item) => item.id}
        recycleItems
        style={styles.list}
        contentContainerStyle={styles.listContent}
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
    marginBottom: 16,
    fontSize: 15,
    color: "#78716C",
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 24,
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
