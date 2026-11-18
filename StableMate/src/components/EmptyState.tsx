import { Text, View } from "react-native";

import { makeStyles } from "@/theme/colors";

import { Card } from "./Card";

type EmptyStateProps = {
  title?: string;
  body?: string;
  /** Centre on a whole screen (not found, loading) instead of a card in a list. */
  fill?: boolean;
};

export function EmptyState({ title, body, fill = false }: EmptyStateProps) {
  const styles = useStyles();
  const copy = (
    <>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {body ? <Text style={styles.body}>{body}</Text> : null}
    </>
  );

  return fill ? (
    <View style={styles.fill}>{copy}</View>
  ) : (
    <Card style={styles.card}>{copy}</Card>
  );
}

const useStyles = makeStyles((colors) => ({
  fill: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    gap: 8,
    backgroundColor: colors.background,
  },
  card: {
    padding: 20,
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.text,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
}));
