import { Text, View } from "react-native";

import { useRoundsPlayed } from "@/store/game";
import { makeStyles } from "@/theme/colors";

export function RoundsDisplay() {
  const styles = useStyles();
  const roundsPlayed = useRoundsPlayed();

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Rounds played</Text>
      <Text style={styles.value}>{roundsPlayed}</Text>
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
