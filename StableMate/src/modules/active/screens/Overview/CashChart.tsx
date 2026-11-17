import { useMemo, useState } from "react";
import { Text, View } from "react-native";
import Svg, { Line, Path, Text as SvgText } from "react-native-svg";

import { formatMoney } from "@/lib/money";
import { useLedger, useRoundsPlayed } from "@/store/game";
import { makeStyles, useColors } from "@/theme/colors";

import { cashSeries, niceTicks, roundLabelStep } from "./cashChartModel";

const HEIGHT = 200;
const LEFT = 52;
const RIGHT = 8;
const TOP = 10;
const BOTTOM = 24;
const TICK = 4;
const LABEL_SIZE = 11;

/**
 * Cash after every posted movement, plotted against rounds. Cash can't go
 * negative (battles never cost money and holds stop overspending), so the
 * baseline is $0 at the bottom.
 */
export function CashChart() {
  const styles = useStyles();
  const colors = useColors();
  const ledger = useLedger();
  const roundsPlayed = useRoundsPlayed();
  const [width, setWidth] = useState(0);

  const points = useMemo(() => cashSeries(ledger), [ledger]);
  const yTicks = niceTicks(Math.max(...points.map((point) => point.cash)));
  const yMax = yTicks[yTicks.length - 1]! || 1;
  // Show every round played, plus the current one if trades happened in it.
  const rounds = Math.max(1, roundsPlayed, Math.ceil(points[points.length - 1]!.x));
  const labelStep = roundLabelStep(rounds);

  const plotWidth = width - LEFT - RIGHT;
  const plotHeight = HEIGHT - TOP - BOTTOM;
  const xFor = (round: number) => LEFT + (round / rounds) * plotWidth;
  const yFor = (cash: number) => TOP + plotHeight - (cash / yMax) * plotHeight;
  const bottom = yFor(0);

  const line = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${xFor(point.x)},${yFor(point.cash)}`)
    .join(" ");
  const area = `${line} L${xFor(points[points.length - 1]!.x)},${bottom} L${xFor(0)},${bottom} Z`;
  const hasData = points.length > 1;

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Cash over time</Text>
      <View
        style={styles.plot}
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        accessibilityLabel={`Cash over ${points.length - 1} transactions and ${rounds} rounds`}
      >
        {width > 0 ? (
          <Svg width={width} height={HEIGHT}>
            {yTicks.map((value) => (
              <Line
                key={`grid-${value}`}
                x1={LEFT - TICK}
                x2={LEFT + plotWidth}
                y1={yFor(value)}
                y2={yFor(value)}
                stroke={colors.separator}
                strokeWidth={value === 0 ? 1 : 0.5}
              />
            ))}
            {yTicks.map((value) => (
              <SvgText
                key={`y-${value}`}
                x={LEFT - TICK - 4}
                y={yFor(value) + LABEL_SIZE / 3}
                fontSize={LABEL_SIZE}
                textAnchor="end"
                fill={colors.textTertiary}
              >
                {formatMoney(value)}
              </SvgText>
            ))}

            {Array.from({ length: rounds + 1 }, (_, round) => (
              <Line
                key={`tick-${round}`}
                x1={xFor(round)}
                x2={xFor(round)}
                y1={bottom}
                y2={bottom + TICK}
                stroke={colors.textTertiary}
                strokeWidth={1}
              />
            ))}
            {/* Each round's number sits under its span; its prize lands at the right-hand tick. */}
            {Array.from({ length: rounds }, (_, index) => index + 1)
              .filter((round) => round === 1 || round % labelStep === 0)
              .map((round) => (
                <SvgText
                  key={`x-${round}`}
                  x={xFor(round - 0.5)}
                  y={bottom + TICK + LABEL_SIZE + 2}
                  fontSize={LABEL_SIZE}
                  textAnchor="middle"
                  fill={colors.textTertiary}
                >
                  {round}
                </SvgText>
              ))}

            {hasData ? (
              <>
                <Path d={area} fill={colors.positive} fillOpacity={0.12} />
                <Path
                  d={line}
                  fill="none"
                  stroke={colors.positive}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </>
            ) : null}
          </Svg>
        ) : null}
        {hasData ? null : (
          <Text style={styles.empty}>Win a prize or trade to start the chart.</Text>
        )}
      </View>
      <Text style={styles.axisTitle}>Round</Text>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.separator,
    padding: 16,
    gap: 8,
  },
  label: {
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: colors.textTertiary,
  },
  plot: {
    width: "100%",
    height: HEIGHT,
    justifyContent: "center",
  },
  axisTitle: {
    alignSelf: "center",
    fontSize: LABEL_SIZE,
    color: colors.textTertiary,
  },
  empty: {
    position: "absolute",
    alignSelf: "center",
    fontSize: 13,
    color: colors.textSecondary,
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
  },
}));
