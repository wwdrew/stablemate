import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useGameStore } from "@/store/game";
import {
  type BattleOutcome,
  useBattleOutcome,
  useIsOnline,
  useSettingsStore,
} from "@/store/settings";

const BATTLE_OUTCOME_OPTIONS: { value: BattleOutcome; label: string }[] = [
  { value: "random", label: "Random" },
  { value: "win", label: "Always win" },
  { value: "lose", label: "Always lose" },
];

export function OptionsScreen() {
  const insets = useSafeAreaInsets();
  const isOnline = useIsOnline();
  const setIsOnline = useSettingsStore((store) => store.setIsOnline);
  const battleOutcome = useBattleOutcome();
  const setBattleOutcome = useSettingsStore((store) => store.setBattleOutcome);
  const clearState = useGameStore((store) => store.clearState);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.title}>Options</Text>
      <Text style={styles.subtitle}>Demo controls and game settings.</Text>

      <View style={styles.row}>
        <View style={styles.rowCopy}>
          <Text style={styles.rowTitle}>Simulate network</Text>
          <Text style={styles.rowBody}>
            {isOnline
              ? "Online — buys settle immediately."
              : "Offline — buys queue until you go online."}
          </Text>
        </View>
        <Switch
          value={isOnline}
          onValueChange={setIsOnline}
          trackColor={{ false: "#D6D3D1", true: "#1C1917" }}
          thumbColor="#FAFAF9"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Battle outcome</Text>
        <View style={styles.segmented}>
          {BATTLE_OUTCOME_OPTIONS.map((option) => {
            const selected = battleOutcome === option.value;

            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setBattleOutcome(option.value)}
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
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Danger zone</Text>
        <Pressable onPress={clearState} style={styles.dangerButton}>
          <Text style={styles.dangerLabel}>Reset game</Text>
          <Text style={styles.dangerHint}>
            Clears your stable and returns to onboarding.
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F7F4EF",
    paddingHorizontal: 20,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1C1917",
  },
  subtitle: {
    fontSize: 15,
    color: "#78716C",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: "#FFFCF7",
    borderWidth: 1,
    borderColor: "#E7E5E4",
    padding: 16,
  },
  rowCopy: {
    flex: 1,
    gap: 4,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1917",
  },
  rowBody: {
    fontSize: 14,
    lineHeight: 20,
    color: "#78716C",
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "#A8A29E",
  },
  segmented: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#E7E5E4",
    backgroundColor: "#FFFCF7",
  },
  segment: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  segmentSelected: {
    backgroundColor: "#1C1917",
  },
  segmentLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#57534E",
  },
  segmentLabelSelected: {
    color: "#FFFCF7",
  },
  dangerButton: {
    backgroundColor: "#FFFCF7",
    borderWidth: 1,
    borderColor: "#E7E5E4",
    padding: 16,
    gap: 4,
  },
  dangerLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#9F1239",
  },
  dangerHint: {
    fontSize: 14,
    lineHeight: 20,
    color: "#78716C",
  },
});
