import type { ReactNode } from "react";
import { type StyleProp, View, type ViewStyle } from "react-native";

import { makeStyles } from "@/theme/colors";

/** The bordered surface every panel in the app sits on. */
export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const styles = useStyles();
  return <View style={[styles.card, style]}>{children}</View>;
}

const useStyles = makeStyles((colors) => ({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.separator,
    padding: 16,
  },
}));
