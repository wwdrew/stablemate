import { Link } from "expo-router";
import { Text, View } from "react-native";

import { Card } from "@/components/Card";
import { SectionLabel } from "@/components/SectionLabel";
import type { TimelineStep } from "@/lib/timeline";
import { makeStyles } from "@/theme/colors";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString();
}

/** Done and failed steps say so in their titles; the others need the state spoken. */
const SPOKEN_STATE: Partial<Record<TimelineStep["state"], string>> = {
  current: "In progress",
  upcoming: "Not yet",
};

function stepLabel(step: TimelineStep): string {
  const state = SPOKEN_STATE[step.state];
  return [
    state ? `${step.title}, ${state}` : step.title,
    step.detail,
    step.at ? formatTime(step.at) : null,
  ]
    .filter(Boolean)
    .join(". ");
}

export function ReceiptTimeline({ steps }: { steps: TimelineStep[] }) {
  const styles = useStyles();

  return (
    <Card>
      <SectionLabel style={styles.heading}>Timeline</SectionLabel>
      {steps.map((step, index) => {
        const last = index === steps.length - 1;
        return (
          <View key={step.title} style={styles.step}>
            <View style={styles.rail}>
              <View style={[styles.dot, styles[`dot_${step.state}`]]} />
              {last ? null : <View style={styles.line} />}
            </View>
            <View style={[styles.copy, last && styles.copyLast]}>
              <View accessible accessibilityLabel={stepLabel(step)} style={styles.copyText}>
                <Text style={[styles.title, step.state === "upcoming" && styles.titleUpcoming]}>
                  {step.title}
                </Text>
                {step.detail ? <Text style={styles.detail}>{step.detail}</Text> : null}
                {step.at ? <Text style={styles.time}>{formatTime(step.at)}</Text> : null}
              </View>
              {step.linkedEntryId ? (
                <Link
                  href={{ pathname: "/history/[entryId]", params: { entryId: step.linkedEntryId } }}
                  style={styles.link}
                >
                  View receipt
                </Link>
              ) : null}
            </View>
          </View>
        );
      })}
    </Card>
  );
}

const DOT = 12;

const useStyles = makeStyles((colors) => ({
  heading: {
    marginBottom: 12,
  },
  step: {
    flexDirection: "row",
    gap: 12,
  },
  rail: {
    width: DOT,
    alignItems: "center",
  },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    marginTop: 3,
    borderWidth: 2,
  },
  dot_done: {
    backgroundColor: colors.positive,
    borderColor: colors.positive,
  },
  dot_current: {
    backgroundColor: colors.surface,
    borderColor: colors.pending,
  },
  dot_failed: {
    backgroundColor: colors.negative,
    borderColor: colors.negative,
  },
  dot_upcoming: {
    backgroundColor: colors.surface,
    borderColor: colors.separator,
  },
  line: {
    flex: 1,
    width: 2,
    marginVertical: 2,
    backgroundColor: colors.separator,
  },
  copy: {
    flex: 1,
    gap: 2,
    paddingBottom: 18,
  },
  copyText: {
    gap: 2,
  },
  copyLast: {
    paddingBottom: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  titleUpcoming: {
    color: colors.textTertiary,
  },
  detail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  time: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  link: {
    alignSelf: "flex-start",
    // Pads the tap target to 44pt without moving the text.
    paddingVertical: 12,
    marginVertical: -8,
    fontSize: 14,
    fontWeight: "600",
    color: colors.accent,
  },
}));
