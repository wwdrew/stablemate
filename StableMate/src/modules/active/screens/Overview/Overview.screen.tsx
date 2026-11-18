import { ScrollView, Text, View } from "react-native";

import { STARTER_OPTIONS } from "@/constants/starters";
import { formatMoney, formatSignedMoney } from "@/lib/money";
import {
  useCash,
  useGameStore,
  useNetWorth,
  usePendingCredits,
  useRoundsPlayed,
} from "@/store/game";
import { makeStyles } from "@/theme/colors";

import { CashChart } from "./CashChart";
import { StatCard } from "./StatCard";

export function OverviewScreen() {
  const styles = useStyles();
  const starterId = useGameStore((store) => store.state?.starterId);
  const stableSize = useGameStore((store) => store.state?.stable.length ?? 0);
  const cash = useCash();
  const roundsPlayed = useRoundsPlayed();
  const netWorth = useNetWorth();
  const pendingCredits = usePendingCredits();

  const starter = STARTER_OPTIONS.find((option) => option.id === starterId);
  const pendingNote =
    pendingCredits > 0 ? ` · ${formatSignedMoney(pendingCredits)} sales pending` : "";

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
        <StatCard label="Cash" value={formatMoney(cash)} style={styles.half} />
        <StatCard label="Rounds played" value={String(roundsPlayed)} style={styles.half} />
      </View>

      <StatCard
        label="Net worth"
        value={formatMoney(netWorth)}
        meta={`Cash + stable at mark price${pendingNote}`}
      />

      <CashChart />

      <StatCard label="Starter" value={starter?.name ?? "—"} meta={starter?.type} />
      <StatCard label="Stable size" value={String(stableSize)} />
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
  row: {
    flexDirection: "row",
    gap: 12,
  },
  half: {
    flex: 1,
  },
}));
