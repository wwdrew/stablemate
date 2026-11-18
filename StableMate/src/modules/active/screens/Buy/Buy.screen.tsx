import { LegendList } from "@legendapp/list/react-native";
import { Link } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import type { MarketListing } from "@/api/marketLot";
import { useMarketLot } from "@/api/useMarketLot";
import { EmptyState } from "@/components/EmptyState";
import { useLargeText } from "@/lib/a11y";
import { formatMoney } from "@/lib/money";
import { formatTypes, typesAndRecord } from "@/lib/pokemon";
import { makeStyles } from "@/theme/colors";

function ListingRow({ item }: { item: MarketListing }) {
  const styles = useStyles();
  const largeText = useLargeText();
  const meta = typesAndRecord(formatTypes(item.types), item.wins, item.losses);

  return (
    <Link
      href={{
        pathname: "/buy/[listingId]",
        params: { listingId: item.id },
      }}
      asChild
    >
      <Pressable style={StyleSheet.flatten([styles.row, largeText && styles.rowStacked])}>
        <View style={styles.rowCopy}>
          <Text style={styles.rowName}>{item.name}</Text>
          <Text
            style={styles.rowMeta}
            accessibilityLabel={meta.label}
          >
            {meta.text}
          </Text>
        </View>
        <View style={[styles.priceBlock, largeText && styles.priceBlockStacked]}>
          <Text style={styles.price}>{formatMoney(item.markPrice)}</Text>
          {item.markPrice !== item.listPrice ? (
            <Text
              style={styles.listPrice}
              accessibilityLabel={`list price ${formatMoney(item.listPrice)}`}
            >
              list {formatMoney(item.listPrice)}
            </Text>
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
      <EmptyState fill title="Couldn’t load market lot" />
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
        <EmptyState
          title="No listings yet"
          body="Seeded lot Pokémon will land here. Tap through to inspect and purchase."
        />
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
  rowStacked: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  priceBlockStacked: {
    alignItems: "flex-start",
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
    color: colors.textSecondary,
  },
  separator: {
    height: 10,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    padding: 24,
  },
}));
