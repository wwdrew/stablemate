import { Link } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { getSpeciesBySlug } from "@/data/catalog";
import { type OwnedPokemon, useStable } from "@/store/game";

function StableRow({ item }: { item: OwnedPokemon }) {
  const species = getSpeciesBySlug(item.speciesId);
  const record = `${item.wins}W–${item.losses}L`;
  const pendingLabel =
    item.pending?.type === "sale"
      ? "Selling · pending"
      : item.pending?.type === "purchase"
        ? "Buying · pending"
        : null;

  return (
    <Link
      href={{
        pathname: "/stable/[ownedId]",
        params: { ownedId: item.id },
      }}
      asChild
    >
      <Pressable
        style={StyleSheet.flatten([styles.row, pendingLabel && styles.rowPending])}
      >
        <View style={styles.rowCopy}>
          <Text style={styles.rowName}>
            {species?.name ?? item.speciesId}
          </Text>
          <Text style={styles.rowMeta}>
            {species?.types.join(" / ") ?? "—"} · {record}
          </Text>
          {pendingLabel ? (
            <Text style={styles.rowPendingLabel}>{pendingLabel}</Text>
          ) : null}
        </View>
        <Text style={styles.rowPrice}>${item.markPrice}</Text>
      </Pressable>
    </Link>
  );
}

export function StableScreen() {
  const stable = useStable();

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
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rowPending: {
    borderStyle: "dashed",
    borderColor: "#A8A29E",
  },
  rowPendingLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "#B45309",
  },
  rowCopy: {
    flex: 1,
    gap: 4,
  },
  rowName: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1C1917",
  },
  rowMeta: {
    fontSize: 13,
    color: "#78716C",
    textTransform: "capitalize",
  },
  rowPrice: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1C1917",
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
