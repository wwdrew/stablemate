import type { SettlementOutcome } from "@/store/settings";

export type SettlementFailureReason = "sold_out" | "no_buyers";

export type SettlementResult =
  | { ok: true }
  | { ok: false; reason: SettlementFailureReason };

/** Simulated round-trip to the "exchange" for each queued transaction. */
export const SETTLEMENT_LATENCY_MS = 1500;

const FAILURE_RATE = {
  purchase: 0.1,
  sale: 0.2,
} as const;

const FAILURE_REASON: Record<
  keyof typeof FAILURE_RATE,
  SettlementFailureReason
> = {
  purchase: "sold_out",
  sale: "no_buyers",
};

/** Decides whether a pending purchase or sale clears. Local stand-in for an exchange API. */
export function decideSettlement(
  type: keyof typeof FAILURE_RATE,
  outcome: SettlementOutcome = "random",
): SettlementResult {
  const fails =
    outcome === "random" ? Math.random() < FAILURE_RATE[type] : outcome === "fail";

  return fails ? { ok: false, reason: FAILURE_REASON[type] } : { ok: true };
}

export function settlementFailureMessage(reason: SettlementFailureReason): string {
  switch (reason) {
    case "sold_out":
      return "Sold out before your order cleared";
    case "no_buyers":
      return "No buyers at your price";
    default: {
      const _exhaustive: never = reason;
      return _exhaustive;
    }
  }
}
