import { LegendList } from "@legendapp/list/react-native";
import { Link } from "expo-router";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { useMarketLot } from "@/api/useMarketLot";
import type { MarketListing } from "@/api/marketLot";
import { formatMoney } from "@/lib/money";
import { formatTypes } from "@/lib/pokemon";
import { makeStyles } from "@/theme/colors";

function ListingRow({ item }: { item: MarketListing }) {
  const styles = useStyles();
  const record = `${item.wins}W–${item.losses}L`;
  const types = formatTypes(item.types);

  return (
    <Link
      href={{
        pathname: "/buy/[listingId]",
        params: { listingId: item.id },
      }}
      asChild
    >
      <Pressable style={styles.row}>
        <View style={styles.rowCopy}>
          <Text style={styles.rowName}>{item.name}</Text>
          <Text style={styles.rowMeta}>
            {types} · {record}
          </Text>
        </View>
        <View style={styles.priceBlock}>
          <Text style={styles.price}>{formatMoney(item.markPrice)}</Text>
          {item.markPrice !== item.listPrice ? (
            <Text style={styles.listPrice}>list {formatMoney(item.listPrice)}</Text>
          ) : null}
        </View>
      </Pressable>
    </Link>
  );
}

export function BuyScreen() {
  const styles = useStyles();
  const { data: listings = [], isPending, isError } = useMarketLot();

  if (isPending) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>Couldn’t load market lot</Text>
      </View>
    );
  }

  return (
    <LegendList
      data={listings}
      keyExtractor={(item) => item.id}
      recycleItems
      contentInsetAdjustmentBehavior="automatic"
      style={styles.list}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={
        <Text style={styles.subtitle}>
          This round’s market lot · {listings.length} for sale
        </Text>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No listings yet</Text>
          <Text style={styles.emptyBody}>
            Seeded lot Pokémon will land here. Tap through to inspect and
            purchase.
          </Text>
        </View>
      }
      renderItem={({ item }) => <ListingRow item={item} />}
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
  priceBlock: {
    alignItems: "flex-end",
    gap: 2,
  },
  price: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  listPrice: {
    fontSize: 12,
    color: colors.textTertiary,
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
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    padding: 24,
  },
}));
