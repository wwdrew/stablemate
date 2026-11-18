import { type StyleProp, Text, type TextStyle } from "react-native";

import { makeStyles } from "@/theme/colors";

/** The small uppercase heading above a card's value or a group of controls. */
export function SectionLabel({ children, style }: { children: string; style?: StyleProp<TextStyle> }) {
  const styles = useStyles();
  return (
    <Text style={[styles.label, style]} accessibilityRole="header">
      {children}
    </Text>
  );
}

const useStyles = makeStyles((colors) => ({
  label: {
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: colors.textSecondary,
  },
}));
