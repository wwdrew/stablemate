import { Pressable, StyleSheet, Text, View } from "react-native";

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
        <Text style={styles.buttonLabel}>Buy · ${price}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
  },
  status: {
    fontSize: 14,
    color: "#B91C1C",
    textAlign: "center",
  },
  statusInfo: {
    color: "#57534E",
  },
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
