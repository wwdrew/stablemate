import { StyleSheet, Text, View } from "react-native";

import { useCash } from "@/store/game";

export function CashDisplay() {
  const cash = useCash();

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Cash</Text>
      <Text style={styles.value}>${cash}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 10,
    padding: 10,
  },
  label: {
    fontSize: 12,
    color: "gray",
  },
  value: {
    fontSize: 16,
  },
});
