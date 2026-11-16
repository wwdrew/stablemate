import { LegendList } from "@legendapp/list/react-native";
import { Link } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useMarketLot } from "@/api/useMarketLot";
import type { MarketListing } from "@/api/marketLot";
import { formatMoney } from "@/lib/money";

function ListingRow({ item }: { item: MarketListing }) {
  const record = `${item.wins}W–${item.losses}L`;
  const types = item.types.join(" / ");

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
  priceBlock: {
    alignItems: "flex-end",
    gap: 2,
  },
  price: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1C1917",
  },
  listPrice: {
    fontSize: 12,
    color: "#A8A29E",
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
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7F4EF",
    padding: 24,
  },
});
