import { Pressable, StyleSheet, Text, View } from "react-native";

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
        <Text style={styles.buttonLabel}>Sell · ${price}</Text>
      </Pressable>
      {statusMessage ? (
        <Text style={styles.status}>{statusMessage}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
  },
  status: {
    fontSize: 14,
    color: "#57534E",
    textAlign: "center",
  },
  button: {
    borderWidth: 1,
    borderColor: "#1C1917",
    backgroundColor: "#FFFCF7",
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
    color: "#1C1917",
    fontSize: 17,
    fontWeight: "600",
  },
});
