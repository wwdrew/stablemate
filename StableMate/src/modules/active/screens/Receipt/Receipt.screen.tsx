import { ScrollView, StyleSheet, Text, View } from "react-native";

import { settlementFailureMessage } from "@/api/settlement";
import { typeLabel } from "@/lib/ledger";
import { formatMoney, formatSignedMoney } from "@/lib/money";
import type { LedgerEntry, TransactionStatus } from "@/store/game";

type ReceiptScreenProps = {
  entry: LedgerEntry | undefined;
};

const STATUS_COPY: Record<TransactionStatus, string> = {
  pending: "Pending",
  settled: "Settled",
  failed: "Failed",
};

function formatTimestamp(iso: string | null): string {
  if (!iso) {
    return "—";
  }
  return new Date(iso).toLocaleString();
}

function balanceCopy(entry: LedgerEntry): string {
  if (entry.balanceAfter !== null) {
    return formatMoney(entry.balanceAfter);
  }
  return entry.status === "failed" ? "Not credited" : "Credits on settlement";
}

export function ReceiptScreen({ entry }: ReceiptScreenProps) {
  if (!entry) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Transaction not found</Text>
        <Text style={styles.body}>This entry isn’t in your ledger anymore.</Text>
      </View>
    );
  }

  const rows: { label: string; value: string }[] = [
    { label: "Type", value: typeLabel(entry.type) },
    { label: "Status", value: STATUS_COPY[entry.status] },
    ...(entry.failureReason
      ? [{ label: "Reason", value: settlementFailureMessage(entry.failureReason) }]
      : []),
    { label: "Balance after", value: balanceCopy(entry) },
    { label: "Round", value: String(entry.round) },
    { label: "Created at", value: formatTimestamp(entry.createdAt) },
    {
      label: entry.status === "failed" ? "Failed at" : "Settled at",
      value: formatTimestamp(entry.settledAt),
    },
    { label: "Reference", value: entry.id },
  ];

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>{entry.title}</Text>
        <Text
          style={[
            styles.heroAmount,
            entry.status === "failed" && styles.heroAmountFailed,
          ]}
        >
          {formatSignedMoney(entry.amount)}
        </Text>
        <Text style={styles.heroSubtitle}>{entry.subtitle}</Text>
      </View>

      <View style={styles.card}>
        {rows.map((row) => (
          <View key={row.label} style={styles.row}>
            <Text style={styles.rowLabel}>{row.label}</Text>
            <Text style={styles.rowValue} selectable>
              {row.value}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: "#F7F4EF",
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 20,
  },
  hero: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 6,
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1C1917",
  },
  heroAmount: {
    fontSize: 36,
    fontWeight: "700",
    color: "#1C1917",
  },
  heroAmountFailed: {
    color: "#A8A29E",
    textDecorationLine: "line-through",
  },
  heroSubtitle: {
    fontSize: 15,
    color: "#78716C",
  },
  card: {
    borderWidth: 1,
    borderColor: "#E7E5E4",
    backgroundColor: "#FFFCF7",
    padding: 16,
    gap: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  rowLabel: {
    fontSize: 15,
    color: "#78716C",
  },
  rowValue: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#1C1917",
    textAlign: "right",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    gap: 8,
    backgroundColor: "#F7F4EF",
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1C1917",
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: "#57534E",
  },
});
