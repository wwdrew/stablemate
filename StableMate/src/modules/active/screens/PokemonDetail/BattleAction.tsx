import { Pressable, Text } from "react-native";

import { makeStyles } from "@/theme/colors";

type BattleActionProps = {
  onPress: () => void;
  disabled?: boolean;
};

export function BattleAction({ onPress, disabled = false }: BattleActionProps) {
  const styles = useStyles();
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

const useStyles = makeStyles((colors) => ({
  button: {
    backgroundColor: colors.accent,
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
    color: colors.onAccent,
    fontSize: 17,
    fontWeight: "600",
  },
}));
