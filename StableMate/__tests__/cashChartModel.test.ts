import {
  cashSeries,
  chartSummary,
  niceTicks,
  roundLabelStep,
} from "@/modules/active/screens/Overview/cashChartModel";
import type { LedgerEntry } from "@/store/game";

function entry(
  type: LedgerEntry["type"],
  round: number,
  balanceAfter: number | null,
): LedgerEntry {
  return {
    id: `${type}-${round}-${balanceAfter}`,
    type,
    status: balanceAfter === null ? "pending" : "settled",
    amount: 0,
    balanceAfter,
    title: "",
    subtitle: "",
    round,
    createdAt: "",
    settledAt: null,
    failureReason: null,
    ownedId: null,
  };
}

// The ledger is newest-first, so these read bottom-up.
test("prizes land at the end of their round; trades sit between battles", () => {
  const ledger = [
    entry("purchase", 2, 50), // bought after round 2 closed
    entry("prize", 2, 450),
    entry("purchase", 1, 150), // two trades after round 1
    entry("purchase", 1, 200),
    entry("prize", 1, 300),
  ];

  expect(cashSeries(ledger)).toEqual([
    { x: 0, cash: 0 },
    { x: 1, cash: 300 },
    { x: 1 + 1 / 3, cash: 200 },
    { x: 1 + 2 / 3, cash: 150 },
    { x: 2, cash: 450 },
    { x: 2.5, cash: 50 },
  ]);
});

test("pending entries have no balance yet, so they aren't plotted", () => {
  expect(cashSeries([entry("sale", 1, null), entry("prize", 1, 100)])).toHaveLength(2);
});

test("a sale settling after a later battle never moves the line backwards", () => {
  // Sold in round 1, settled after the round-2 prize posted.
  const ledger = [entry("sale", 1, 600), entry("prize", 2, 200), entry("prize", 1, 100)];
  expect(cashSeries(ledger).map((point) => point.x)).toEqual([0, 1, 2, 2]);
});

test("niceTicks picks round steps that cover the maximum", () => {
  expect(niceTicks(570)).toEqual([0, 200, 400, 600]);
  expect(niceTicks(1000)).toEqual([0, 250, 500, 750, 1000]);
  expect(niceTicks(97)).toEqual([0, 25, 50, 75, 100]);
  expect(niceTicks(0)).toEqual([0]);
});

test("round labels thin out as rounds pile up", () => {
  expect(roundLabelStep(6)).toBe(1);
  expect(roundLabelStep(12)).toBe(2);
  expect(roundLabelStep(30)).toBe(5);
});

test("the chart summary reads the latest and highest cash", () => {
  const points = [
    { x: 0, cash: 0 },
    { x: 1, cash: 150 },
    { x: 1.5, cash: 30 },
  ];
  expect(chartSummary(points, 2)).toBe(
    "Cash chart over 2 rounds, now $30, highest $150, 2 cash movements",
  );
  expect(chartSummary(points.slice(0, 2), 1)).toBe(
    "Cash chart over 1 round, now $150, highest $150, 1 cash movement",
  );
});
