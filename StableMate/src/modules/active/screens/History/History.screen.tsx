import { LegendList } from "@legendapp/list/react-native";
import { Link } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { SectionLabel } from "@/components/SectionLabel";
import { type SegmentOption, SegmentedControl } from "@/components/SegmentedControl";
import { useLargeText } from "@/lib/a11y";
import { filterLedger, type LedgerFilter, statusLabel, typeLabel } from "@/lib/ledger";
import { formatMoney, formatSignedMoney } from "@/lib/money";
import {
  type LedgerEntry,
  useCash,
  useLedger,
  usePendingCredits,
} from "@/store/game";
import { makeStyles } from "@/theme/colors";

const FILTER_OPTIONS: SegmentOption<LedgerFilter>[] = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "settled", label: "Settled" },
  { value: "failed", label: "Failed" },
];

const FILTER_EMPTY_COPY: Record<Exclude<LedgerFilter, "all">, string> = {
  open: "Nothing waiting to settle.",
  settled: "No settled transactions yet.",
  failed: "No failed transactions.",
};

function TransactionRow({ item }: { item: LedgerEntry }) {
  const styles = useStyles();
  const largeText = useLargeText();
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
          largeText && styles.rowStacked,
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
        <View style={[styles.amounts, largeText && styles.amountsStacked]}>
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
            <Text
              style={styles.balance}
              accessibilityLabel={`Balance ${formatMoney(item.balanceAfter)}`}
            >
              Bal {formatMoney(item.balanceAfter)}
            </Text>
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
  const [filter, setFilter] = useState<LedgerFilter>("all");

  const entries = useMemo(() => filterLedger(ledger, filter), [ledger, filter]);

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
          <Card style={styles.balanceCard}>
            <SectionLabel>Current balance</SectionLabel>
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
          </Card>
          {ledger.length > 0 ? (
            <SegmentedControl options={FILTER_OPTIONS} value={filter} onChange={setFilter} />
          ) : null}
        </View>
      }
      ListEmptyComponent={
        filter !== "all" && ledger.length > 0 ? (
          <EmptyState body={FILTER_EMPTY_COPY[filter]} />
        ) : (
          <EmptyState
            title="No transactions yet"
            body="Win battle prizes or trade on the market — each cash movement shows up in this ledger."
          />
        )
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
    gap: 4,
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
    color: colors.textSecondary,
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
  rowStacked: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  amountsStacked: {
    alignItems: "flex-start",
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
    color: colors.textSecondary,
  },
  amountFailed: {
    color: colors.textSecondary,
    textDecorationLine: "line-through",
  },
  balance: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  separator: {
    height: 10,
  },
}));
