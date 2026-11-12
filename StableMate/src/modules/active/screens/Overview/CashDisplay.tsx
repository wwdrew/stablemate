import { View, Text, StyleSheet } from "react-native";

export function CashDisplay() {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Cash</Text>
      <Text style={styles.value}>$0</Text>
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
