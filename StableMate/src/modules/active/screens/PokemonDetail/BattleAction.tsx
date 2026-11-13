import { Pressable, StyleSheet, Text } from "react-native";

type BattleActionProps = {
  onPress: () => void;
  disabled?: boolean;
};

export function BattleAction({ onPress, disabled = false }: BattleActionProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
        disabled && styles.buttonDisabled,
      ]}
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
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonLabel: {
    color: "#FFFCF7",
    fontSize: 17,
    fontWeight: "600",
  },
});
