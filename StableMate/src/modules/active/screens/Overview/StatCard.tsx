import type { StyleProp, ViewStyle } from "react-native";
import { Text } from "react-native";

import { Card } from "@/components/Card";
import { SectionLabel } from "@/components/SectionLabel";
import { makeStyles } from "@/theme/colors";

type StatCardProps = {
  label: string;
  value: string;
  meta?: string;
  style?: StyleProp<ViewStyle>;
};

export function StatCard({ label, value, meta, style }: StatCardProps) {
  const styles = useStyles();
  return (
    <Card style={[styles.card, style]}>
      <SectionLabel>{label}</SectionLabel>
      <Text style={styles.value}>{value}</Text>
      {meta ? <Text style={styles.meta}>{meta}</Text> : null}
    </Card>
  );
}

const useStyles = makeStyles((colors) => ({
  card: {
    gap: 4,
  },
  value: {
    fontSize: 22,
    fontWeight: "600",
    color: colors.text,
  },
  meta: {
    fontSize: 14,
    color: colors.textSecondary,
  },
}));
