import { Pressable, Text, View } from "react-native";

import { formatMoney } from "@/lib/money";
import { makeStyles } from "@/theme/colors";

type SellActionProps = {
  price: number;
  disabled?: boolean;
  statusMessage?: string | null;
  onPress: () => void;
};

export function SellAction({
  price,
  disabled = false,
  statusMessage = null,
  onPress,
}: SellActionProps) {
  const styles = useStyles();
  return (
    <View style={styles.wrap}>
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
        <Text style={styles.buttonLabel}>Sell · {formatMoney(price)}</Text>
      </Pressable>
      {statusMessage ? (
        <Text style={styles.status}>{statusMessage}</Text>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  wrap: {
    gap: 10,
  },
  status: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  button: {
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: colors.surface,
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
    color: colors.text,
    fontSize: 17,
    fontWeight: "600",
  },
}));
