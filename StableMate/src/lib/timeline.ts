import { settlementFailureMessage } from "@/api/settlement";
import { settlementWaitCopy } from "@/lib/ledger";
import { formatMoney } from "@/lib/money";
import type { LedgerEntry } from "@/store/game";

export type TimelineStepState = "done" | "current" | "failed" | "upcoming";

export type TimelineStep = {
  title: string;
  detail: string | null;
  /** ISO timestamp, or `null` for steps that haven't happened. */
  at: string | null;
  state: TimelineStepState;
  /** Another ledger entry this step links to, e.g. a purchase's refund. */
  linkedEntryId: string | null;
};

function step(
  title: string,
  state: TimelineStepState,
  { detail = null, at = null, linkedEntryId = null }: Partial<TimelineStep> = {},
): TimelineStep {
  return { title, detail, at, state, linkedEntryId };
}

/**
 * The life of a transaction, for its receipt: how the money moved, what it's
 * waiting on, and how it ended. A failed purchase and its refund are separate
 * ledger entries (the ledger is append-only), so each links to the other.
 */
export function receiptTimeline(
  entry: LedgerEntry,
  ledger: readonly LedgerEntry[],
  isOnline: boolean,
): TimelineStep[] {
  const reason = entry.failureReason ? settlementFailureMessage(entry.failureReason) : null;

  switch (entry.type) {
    case "prize":
      return [step("Prize paid", "done", { at: entry.createdAt, detail: "Credited straight away." })];

    case "refund": {
      const purchase = ledger.find(
        (item) => item.type === "purchase" && item.ownedId === entry.ownedId,
      );
      return [
        step("Purchase failed", "failed", {
          at: purchase?.settledAt ?? null,
          detail: entry.subtitle,
          linkedEntryId: purchase?.id ?? null,
        }),
        step("Refund issued", "done", {
          at: entry.createdAt,
          detail: `${formatMoney(entry.amount)} back in your wallet.`,
        }),
      ];
    }

    case "purchase": {
      const held = step("Funds held", "done", {
        at: entry.createdAt,
        detail: `${formatMoney(-entry.amount)} set aside so it can’t be spent twice.`,
      });

      if (entry.status === "pending") {
        return [
          held,
          step("Waiting to settle", "current", { detail: settlementWaitCopy(isOnline) }),
          step("Purchase settled", "upcoming"),
        ];
      }
      if (entry.status === "settled") {
        return [
          held,
          step("Purchase settled", "done", { at: entry.settledAt, detail: "The hold became the payment." }),
        ];
      }

      const refund = ledger.find(
        (item) => item.type === "refund" && item.ownedId === entry.ownedId,
      );
      return [
        held,
        step("Purchase failed", "failed", { at: entry.settledAt, detail: reason }),
        step("Refunded", "done", {
          at: refund?.createdAt ?? null,
          detail: `${formatMoney(-entry.amount)} released back to your wallet.`,
          linkedEntryId: refund?.id ?? null,
        }),
      ];
    }

    case "sale": {
      const placed = step("Sale placed", "done", {
        at: entry.createdAt,
        detail: `${formatMoney(entry.amount)} credits once a buyer pays.`,
      });

      if (entry.status === "pending") {
        return [
          placed,
          step("Waiting for a buyer", "current", { detail: settlementWaitCopy(isOnline) }),
          step("Sale settled", "upcoming"),
        ];
      }
      if (entry.status === "settled") {
        return [
          placed,
          step("Sale settled", "done", {
            at: entry.settledAt,
            detail: `${formatMoney(entry.amount)} credited.`,
          }),
        ];
      }
      return [
        placed,
        step("Sale failed", "failed", { at: entry.settledAt, detail: reason }),
        step("Back in your stable", "done", { at: entry.settledAt, detail: "Nothing was credited." }),
      ];
    }

    default: {
      const _exhaustive: never = entry.type;
      return _exhaustive;
    }
  }
}
