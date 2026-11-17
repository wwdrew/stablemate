import { ScrollView, Text, View } from "react-native";

import { STARTER_OPTIONS } from "@/constants/starters";
import { formatMoney, formatSignedMoney } from "@/lib/money";
import { useGameStore, useNetWorth, usePendingCredits } from "@/store/game";
import { makeStyles } from "@/theme/colors";

import { CashChart } from "./CashChart";
import { CashDisplay } from "./CashDisplay";
import { RoundsDisplay } from "./RoundsDisplay";

export function OverviewScreen() {
  const styles = useStyles();
  const state = useGameStore((store) => store.state);
  const netWorth = useNetWorth();
  const pendingCredits = usePendingCredits();

  const starter = STARTER_OPTIONS.find(
    (option) => option.id === state?.starterId,
  );

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={styles.screen}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.subtitle}>
        Wallet and stable at a glance. Cash movements live in History.
      </Text>

      <View style={styles.row}>
        <CashDisplay />
        <RoundsDisplay />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Net worth</Text>
        <Text style={styles.value}>{formatMoney(netWorth)}</Text>
        <Text style={styles.meta}>
          Cash + stable at mark price
          {pendingCredits > 0 ? ` · ${formatSignedMoney(pendingCredits)} sales pending` : ""}
        </Text>
      </View>

      <CashChart />

      <View style={styles.card}>
        <Text style={styles.label}>Starter</Text>
        <Text style={styles.value}>{starter?.name ?? "—"}</Text>
        <Text style={styles.meta}>{starter?.type ?? ""}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Stable size</Text>
        <Text style={styles.value}>{state?.stable?.length ?? 0}</Text>
      </View>
    </ScrollView>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 12,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.separator,
    padding: 16,
    gap: 4,
  },
  label: {
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: colors.textTertiary,
  },
  value: {
    fontSize: 22,
    fontWeight: "600",
    color: colors.text,
  },
  meta: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
}));
