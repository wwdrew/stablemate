import { Pressable, Text, View } from "react-native";

import { formatMoney } from "@/lib/money";
import { makeStyles } from "@/theme/colors";

type BuyActionProps = {
  price: number;
  disabled?: boolean;
  statusMessage?: string | null;
  statusTone?: "error" | "info";
  onPress: () => void;
};

export function BuyAction({
  price,
  disabled = false,
  statusMessage = null,
  statusTone = "error",
  onPress,
}: BuyActionProps) {
  const styles = useStyles();
  return (
    <View style={styles.wrap}>
      {statusMessage ? (
        <Text
          style={[styles.status, statusTone === "info" && styles.statusInfo]}
        >{statusMessage}</Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.button,
          pressed && !disabled && styles.buttonPressed,
          disabled && styles.buttonDisabled,
        ]}
      >
        <Text style={styles.buttonLabel}>Buy · {formatMoney(price)}</Text>
      </Pressable>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  wrap: {
    gap: 10,
  },
  status: {
    fontSize: 14,
    color: colors.negative,
    textAlign: "center",
  },
  statusInfo: {
    color: colors.textSecondary,
  },
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
