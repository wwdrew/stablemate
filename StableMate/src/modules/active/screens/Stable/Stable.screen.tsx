import { Link } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { getSpeciesBySlug } from "@/data/catalog";
import { recordLabel, useLargeText } from "@/lib/a11y";
import { formatMoney } from "@/lib/money";
import { formatTypes } from "@/lib/pokemon";
import { type OwnedPokemon, useStable } from "@/store/game";
import { makeStyles } from "@/theme/colors";

function StableRow({ item }: { item: OwnedPokemon }) {
  const styles = useStyles();
  const largeText = useLargeText();
  const species = getSpeciesBySlug(item.speciesId);
  const record = `${item.wins}W–${item.losses}L`;
  const types = species ? formatTypes(species.types) : "—";
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
        style={StyleSheet.flatten([
          styles.row,
          pendingLabel && styles.rowPending,
          largeText && styles.rowStacked,
        ])}
      >
        <View style={styles.rowCopy}>
          <Text style={styles.rowName}>
            {species?.name ?? item.speciesId}
          </Text>
          <Text
            style={styles.rowMeta}
            accessibilityLabel={`${types}, ${recordLabel(item.wins, item.losses)}`}
          >
            {types} · {record}
          </Text>
          {pendingLabel ? (
            <Text style={styles.rowPendingLabel}>{pendingLabel}</Text>
          ) : null}
        </View>
        <Text style={styles.rowPrice}>{formatMoney(item.markPrice)}</Text>
      </Pressable>
    </Link>
  );
}

export function StableScreen() {
  const styles = useStyles();
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

const useStyles = makeStyles((colors) => ({
  list: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  subtitle: {
    marginBottom: 16,
    fontSize: 15,
    color: colors.textSecondary,
  },
  row: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.separator,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rowPending: {
    borderStyle: "dashed",
    borderColor: colors.textTertiary,
  },
  rowPendingLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: colors.pending,
  },
  rowCopy: {
    flex: 1,
    gap: 4,
  },
  rowName: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.text,
  },
  rowMeta: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  rowStacked: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  rowPrice: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  separator: {
    height: 10,
  },
  empty: {
    borderWidth: 1,
    borderColor: colors.separator,
    backgroundColor: colors.surface,
    padding: 20,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.text,
  },
  emptyBody: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
}));
