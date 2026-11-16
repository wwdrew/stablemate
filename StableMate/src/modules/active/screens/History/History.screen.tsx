import { LegendList } from "@legendapp/list/react-native";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { formatAmount, statusLabel, typeLabel } from "@/lib/ledger";
import {
  type LedgerEntry,
  useCash,
  useLedger,
  usePendingCredits,
} from "@/store/game";

function TransactionRow({ item }: { item: LedgerEntry }) {
  const positive = item.amount > 0;
  const status = statusLabel(item.status);

  return (
    <View style={[styles.row, item.status === "pending" && styles.rowPending]}>
        <View style={styles.rowCopy}>
          <Text style={styles.rowType}>
            {typeLabel(item.type)}
            {status ? (
              <Text
                style={
                  item.status === "pending" ? styles.statusPending : styles.statusFailed
                }
              >
                {` · ${status}`}
              </Text>
            ) : null}
          </Text>
          <Text style={styles.rowTitle}>{item.title}</Text>
          <Text style={styles.rowSubtitle}>{item.subtitle}</Text>
        </View>
        <View style={styles.amounts}>
          <Text
            style={[
              styles.amount,
              positive ? styles.amountIn : styles.amountOut,
              item.status === "pending" && styles.amountPending,
              item.status === "failed" && styles.amountFailed,
            ]}
          >
            {formatAmount(item.amount)}
          </Text>
          {item.balanceAfter !== null ? (
            <Text style={styles.balance}>Bal ${item.balanceAfter}</Text>
          ) : null}
        </View>
    </View>
  );
}

export function HistoryScreen() {
  const ledger = useLedger();
  const cash = useCash();
  const pendingCredits = usePendingCredits();

  // Pending first (like a bank app), then posted activity newest-first.
  const entries = useMemo(
    () => [
      ...ledger.filter((entry) => entry.status === "pending"),
      ...ledger.filter((entry) => entry.status !== "pending"),
    ],
    [ledger],
  );

  return (
    <LegendList
      data={entries}
      keyExtractor={(item) => item.id}
      recycleItems
      contentInsetAdjustmentBehavior="automatic"
      style={styles.list}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.subtitle}>
            Money in and out of your wallet. Every purchase, sale and prize
            lands here.
          </Text>
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Current balance</Text>
            <Text style={styles.balanceValue}>${cash}</Text>
            {pendingCredits > 0 ? (
              <Text style={styles.balancePending}>
                +${pendingCredits} pending from sales
              </Text>
            ) : null}
            <Text style={styles.balanceMeta}>
              {ledger.length === 1
                ? "1 transaction"
                : `${ledger.length} transactions`}
            </Text>
          </View>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No transactions yet</Text>
          <Text style={styles.emptyBody}>
            Win battle prizes or trade on the market — each cash movement shows
            up in this ledger.
          </Text>
        </View>
      }
      renderItem={({ item }) => <TransactionRow item={item} />}
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
  header: {
    gap: 16,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#78716C",
  },
  balanceCard: {
    borderWidth: 1,
    borderColor: "#E7E5E4",
    backgroundColor: "#FFFCF7",
    padding: 16,
    gap: 4,
  },
  balanceLabel: {
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "#A8A29E",
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1C1917",
  },
  balancePending: {
    fontSize: 13,
    fontWeight: "600",
    color: "#B45309",
  },
  balanceMeta: {
    fontSize: 13,
    color: "#78716C",
  },
  row: {
    backgroundColor: "#FFFCF7",
    borderWidth: 1,
    borderColor: "#E7E5E4",
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  rowPending: {
    borderStyle: "dashed",
    borderColor: "#A8A29E",
  },
  statusPending: {
    color: "#B45309",
  },
  statusFailed: {
    color: "#B91C1C",
  },
  rowCopy: {
    flex: 1,
    gap: 2,
  },
  rowType: {
    fontSize: 11,
    letterSpacing: 0.7,
    textTransform: "uppercase",
    color: "#A8A29E",
    fontWeight: "600",
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1917",
  },
  rowSubtitle: {
    fontSize: 13,
    color: "#78716C",
  },
  amounts: {
    alignItems: "flex-end",
    gap: 2,
  },
  amount: {
    fontSize: 16,
    fontWeight: "700",
  },
  amountIn: {
    color: "#15803D",
  },
  amountOut: {
    color: "#1C1917",
  },
  amountPending: {
    color: "#A8A29E",
  },
  amountFailed: {
    color: "#A8A29E",
    textDecorationLine: "line-through",
  },
  balance: {
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
});
