import { Pressable, StyleSheet, Text } from "react-native";

export function BattleAction() {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        // Battle / end-round flow lands next.
      }}
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
    >
      <Text style={styles.buttonLabel}>Battle</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#1C1917",
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonLabel: {
    color: "#FFFCF7",
    fontSize: 17,
    fontWeight: "600",
  },
});
