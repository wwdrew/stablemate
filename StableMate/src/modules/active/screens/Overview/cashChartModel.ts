import { formatMoney } from "@/lib/money";
import type { LedgerEntry } from "@/store/game";

/** A posted balance, positioned in rounds: `x = 3` is the end of round 3. */
export type CashPoint = { x: number; cash: number };

/**
 * Cash after every posted movement, oldest first, from the $0 start.
 *
 * A battle prize lands at the end of its round (`x = round`). Trades happen
 * between battles, so the ones made after round `r` closed are spread evenly
 * across `(r, r + 1)`. `x` never goes backwards, because a sale posts when it
 * settles, which can be after a later battle.
 */
export function cashSeries(ledger: readonly LedgerEntry[]): CashPoint[] {
  // Ledger is newest-first by posting time; pending sale credits have no balance yet.
  const posted = [...ledger].reverse().filter((entry) => entry.balanceAfter !== null);

  const tradesPerRound = new Map<number, number>();
  for (const entry of posted) {
    if (entry.type !== "prize") {
      tradesPerRound.set(entry.round, (tradesPerRound.get(entry.round) ?? 0) + 1);
    }
  }

  const seen = new Map<number, number>();
  const points: CashPoint[] = [{ x: 0, cash: 0 }];
  for (const entry of posted) {
    let x = entry.round;
    if (entry.type !== "prize") {
      const index = (seen.get(entry.round) ?? 0) + 1;
      seen.set(entry.round, index);
      x = entry.round + index / ((tradesPerRound.get(entry.round) ?? 0) + 1);
    }
    points.push({ x: Math.max(x, points[points.length - 1]!.x), cash: entry.balanceAfter! });
  }

  return points;
}

/**
 * Evenly spaced, round-number ticks from 0 to at least `max`, about `target`
 * of them: 0, 250, 500, 750 rather than 0, 190, 380, 570.
 */
export function niceTicks(max: number, target = 4): number[] {
  if (max <= 0) {
    return [0];
  }

  const rough = max / target;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step =
    [1, 2, 2.5, 5, 10].map((factor) => factor * magnitude).find((candidate) => candidate >= rough) ??
    10 * magnitude;

  const ticks: number[] = [];
  for (let value = 0; value < max + step; value += step) {
    ticks.push(value);
    if (value >= max) {
      break;
    }
  }
  return ticks;
}

/** Which rounds get a number under their tick, so labels don't collide. */
export function roundLabelStep(rounds: number, maxLabels = 8): number {
  return [1, 2, 5, 10, 20, 50, 100].find((step) => rounds / step <= maxLabels) ?? 100;
}

/** What the chart shows, in words, for screen readers. */
export function chartSummary(points: readonly CashPoint[], rounds: number): string {
  const cash = points.map((point) => point.cash);
  const movements = points.length - 1;
  return [
    `Cash chart over ${rounds} ${rounds === 1 ? "round" : "rounds"}`,
    `now ${formatMoney(cash[cash.length - 1]!)}`,
    `highest ${formatMoney(Math.max(...cash))}`,
    `${movements} cash ${movements === 1 ? "movement" : "movements"}`,
  ].join(", ");
}
