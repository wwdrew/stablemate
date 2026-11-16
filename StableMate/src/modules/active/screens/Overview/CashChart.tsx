import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useLedger } from "@/store/game";

const PAD = 12;
const STROKE = 2;
const POSITIVE = "#15803D";
const NEGATIVE = "#B91C1C";

type Point = { x: number; y: number; cash: number };

function Segment({ from, to }: { from: Point; to: Point }) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);

  // A thin bar centred on the segment midpoint, rotated to join the two points.
  return (
    <View
      style={{
        position: "absolute",
        left: (from.x + to.x) / 2 - length / 2,
        top: (from.y + to.y) / 2 - STROKE / 2,
        width: length,
        height: STROKE,
        backgroundColor: (from.cash + to.cash) / 2 >= 0 ? POSITIVE : NEGATIVE,
        transform: [{ rotate: `${Math.atan2(dy, dx)}rad` }],
      }}
    />
  );
}

/** Splits any segment that crosses zero so each half takes its own colour. */
function splitAtZero(points: Point[], baselineY: number): [Point, Point][] {
  const segments: [Point, Point][] = [];

  for (let index = 1; index < points.length; index += 1) {
    const from = points[index - 1]!;
    const to = points[index]!;

    if (from.cash >= 0 === to.cash >= 0 || from.cash === 0 || to.cash === 0) {
      segments.push([from, to]);
      continue;
    }

    const t = from.cash / (from.cash - to.cash);
    const crossing = { x: from.x + (to.x - from.x) * t, y: baselineY, cash: 0 };
    segments.push([from, { ...crossing, cash: from.cash }]);
    segments.push([{ ...crossing, cash: to.cash }, to]);
  }

  return segments;
}

/**
 * Cash after every movement that posted to the ledger, oldest first, from the
 * $0 starting balance. Baseline is $0 through the vertical centre.
 */
export function CashChart() {
  const ledger = useLedger();
  const balances = useMemo(
    () => [
      0,
      // Ledger is newest-first by posting time; pending sale credits have no balance yet.
      ...[...ledger]
        .reverse()
        .flatMap((entry) => (entry.balanceAfter === null ? [] : [entry.balanceAfter])),
    ],
    [ledger],
  );
  const [width, setWidth] = useState(0);
  const height = width / 2;
  const baselineY = height / 2;

  const maxAbs = Math.max(1, ...balances.map((cash) => Math.abs(cash)));
  const step = balances.length > 1 ? (width - PAD * 2) / (balances.length - 1) : 0;
  const points: Point[] = balances.map((cash, index) => ({
    x: PAD + index * step,
    y: baselineY - (cash / maxAbs) * (baselineY - PAD),
    cash,
  }));

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Cash over time</Text>
      <View
        style={[styles.plot, { height }]}
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        accessibilityLabel={`Cash over ${balances.length - 1} transactions`}
      >
        {width > 0 ? (
          <>
            <View style={[styles.baseline, { top: baselineY }]} />
            <Text style={[styles.axisLabel, { top: 0 }]}>${maxAbs}</Text>
            <Text style={[styles.axisLabel, { top: baselineY + 2 }]}>$0</Text>
            {splitAtZero(points, baselineY).map(([from, to], index) => (
              <Segment key={index} from={from} to={to} />
            ))}
          </>
        ) : null}
        {balances.length < 2 ? (
          <Text style={styles.empty}>Win a prize or trade to start the chart.</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFCF7",
    borderWidth: 1,
    borderColor: "#E7E5E4",
    padding: 16,
    gap: 12,
  },
  label: {
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "#A8A29E",
  },
  plot: {
    width: "100%",
    justifyContent: "center",
  },
  baseline: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "#1C1917",
  },
  axisLabel: {
    position: "absolute",
    left: 0,
    fontSize: 11,
    color: "#A8A29E",
  },
  empty: {
    alignSelf: "center",
    fontSize: 13,
    color: "#78716C",
    backgroundColor: "#FFFCF7",
    paddingHorizontal: 8,
  },
});
