import { Text, View } from "react-native";

import { formatMoney } from "@/lib/money";
import { useCash } from "@/store/game";
import { makeStyles } from "@/theme/colors";

export function CashDisplay() {
  const styles = useStyles();
  const cash = useCash();

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Cash</Text>
      <Text style={styles.value}>{formatMoney(cash)}</Text>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.separator,
    padding: 16,
    gap: 4,
  },
  label: {
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: colors.textTertiary,
  },
  value: {
    fontSize: 22,
    fontWeight: "600",
    color: colors.text,
  },
}));
