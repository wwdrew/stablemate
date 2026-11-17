import { Alert, Pressable, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useGameStore } from "@/store/game";
import {
  type BattleOutcome,
  type SettlementOutcome,
  useBattleOutcome,
  useIsOnline,
  useSettingsStore,
  useSettlementOutcome,
} from "@/store/settings";
import { makeStyles, useColors } from "@/theme/colors";

type SegmentOption<T extends string> = { value: T; label: string };

const BATTLE_OUTCOME_OPTIONS: SegmentOption<BattleOutcome>[] = [
  { value: "random", label: "Random" },
  { value: "win", label: "Always win" },
  { value: "lose", label: "Always lose" },
];

const SETTLEMENT_OUTCOME_OPTIONS: SegmentOption<SettlementOutcome>[] = [
  { value: "random", label: "Random" },
  { value: "succeed", label: "Always settle" },
  { value: "fail", label: "Always fail" },
];

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  const styles = useStyles();
  return (
    <View style={styles.segmented}>
      {options.map((option) => {
        const selected = value === option.value;

        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[styles.segment, selected && styles.segmentSelected]}
          >
            <Text
              style={[
                styles.segmentLabel,
                selected && styles.segmentLabelSelected,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function OptionsScreen() {
  const styles = useStyles();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isOnline = useIsOnline();
  const setIsOnline = useSettingsStore((store) => store.setIsOnline);
  const battleOutcome = useBattleOutcome();
  const setBattleOutcome = useSettingsStore((store) => store.setBattleOutcome);
  const settlementOutcome = useSettlementOutcome();
  const setSettlementOutcome = useSettingsStore(
    (store) => store.setSettlementOutcome,
  );
  const clearState = useGameStore((store) => store.clearState);

  const confirmReset = () =>
    Alert.alert(
      "Reset game?",
      "This clears your stable, cash and history. Your network setting is kept.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Reset", style: "destructive", onPress: clearState },
      ],
    );

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.title}>Options</Text>
      <Text style={styles.subtitle}>Demo controls and game settings.</Text>

      <View style={styles.row}>
        <View style={styles.rowCopy}>
          <Text style={styles.rowTitle}>Simulate network</Text>
          <Text style={styles.rowBody}>
            {isOnline
              ? "Online — buys and sales settle in a moment."
              : "Offline — buys and sales queue until you go online."}
          </Text>
        </View>
        <Switch
          accessibilityLabel="Network"
          value={isOnline}
          onValueChange={setIsOnline}
          trackColor={{ false: colors.fill, true: colors.accent }}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Battle outcome</Text>
        <SegmentedControl
          options={BATTLE_OUTCOME_OPTIONS}
          value={battleOutcome}
          onChange={setBattleOutcome}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Settlement outcome</Text>
        <SegmentedControl
          options={SETTLEMENT_OUTCOME_OPTIONS}
          value={settlementOutcome}
          onChange={setSettlementOutcome}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Danger zone</Text>
        <Pressable onPress={confirmReset} style={styles.dangerButton}>
          <Text style={styles.dangerLabel}>Reset game</Text>
          <Text style={styles.dangerHint}>
            Clears your stable and returns to onboarding.
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.separator,
    padding: 16,
  },
  rowCopy: {
    flex: 1,
    gap: 4,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  rowBody: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: colors.textTertiary,
  },
  segmented: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: colors.separator,
    backgroundColor: colors.surface,
  },
  segment: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  segmentSelected: {
    backgroundColor: colors.accent,
  },
  segmentLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  segmentLabelSelected: {
    color: colors.onAccent,
  },
  dangerButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.separator,
    padding: 16,
    gap: 4,
  },
  dangerLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.negative,
  },
  dangerHint: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
}));
