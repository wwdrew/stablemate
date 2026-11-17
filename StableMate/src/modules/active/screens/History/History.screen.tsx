import { LegendList } from "@legendapp/list/react-native";
import { Link } from "expo-router";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { statusLabel, typeLabel } from "@/lib/ledger";
import { formatMoney, formatSignedMoney } from "@/lib/money";
import {
  type LedgerEntry,
  useCash,
  useLedger,
  usePendingCredits,
} from "@/store/game";
import { makeStyles } from "@/theme/colors";

function TransactionRow({ item }: { item: LedgerEntry }) {
  const styles = useStyles();
  const positive = item.amount > 0;
  const status = statusLabel(item.status);

  return (
    <Link
      href={{
        pathname: "/history/[entryId]",
        params: { entryId: item.id },
      }}
      asChild
    >
      <Pressable
        style={StyleSheet.flatten([
          styles.row,
          item.status === "pending" && styles.rowPending,
        ])}
      >
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
            {formatSignedMoney(item.amount)}
          </Text>
          {item.balanceAfter !== null ? (
            <Text style={styles.balance}>Bal {formatMoney(item.balanceAfter)}</Text>
          ) : null}
        </View>
      </Pressable>
    </Link>
  );
}

export function HistoryScreen() {
  const styles = useStyles();
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
            <Text style={styles.balanceValue}>{formatMoney(cash)}</Text>
            {pendingCredits > 0 ? (
              <Text style={styles.balancePending}>
                {formatSignedMoney(pendingCredits)} pending from sales
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

const useStyles = makeStyles((colors) => ({
  list: {
    flex: 1,
    backgroundColor: colors.background,
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
    color: colors.textSecondary,
  },
  balanceCard: {
    borderWidth: 1,
    borderColor: colors.separator,
    backgroundColor: colors.surface,
    padding: 16,
    gap: 4,
  },
  balanceLabel: {
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: colors.textTertiary,
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
  },
  balancePending: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.pending,
  },
  balanceMeta: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  row: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.separator,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  rowPending: {
    borderStyle: "dashed",
    borderColor: colors.textTertiary,
  },
  statusPending: {
    color: colors.pending,
  },
  statusFailed: {
    color: colors.negative,
  },
  rowCopy: {
    flex: 1,
    gap: 2,
  },
  rowType: {
    fontSize: 11,
    letterSpacing: 0.7,
    textTransform: "uppercase",
    color: colors.textTertiary,
    fontWeight: "600",
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  rowSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
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
    color: colors.positive,
  },
  amountOut: {
    color: colors.text,
  },
  amountPending: {
    color: colors.textTertiary,
  },
  amountFailed: {
    color: colors.textTertiary,
    textDecorationLine: "line-through",
  },
  balance: {
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
}));
