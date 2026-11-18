import { ScrollView, Text, View } from "react-native";

import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { typeLabel } from "@/lib/ledger";
import { formatMoney, formatSignedMoney } from "@/lib/money";
import type { TimelineStep } from "@/lib/timeline";
import type { LedgerEntry, TransactionStatus } from "@/store/game";
import { makeStyles } from "@/theme/colors";

import { ReceiptTimeline } from "./ReceiptTimeline";

type ReceiptScreenProps = {
  entry: LedgerEntry | undefined;
  timeline: TimelineStep[];
};

const STATUS_COPY: Record<TransactionStatus, string> = {
  pending: "Pending",
  settled: "Settled",
  failed: "Failed",
};

function balanceCopy(entry: LedgerEntry): string {
  if (entry.balanceAfter !== null) {
    return formatMoney(entry.balanceAfter);
  }
  return entry.status === "failed" ? "Not credited" : "Credits on settlement";
}

export function ReceiptScreen({ entry, timeline }: ReceiptScreenProps) {
  const styles = useStyles();
  if (!entry) {
    return (
      <EmptyState fill title="Transaction not found" body="This entry isn’t in your ledger anymore." />
    );
  }

  const rows: { label: string; value: string }[] = [
    { label: "Type", value: typeLabel(entry.type) },
    { label: "Status", value: STATUS_COPY[entry.status] },
    { label: "Balance after", value: balanceCopy(entry) },
    { label: "Round", value: String(entry.round) },
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

      <ReceiptTimeline steps={timeline} />

      <Card style={styles.details}>
        {rows.map((row) => (
          <View key={row.label} style={styles.row}>
            <Text style={styles.rowLabel}>{row.label}</Text>
            <Text style={styles.rowValue} selectable>
              {row.value}
            </Text>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}

const useStyles = makeStyles((colors) => ({
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
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
    color: colors.text,
  },
  heroAmount: {
    fontSize: 36,
    fontWeight: "700",
    color: colors.text,
  },
  heroAmountFailed: {
    color: colors.textSecondary,
    textDecorationLine: "line-through",
  },
  heroSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  details: {
    gap: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  rowLabel: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  rowValue: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
    textAlign: "right",
  },
}));
